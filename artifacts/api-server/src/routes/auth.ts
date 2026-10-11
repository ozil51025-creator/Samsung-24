import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { and, count, desc, eq, gte, gt, inArray, sql, sum } from "drizzle-orm";
import {
  db,
  phoneAccountsTable,
  giftCodesTable,
  phoneReferralCodesTable,
  phoneSessionsTable,
  presenceClaimsTable,
  productCatalogTable,
  productOrdersTable,
  payoutAccountsTable,
  rechargeRequestsTable,
  taskCenterSettingsTable,
  teamDepositMilestoneClaimsTable,
  referralCommissionsTable,
  withdrawalRequestsTable,
} from "@workspace/db";
import {
  CreateWithdrawalBody,
  CreateWithdrawalResponse,
  GetMyWithdrawalsResponse,
  GetMyPayoutAccountResponse,
  SaveMyPayoutAccountBody,
  SaveMyPayoutAccountResponse,
  GetCurrentPhoneAccountResponse,
  GetMyProductOrdersResponse,
  GetTeamDepositMilestonesResponse,
  GetTaskCenterClaimsResponse,
  GetTaskCenterSettingsResponse,
  ClaimTaskCenterTaskResponse,
  LoginPhoneAccountBody,
  LoginPhoneAccountResponse,
  RegisterPhoneAccountBody,
  RegisterPhoneAccountResponse,
  PurchaseProductResponse,
  GetAdminSiteSettingsResponse,
  GetReferralSummaryResponse,
  GetReferralDetailsResponse,
  RedeemGiftCodeBody,
  RedeemGiftCodeResponse,
} from "@workspace/api-zod";
import { calculateLevelOneToThreeTeamDeposits, getReferralAncestorsThroughLevelThree, TEAM_DEPOSIT_MILESTONES } from "../lib/team-deposit-milestones";
import { readSiteSettings } from "../lib/site-settings";

const router: IRouter = Router();
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const SCRYPT_COST = 32_768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const DUMMY_SALT = Buffer.from("rewards-phone-login-dummy-salt");
const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERRAL_CODE_UNIQUE_INDEX = "phone_referral_codes_code_unique";
const attempts = new Map<string, { count: number; resetAt: number }>();

function sessionCookieName() {
  return process.env.NODE_ENV === "production" ? "__Host-rewards_session" : "rewards_session";
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_LIFETIME_MS,
  };
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function kampalaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function currentAccountId(req: Request, res: Response): Promise<string | null> {
  const token = req.cookies?.[sessionCookieName()];
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    res.status(401).json({ error: "Not signed in." });
    return null;
  }
  const [account] = await db
    .select({ id: phoneAccountsTable.id })
    .from(phoneSessionsTable)
    .innerJoin(phoneAccountsTable, eq(phoneSessionsTable.accountId, phoneAccountsTable.id))
    .where(and(
      eq(phoneSessionsTable.tokenHash, hashSessionToken(token)),
      gt(phoneSessionsTable.expiresAt, new Date()),
      eq(phoneAccountsTable.isActive, true),
    ))
    .limit(1);
  if (!account) {
    res.status(401).json({ error: "Not signed in." });
    return null;
  }
  return account.id;
}

async function currentPresenceTask() {
  const [settings] = await db
    .select({ tasks: taskCenterSettingsTable.tasks })
    .from(taskCenterSettingsTable)
    .limit(1);
  const tasks = Array.isArray(settings?.tasks) ? settings.tasks : [];
  const configured = tasks.find((task) =>
    task && typeof task === "object" && "id" in task && task.id === "presence"
  ) as { enabled?: unknown; rewardUgx?: unknown } | undefined;
  const rewardUgx = typeof configured?.rewardUgx === "number" && Number.isSafeInteger(configured.rewardUgx) && configured.rewardUgx > 0
    ? configured.rewardUgx
    : 500;
  return { enabled: configured ? configured.enabled === true : true, rewardUgx };
}

function createReferralCode() {
  const random = randomBytes(10);
  return Array.from(random, (byte) => REFERRAL_ALPHABET[byte & 31]).join("");
}

function databaseErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { code: undefined, constraint: undefined };
  return {
    code: "code" in error && typeof error.code === "string" ? error.code : undefined,
    constraint: "constraint" in error && typeof error.constraint === "string" ? error.constraint : undefined,
  };
}

async function ensureReferralCode(accountId: string) {
  const findCode = async () => {
    const [profile] = await db
      .select({ referralCode: phoneReferralCodesTable.referralCode })
      .from(phoneReferralCodesTable)
      .where(eq(phoneReferralCodesTable.accountId, accountId))
      .limit(1);
    return profile?.referralCode;
  };

  const existingCode = await findCode();
  if (existingCode) return existingCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = createReferralCode();
    try {
      await db.insert(phoneReferralCodesTable).values({ accountId, referralCode });
      return referralCode;
    } catch (error) {
      const details = databaseErrorDetails(error);
      if (details.code === "23505") {
        const concurrentCode = await findCode();
        if (concurrentCode) return concurrentCode;
        if (details.constraint === REFERRAL_CODE_UNIQUE_INDEX) continue;
      }
      throw error;
    }
  }

  throw new Error("Could not generate a unique referral code.");
}

function normalizeUgandanMobileNumber(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;

  let nationalNumber = compact.startsWith("+") ? compact.slice(1) : compact;
  if (nationalNumber.startsWith("256")) nationalNumber = nationalNumber.slice(3);
  if (nationalNumber.startsWith("0")) nationalNumber = nationalNumber.slice(1);

  return /^7\d{8}$/.test(nationalNumber) ? `+256${nationalNumber}` : null;
}

function derivePasswordKey(password: string, salt: Buffer, keyLength = 64) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keyLength,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derivePasswordKey(password, salt);
  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

async function verifyPassword(password: string, storedHash: string | undefined) {
  if (!storedHash) {
    await derivePasswordKey(password, DUMMY_SALT);
    return false;
  }

  const [algorithm, cost, blockSize, parallelization, saltText, keyText] = storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    cost !== String(SCRYPT_COST) ||
    blockSize !== String(SCRYPT_BLOCK_SIZE) ||
    parallelization !== String(SCRYPT_PARALLELIZATION) ||
    !saltText ||
    !keyText
  ) {
    await derivePasswordKey(password, DUMMY_SALT);
    return false;
  }

  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(keyText, "base64url");
  if (salt.length !== 16 || expected.length !== 64) {
    await derivePasswordKey(password, DUMMY_SALT);
    return false;
  }

  const actual = await derivePasswordKey(password, salt);
  return timingSafeEqual(expected, actual);
}

function allowAttempt(scope: string, identity: string, limit: number) {
  const now = Date.now();
  if (attempts.size > 20_000) {
    for (const [key, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(key);
    }
  }

  const key = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function isRateLimited(req: Request, res: Response, scope: string, phoneNumber?: string) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const ipAllowed = allowAttempt(`${scope}:ip`, ip, scope === "register" ? 25 : 30);
  const phoneAllowed = phoneNumber
    ? allowAttempt(`${scope}:phone`, phoneNumber, scope === "register" ? 4 : 10)
    : true;
  if (ipAllowed && phoneAllowed) return false;

  res.setHeader("Retry-After", String(RATE_WINDOW_MS / 1000));
  res.status(429).json({ error: "Too many attempts. Wait 15 minutes and try again." });
  return true;
}

async function requireSameOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.get("origin");
  const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = (forwardedHost || req.get("host"))?.split(",")[0]?.trim();

  try {
    if (!origin || !requestHost || new URL(origin).host.toLowerCase() !== requestHost.toLowerCase()) {
      res.status(403).json({ error: "Request origin was not accepted." });
      return;
    }
    const allowed = (await readSiteSettings()).allowedWebsiteDomains
      .split(/[\n,]/).map((domain) => domain.trim().toLowerCase()).filter(Boolean);
    const originHost = new URL(origin).hostname.toLowerCase();
    if (allowed.length && !allowed.includes(originHost)) {
      res.status(403).json({ error: "This website domain is not allowed." });
      return;
    }
  } catch {
    res.status(403).json({ error: "Request origin was not accepted." });
    return;
  }

  next();
}

async function createSession(accountId: string, res: Response) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  await db.insert(phoneSessionsTable).values({
    tokenHash: hashSessionToken(token),
    accountId,
    expiresAt,
  });
  res.cookie(sessionCookieName(), token, sessionCookieOptions());
}

function publicAccount(
  account: {
    id: string;
    phoneNumber: string;
    createdAt: Date;
    walletBalanceUgx: number;
    totalAccumulatedUgx: number;
  },
  referralCode: string,
) {
  return {
    id: account.id,
    phoneNumber: account.phoneNumber,
    createdAt: account.createdAt.toISOString(),
    referralCode,
    walletBalanceUgx: account.walletBalanceUgx,
    totalAccumulatedUgx: account.totalAccumulatedUgx,
  };
}

router.post("/auth/register", requireSameOrigin, async (req, res) => {
  if (isRateLimited(req, res, "register")) return;

  const parsed = RegisterPhoneAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Check the phone number, password, and referral code.",
    });
    return;
  }

  const phoneNumber = normalizeUgandanMobileNumber(parsed.data.phoneNumber);
  if (!phoneNumber) {
    res.status(400).json({ error: "Enter a valid Ugandan mobile number." });
    return;
  }
  if (isRateLimited(req, res, "register", phoneNumber)) return;

  try {
    const siteSettings = await readSiteSettings();
    if (siteSettings.maintenanceMode) {
      res.status(503).json({ error: siteSettings.maintenanceMessage });
      return;
    }
    const suppliedReferralCode = parsed.data.referralCode?.trim().toUpperCase();
    if (siteSettings.requireReferralCode && !suppliedReferralCode) {
      res.status(400).json({ error: "A referral code is required to create an account." });
      return;
    }
    let referredByAccountId: string | null = null;
    if (suppliedReferralCode) {
      const [referrer] = await db
        .select({ accountId: phoneReferralCodesTable.accountId })
        .from(phoneReferralCodesTable)
        .where(eq(phoneReferralCodesTable.referralCode, suppliedReferralCode))
        .limit(1);
      if (!referrer) {
        res.status(400).json({
          error: "That referral code could not be found. Check the invite link or remove the code to continue.",
        });
        return;
      }
      referredByAccountId = referrer.accountId;
    }

    const existing = await db
      .select({ id: phoneAccountsTable.id })
      .from(phoneAccountsTable)
      .where(eq(phoneAccountsTable.phoneNumber, phoneNumber))
      .limit(1);
    if (existing.length) {
      res.status(409).json({ error: "That phone number already has an account. Try signing in." });
      return;
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const token = randomBytes(32).toString("hex");
    let account: {
      id: string;
      phoneNumber: string;
      createdAt: Date;
      walletBalanceUgx: number;
      totalAccumulatedUgx: number;
    } | undefined;
    let referralCode = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidateReferralCode = createReferralCode();
      try {
        account = await db.transaction(async (tx) => {
          const [created] = await tx
            .insert(phoneAccountsTable)
            .values({ phoneNumber, passwordHash, walletBalanceUgx: siteSettings.signupBonusUgx, totalAccumulatedUgx: siteSettings.signupBonusUgx })
            .returning({
              id: phoneAccountsTable.id,
              phoneNumber: phoneAccountsTable.phoneNumber,
              createdAt: phoneAccountsTable.createdAt,
              walletBalanceUgx: phoneAccountsTable.walletBalanceUgx,
              totalAccumulatedUgx: phoneAccountsTable.totalAccumulatedUgx,
            });
          await tx.insert(phoneReferralCodesTable).values({
            accountId: created.id,
            referralCode: candidateReferralCode,
            referredByAccountId,
          });
          await tx.insert(phoneSessionsTable).values({
            tokenHash: hashSessionToken(token),
            accountId: created.id,
            expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS),
          });
          return created;
        });
        referralCode = candidateReferralCode;
        break;
      } catch (error) {
        const details = databaseErrorDetails(error);
        if (details.code === "23505" && details.constraint === REFERRAL_CODE_UNIQUE_INDEX && attempt < 4) {
          continue;
        }
        throw error;
      }
    }

    if (!account || !referralCode) throw new Error("Could not create an account referral code.");
    res.cookie(sessionCookieName(), token, sessionCookieOptions());
    res.status(201).json(RegisterPhoneAccountResponse.parse({ user: publicAccount(account, referralCode) }));
  } catch (error) {
    const details = databaseErrorDetails(error);
    req.log.error({ errorCode: details.code, route: "auth.register" }, "Phone account registration failed");
    const duplicate = details.code === "23505" && details.constraint === "phone_accounts_phone_number_unique";
    res.status(duplicate ? 409 : 500).json({
      error: duplicate
        ? "That phone number already has an account. Try signing in."
        : "Could not create your account. Try again.",
    });
  }
});

router.post("/auth/login", requireSameOrigin, async (req, res) => {
  if (isRateLimited(req, res, "login")) return;

  const parsed = LoginPhoneAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Enter a valid Ugandan mobile number and password.",
    });
    return;
  }

  const phoneNumber = normalizeUgandanMobileNumber(parsed.data.phoneNumber);
  if (!phoneNumber) {
    res.status(401).json({ error: "Invalid phone number or password." });
    return;
  }
  if (isRateLimited(req, res, "login", phoneNumber)) return;

  try {
    const [account] = await db
      .select()
      .from(phoneAccountsTable)
      .where(eq(phoneAccountsTable.phoneNumber, phoneNumber))
      .limit(1);
    const passwordValid = await verifyPassword(parsed.data.password, account?.passwordHash);
    if (!passwordValid || !account?.isActive) {
      res.status(401).json({ error: "Invalid phone number or password." });
      return;
    }

    const referralCode = await ensureReferralCode(account.id);
    await createSession(account.id, res);
    res.json(LoginPhoneAccountResponse.parse({ user: publicAccount(account, referralCode) }));
  } catch (error) {
    const details = databaseErrorDetails(error);
    req.log.error({ errorCode: details.code, route: "auth.login" }, "Phone account sign-in failed");
    res.status(500).json({ error: "Could not sign you in. Try again." });
  }
});

router.post("/auth/logout", requireSameOrigin, async (req, res) => {
  const token = req.cookies?.[sessionCookieName()];
  if (typeof token === "string" && /^[a-f0-9]{64}$/i.test(token)) {
    try {
      await db.delete(phoneSessionsTable).where(eq(phoneSessionsTable.tokenHash, hashSessionToken(token)));
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
      req.log.error({ errorCode: code, route: "auth.logout" }, "Phone account sign-out failed");
      res.status(500).json({ error: "Could not sign you out. Try again." });
      return;
    }
  }

  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions();
  res.clearCookie(sessionCookieName(), clearOptions);
  res.status(204).end();
});

router.get("/auth/me", async (req, res) => {
  const token = req.cookies?.[sessionCookieName()];
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }

  try {
    const [account] = await db
      .select({
        id: phoneAccountsTable.id,
        phoneNumber: phoneAccountsTable.phoneNumber,
        createdAt: phoneAccountsTable.createdAt,
        walletBalanceUgx: phoneAccountsTable.walletBalanceUgx,
        totalAccumulatedUgx: phoneAccountsTable.totalAccumulatedUgx,
        isActive: phoneAccountsTable.isActive,
      })
      .from(phoneSessionsTable)
      .innerJoin(phoneAccountsTable, eq(phoneSessionsTable.accountId, phoneAccountsTable.id))
      .where(and(
        eq(phoneSessionsTable.tokenHash, hashSessionToken(token)),
        gt(phoneSessionsTable.expiresAt, new Date()),
      eq(phoneAccountsTable.isActive, true),
      ))
      .limit(1);

    if (!account) {
      res.clearCookie(sessionCookieName(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    const referralCode = await ensureReferralCode(account.id);
    res.json(GetCurrentPhoneAccountResponse.parse({ user: publicAccount(account, referralCode) }));
  } catch (error) {
    const details = databaseErrorDetails(error);
    req.log.error({ errorCode: details.code, route: "auth.me" }, "Phone account session lookup failed");
    res.status(500).json({ error: "Could not check your account session." });
  }
});

router.get("/team-deposit-milestones", async (req, res): Promise<void> => {
  try {
    const accountId = await currentAccountId(req, res);
    if (!accountId) return;
    const accounts = await db.select({
      id: phoneAccountsTable.id,
      totalDepositedUgx: phoneAccountsTable.totalDepositedUgx,
    }).from(phoneAccountsTable);
    const referralLinks = await db.select({
      accountId: phoneReferralCodesTable.accountId,
      referredByAccountId: phoneReferralCodesTable.referredByAccountId,
    }).from(phoneReferralCodesTable);
    const teamDepositsUgx = calculateLevelOneToThreeTeamDeposits(accounts, referralLinks).get(accountId) ?? 0;
    const claims = await db.select({
      milestoneId: teamDepositMilestoneClaimsTable.milestoneId,
      rewardUgx: teamDepositMilestoneClaimsTable.rewardUgx,
    }).from(teamDepositMilestoneClaimsTable)
      .where(eq(teamDepositMilestoneClaimsTable.accountId, accountId));
    res.json(GetTeamDepositMilestonesResponse.parse({
      teamDepositsUgx,
      totalRewardsUgx: claims.reduce((total, claim) => total + claim.rewardUgx, 0),
      milestones: TEAM_DEPOSIT_MILESTONES.map((milestone) => ({
        ...milestone,
        received: claims.some((claim) => claim.milestoneId === milestone.id),
      })),
    }));
  } catch (error) {
    req.log.error({ error, route: "team-deposit-milestones.get" }, "Could not load deposit milestones");
    res.status(500).json({ error: "Could not load deposit milestones." });
  }
});

function isClaimableInviteTask(task: { id: string; title: string }) {
  return task.id.toLowerCase().startsWith("invite-")
    || /invite.*(?:level\s*1|level\s*one|niveau\s*1)/i.test(task.title);
}

router.get("/task-center/claims", async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  try {
    const [stored] = await db.select({ tasks: taskCenterSettingsTable.tasks })
      .from(taskCenterSettingsTable).where(eq(taskCenterSettingsTable.id, "default")).limit(1);
    const taskIds = GetTaskCenterSettingsResponse.parse({ tasks: stored?.tasks ?? [] }).tasks
      .filter((task) => task.enabled && isClaimableInviteTask(task))
      .map((task) => `task-center:${task.id}`);
    const claims = await db.select({ milestoneId: teamDepositMilestoneClaimsTable.milestoneId })
      .from(teamDepositMilestoneClaimsTable)
      .where(eq(teamDepositMilestoneClaimsTable.accountId, accountId));
    const claimedTaskIds = claims.flatMap(({ milestoneId }) => {
      if (!taskIds.includes(milestoneId)) return [];
      return [milestoneId.slice("task-center:".length)];
    });
    res.setHeader("Cache-Control", "no-store");
    res.json(GetTaskCenterClaimsResponse.parse({ claimedTaskIds }));
  } catch (error) {
    req.log.error({ error, route: "task-center.claims.get" }, "Could not load claimed tasks");
    res.status(500).json({ error: "Could not load claimed tasks." });
  }
});

router.post("/task-center/:taskId/claim", requireSameOrigin, async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  const taskId = req.params.taskId;
  if (typeof taskId !== "string" || !taskId || taskId.length > 120) {
    res.status(400).json({ error: "Invalid task." });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [stored] = await tx.select({ tasks: taskCenterSettingsTable.tasks })
        .from(taskCenterSettingsTable).where(eq(taskCenterSettingsTable.id, "default")).limit(1);
      const tasks = GetTaskCenterSettingsResponse.parse({ tasks: stored?.tasks ?? [] }).tasks;
      const task = tasks.find((item) => item.id === taskId);
      if (!task || !task.enabled || !isClaimableInviteTask(task) || task.rewardUgx === null) {
        return { status: 404 as const, error: "This task is not available to claim." };
      }
      const eligibleMembers = await tx.select({ accountId: phoneAccountsTable.id })
        .from(phoneAccountsTable)
        .innerJoin(phoneReferralCodesTable, eq(phoneReferralCodesTable.accountId, phoneAccountsTable.id))
        .innerJoin(productOrdersTable, eq(productOrdersTable.buyerAccountId, phoneAccountsTable.id))
        .where(and(
          eq(phoneReferralCodesTable.referredByAccountId, accountId),
          sql`${phoneAccountsTable.totalDepositedUgx} > 0`,
        ))
        .groupBy(phoneAccountsTable.id);
      if (eligibleMembers.length < task.objective) {
        return { status: 400 as const, error: "Complete the task requirements before claiming." };
      }
      const [claim] = await tx.insert(teamDepositMilestoneClaimsTable)
        .values({ accountId, milestoneId: `task-center:${task.id}`, rewardUgx: task.rewardUgx })
        .onConflictDoNothing()
        .returning({ id: teamDepositMilestoneClaimsTable.id });
      if (!claim) return { status: 409 as const, error: "This task reward has already been claimed." };
      const [account] = await tx.update(phoneAccountsTable)
        .set({
          walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${task.rewardUgx}`,
          totalAccumulatedUgx: sql`${phoneAccountsTable.totalAccumulatedUgx} + ${task.rewardUgx}`,
        })
        .where(eq(phoneAccountsTable.id, accountId))
        .returning({ walletBalanceUgx: phoneAccountsTable.walletBalanceUgx });
      if (!account) throw new Error("Claiming account no longer exists.");
      return { status: 200 as const, taskId: task.id, rewardUgx: task.rewardUgx, walletBalanceUgx: account.walletBalanceUgx, wasNewClaim: true };
    });
    if (result.status !== 200) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(ClaimTaskCenterTaskResponse.parse(result));
  } catch (error) {
    req.log.error({ error, route: "task-center.claim.post" }, "Could not claim task reward");
    res.status(500).json({ error: "Could not claim this reward right now." });
  }
});

router.get("/site-settings", async (req, res): Promise<void> => {
  try {
    res.json(GetAdminSiteSettingsResponse.parse(await readSiteSettings()));
  } catch (error) {
    req.log.error({ error, route: "site-settings.get" }, "Could not load public site settings");
    res.status(500).json({ error: "Could not load site settings." });
  }
});

router.post("/gift-codes/redeem", requireSameOrigin, async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  const parsed = RedeemGiftCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid gift code." });
    return;
  }
  const code = parsed.data.code.trim().toUpperCase();
  try {
    const result = await db.transaction(async (tx) => {
      const [gift] = await tx.select().from(giftCodesTable).where(eq(giftCodesTable.code, code)).for("update").limit(1);
      if (!gift || gift.redeemedAt) return null;
      const [member] = await tx.update(phoneAccountsTable)
        .set({
          walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${gift.amountUgx}`,
          totalAccumulatedUgx: sql`${phoneAccountsTable.totalAccumulatedUgx} + ${gift.amountUgx}`,
        }).where(eq(phoneAccountsTable.id, accountId))
        .returning({ walletBalanceUgx: phoneAccountsTable.walletBalanceUgx });
      if (!member) return null;
      await tx.update(giftCodesTable).set({ redeemedByAccountId: accountId, redeemedAt: new Date() }).where(eq(giftCodesTable.id, gift.id));
      return { amountUgx: gift.amountUgx, walletBalanceUgx: member.walletBalanceUgx };
    });
    if (!result) {
      res.status(400).json({ error: "That gift code is invalid or has already been redeemed." });
      return;
    }
    res.json(RedeemGiftCodeResponse.parse(result));
  } catch (error) {
    req.log.error({ error, route: "gift-codes.redeem" }, "Could not redeem gift code");
    res.status(500).json({ error: "Could not redeem gift code." });
  }
});

router.get("/presence", async (req, res) => {
  try {
    const accountId = await currentAccountId(req, res);
    if (!accountId) return;
    const siteSettings = await readSiteSettings();
    if (siteSettings.maintenanceMode) {
      res.status(503).json({ error: siteSettings.maintenanceMessage });
      return;
    }
    const task = { ...(await currentPresenceTask()), rewardUgx: siteSettings.dailyCheckinBonusUgx };
    const claims = await db
      .select({ attendanceDate: presenceClaimsTable.attendanceDate, rewardUgx: presenceClaimsTable.rewardUgx })
      .from(presenceClaimsTable)
      .where(eq(presenceClaimsTable.accountId, accountId));
    res.json({
      ...task,
      totalUgx: claims.reduce((total, claim) => total + claim.rewardUgx, 0),
      days: claims.length,
      claimedToday: claims.some((claim) => claim.attendanceDate === kampalaDate()),
    });
  } catch (error) {
    req.log.error({ error, route: "presence.get" }, "Could not load presence history");
    res.status(500).json({ error: "Could not load presence history." });
  }
});

router.get("/referral/summary", async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  res.setHeader("Cache-Control", "no-store");
  try {
    const links = await db.select({
      accountId: phoneReferralCodesTable.accountId,
      referredByAccountId: phoneReferralCodesTable.referredByAccountId,
    }).from(phoneReferralCodesTable);
    const seen = new Set<string>([accountId]);
    let frontier = new Set<string>([accountId]);
    const memberCounts: number[] = [];
    for (let depth = 0; depth < 3; depth += 1) {
      const next = new Set(links
        .filter((link) => link.referredByAccountId && frontier.has(link.referredByAccountId) && !seen.has(link.accountId))
        .map((link) => link.accountId));
      next.forEach((id) => seen.add(id));
      memberCounts.push(next.size);
      frontier = next;
    }
    const [siteSettings, rewardRows, firstPurchaseOrders, taskQualifiedLevelOneRows] = await Promise.all([
      readSiteSettings(),
      db.select({
        level: referralCommissionsTable.level,
        orderId: referralCommissionsTable.orderId,
        amountUgx: referralCommissionsTable.amountUgx,
      })
        .from(referralCommissionsTable)
        .where(eq(referralCommissionsTable.recipientAccountId, accountId))
      ,
      db.select({
        orderId: productOrdersTable.id,
        buyerAccountId: productOrdersTable.buyerAccountId,
        priceUgx: productOrdersTable.priceUgx,
      }).from(productOrdersTable).where(eq(productOrdersTable.isFirstPurchase, true)),
      db.select({ accountId: phoneAccountsTable.id })
        .from(phoneAccountsTable)
        .innerJoin(phoneReferralCodesTable, eq(phoneReferralCodesTable.accountId, phoneAccountsTable.id))
        .innerJoin(productOrdersTable, eq(productOrdersTable.buyerAccountId, phoneAccountsTable.id))
        .where(and(
          eq(phoneReferralCodesTable.referredByAccountId, accountId),
          sql`${phoneAccountsTable.totalDepositedUgx} > 0`,
        ))
        .groupBy(phoneAccountsTable.id),
    ]);
    const rates = [
      siteSettings.referralCommissionLevel1Percent,
      siteSettings.referralCommissionLevel2Percent,
      siteSettings.referralCommissionLevel3Percent,
    ];
    const commissionsByOrderLevel = new Map(rewardRows.map((row) => [`${row.orderId}:${row.level}`, row.amountUgx]));
    const rewardByLevel = [0, 0, 0];
    const estimatedByLevel = [0, 0, 0];
    for (const order of firstPurchaseOrders) {
      const ancestors = getReferralAncestorsThroughLevelThree(order.buyerAccountId, links);
      for (const [index, ancestorId] of ancestors.entries()) {
        if (ancestorId !== accountId) continue;
        const level = index + 1;
        const recorded = commissionsByOrderLevel.get(`${order.orderId}:${level}`);
        if (recorded !== undefined) rewardByLevel[index] += recorded;
        else estimatedByLevel[index] += Math.floor(order.priceUgx * (rates[index] ?? 0) / 100);
      }
    }
    const levels = [1, 2, 3].map((level) => ({
      level,
      commissionPercent: rates[level - 1] ?? 0,
      memberCount: memberCounts[level - 1] ?? 0,
      rewardsUgx: rewardByLevel[level - 1] + estimatedByLevel[level - 1],
      estimatedRewardsUgx: estimatedByLevel[level - 1],
    }));
    res.json(GetReferralSummaryResponse.parse({
      totalMembers: memberCounts.reduce((total, count) => total + count, 0),
      taskQualifiedLevel1Members: taskQualifiedLevelOneRows.length,
      totalRewardsUgx: levels.reduce((total, item) => total + item.rewardsUgx, 0),
      levels,
    }));
  } catch (error) {
    req.log.error({ error, route: "referral.summary" }, "Could not load referral summary");
    res.status(500).json({ error: "Could not load referral statistics." });
  }
});

router.get("/referral/details", async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  res.setHeader("Cache-Control", "no-store");
  try {
    const referralLinks = await db.select({
        accountId: phoneReferralCodesTable.accountId,
        referredByAccountId: phoneReferralCodesTable.referredByAccountId,
      }).from(phoneReferralCodesTable);
    const downlineLevels = new Map<string, number>();
    const seen = new Set<string>([accountId]);
    let frontier = new Set<string>([accountId]);
    for (let level = 1; level <= 3; level += 1) {
      const next = new Set(referralLinks
        .filter((link) => link.referredByAccountId && frontier.has(link.referredByAccountId) && !seen.has(link.accountId))
        .map((link) => link.accountId));
      next.forEach((memberId) => {
        seen.add(memberId);
        downlineLevels.set(memberId, level);
      });
      frontier = next;
    }
    const [accounts, rewardRows] = await Promise.all([
      downlineLevels.size
        ? db.select({
            id: phoneAccountsTable.id,
            phoneNumber: phoneAccountsTable.phoneNumber,
            joinedAt: phoneAccountsTable.createdAt,
          }).from(phoneAccountsTable).where(inArray(phoneAccountsTable.id, [...downlineLevels.keys()]))
        : Promise.resolve([]),
      db.select({
        id: referralCommissionsTable.id,
        memberPhoneNumber: phoneAccountsTable.phoneNumber,
        level: referralCommissionsTable.level,
        amountUgx: referralCommissionsTable.amountUgx,
        createdAt: referralCommissionsTable.createdAt,
      }).from(referralCommissionsTable)
        .innerJoin(phoneAccountsTable, eq(phoneAccountsTable.id, referralCommissionsTable.purchaserAccountId))
        .where(eq(referralCommissionsTable.recipientAccountId, accountId)),
    ]);
    const members = accounts.map((member) => ({
      id: member.id,
      phoneNumber: member.phoneNumber,
      level: downlineLevels.get(member.id) ?? 0,
      joinedAt: member.joinedAt.toISOString(),
    }));
    req.log.info({ downlineLinkCount: downlineLevels.size, returnedMemberCount: members.length }, "Loaded referral member details");
    res.json(GetReferralDetailsResponse.parse({
      members,
      rewards: rewardRows.map((reward) => ({ ...reward, createdAt: reward.createdAt.toISOString() })),
    }));
  } catch (error) {
    req.log.error({ error, route: "referral.details" }, "Could not load referral details");
    res.status(500).json({ error: "Could not load referral details." });
  }
});

router.post("/presence/claim", requireSameOrigin, async (req, res) => {
  try {
    const accountId = await currentAccountId(req, res);
    if (!accountId) return;
    const task = await currentPresenceTask();
    if (!task.enabled) {
      res.status(409).json({ error: "Presence is not active yet." });
      return;
    }
    const attendanceDate = kampalaDate();
    const wasNewClaim = await db.transaction(async (tx) => {
      const claimed = await tx
        .insert(presenceClaimsTable)
        .values({ accountId, attendanceDate, rewardUgx: task.rewardUgx })
        .onConflictDoNothing()
        .returning({ id: presenceClaimsTable.id });
      if (claimed.length === 0) return false;

      const [updatedAccount] = await tx
        .update(phoneAccountsTable)
        .set({
          walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${task.rewardUgx}`,
          totalAccumulatedUgx: sql`${phoneAccountsTable.totalAccumulatedUgx} + ${task.rewardUgx}`,
        })
        .where(eq(phoneAccountsTable.id, accountId))
        .returning({ id: phoneAccountsTable.id });
      if (!updatedAccount) throw new Error("Presence claimant account no longer exists.");
      return true;
    });
    const claims = await db
      .select({ rewardUgx: presenceClaimsTable.rewardUgx })
      .from(presenceClaimsTable)
      .where(eq(presenceClaimsTable.accountId, accountId));
    res.json({
      ...task,
      claimedToday: true,
      wasNewClaim,
      totalUgx: claims.reduce((total, claim) => total + claim.rewardUgx, 0),
      days: claims.length,
    });
  } catch (error) {
    req.log.error({ error, route: "presence.claim" }, "Could not record presence");
    res.status(500).json({ error: "Could not record presence." });
  }
});

router.post("/products/:productId/purchase", requireSameOrigin, async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  const rawProductId = req.params.productId;
  if (typeof rawProductId !== "string" || !/^[a-z0-9-]{1,60}$/.test(rawProductId)) {
    res.status(400).json({ error: "Invalid product." });
    return;
  }
  const productId = rawProductId;
  try {
    const siteSettings = await readSiteSettings();
    if (siteSettings.maintenanceMode) {
      res.status(503).json({ error: siteSettings.maintenanceMessage });
      return;
    }
    const result = await db.transaction(async (tx) => {
      const [product] = await tx.select({
        id: productCatalogTable.id,
        name: productCatalogTable.name,
        priceUgx: productCatalogTable.priceUgx,
      }).from(productCatalogTable)
        .where(and(eq(productCatalogTable.id, productId), eq(productCatalogTable.isActive, true)))
        .for("update").limit(1);
      if (!product) return { kind: "unavailable" as const };

      const [buyer] = await tx.select({
        walletBalanceUgx: phoneAccountsTable.walletBalanceUgx,
      }).from(phoneAccountsTable)
        .where(eq(phoneAccountsTable.id, accountId))
        .for("update").limit(1);
      if (!buyer || buyer.walletBalanceUgx < product.priceUgx) return { kind: "insufficient" as const };

      const [priorOrder] = await tx.select({ id: productOrdersTable.id })
        .from(productOrdersTable)
        .where(eq(productOrdersTable.buyerAccountId, accountId))
        .limit(1);
      const isFirstPurchase = !priorOrder;
      const [order] = await tx.insert(productOrdersTable).values({
        buyerAccountId: accountId,
        productId: product.id,
        productName: product.name,
        priceUgx: product.priceUgx,
        isFirstPurchase,
        status: "pending_fulfillment",
      }).returning({ id: productOrdersTable.id });

      const [updatedBuyer] = await tx.update(phoneAccountsTable)
        .set({ walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} - ${product.priceUgx}` })
        .where(eq(phoneAccountsTable.id, accountId))
        .returning({ walletBalanceUgx: phoneAccountsTable.walletBalanceUgx });

      const commissions: Array<{ level: number; amountUgx: number }> = [];
      if (isFirstPurchase) {
        const referrals = await tx.select({
          accountId: phoneReferralCodesTable.accountId,
          referredByAccountId: phoneReferralCodesTable.referredByAccountId,
        }).from(phoneReferralCodesTable);
        const ancestors = getReferralAncestorsThroughLevelThree(accountId, referrals);
        const rates = [
          siteSettings.referralCommissionLevel1Percent,
          siteSettings.referralCommissionLevel2Percent,
          siteSettings.referralCommissionLevel3Percent,
        ];
        for (const [index, ancestorId] of ancestors.entries()) {
          const amountUgx = Math.floor(product.priceUgx * (rates[index] ?? 0) / 100);
          if (amountUgx <= 0) continue;
          await tx.update(phoneAccountsTable).set({
            walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${amountUgx}`,
            totalAccumulatedUgx: sql`${phoneAccountsTable.totalAccumulatedUgx} + ${amountUgx}`,
          }).where(eq(phoneAccountsTable.id, ancestorId));
          await tx.insert(referralCommissionsTable).values({
            recipientAccountId: ancestorId,
            purchaserAccountId: accountId,
            orderId: order.id,
            level: index + 1,
            amountUgx,
          });
          commissions.push({ level: index + 1, amountUgx });
        }
      }
      return {
        kind: "purchased" as const,
        result: {
          orderId: order.id,
          productName: product.name,
          priceUgx: product.priceUgx,
          walletBalanceUgx: updatedBuyer.walletBalanceUgx,
          isFirstPurchase,
          commissions,
        },
      };
    });
    if (result.kind === "unavailable") {
      res.status(409).json({ error: "This product is no longer available." });
      return;
    }
    if (result.kind === "insufficient") {
      res.status(409).json({ error: "Your wallet balance is not enough to buy this product." });
      return;
    }
    res.json(PurchaseProductResponse.parse(result.result));
  } catch (error) {
    req.log.error({ error, route: "products.purchase" }, "Could not complete product purchase");
    res.status(500).json({ error: "The purchase could not be completed. No wallet funds were taken." });
  }
});

router.get("/products/orders", async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  try {
    const rows = await db.select({
      id: productOrdersTable.id,
      productName: productOrdersTable.productName,
      priceUgx: productOrdersTable.priceUgx,
      status: productOrdersTable.status,
      createdAt: productOrdersTable.createdAt,
    }).from(productOrdersTable)
      .where(eq(productOrdersTable.buyerAccountId, accountId))
      .orderBy(sql`${productOrdersTable.createdAt} DESC`);
    res.json(GetMyProductOrdersResponse.parse({
      orders: rows.map((order) => ({ ...order, createdAt: order.createdAt.toISOString() })),
    }));
  } catch (error) {
    req.log.error({ error, route: "products.orders" }, "Could not load member product orders");
    res.status(500).json({ error: "Could not load product orders." });
  }
});

router.post("/recharge-requests", requireSameOrigin, async (req, res) => {
  try {
    const accountId = await currentAccountId(req, res);
    if (!accountId) return;
    const amount = req.body?.amount;
    const provider = req.body?.provider;
    const rawPhone = typeof req.body?.phone === "string" ? req.body.phone.trim().replace(/[\s().-]/g, "") : "";
    const nationalPhone = rawPhone.startsWith("+256") ? rawPhone.slice(4) : rawPhone.startsWith("256") ? rawPhone.slice(3) : rawPhone.startsWith("0") ? rawPhone.slice(1) : rawPhone;
    const settings = await readSiteSettings();
    if (settings.maintenanceMode) {
      res.status(503).json({ error: settings.maintenanceMessage });
      return;
    }
    if (!Number.isSafeInteger(amount) || amount < settings.minimumDepositUgx || !/^7\d{8}$/.test(nationalPhone) || !["mtn", "airtel"].includes(provider)) {
      res.status(400).json({ error: `Enter a valid Ugandan mobile number and recharge amount of at least UGX ${settings.minimumDepositUgx.toLocaleString()}.` });
      return;
    }
    const apiKey = process.env.PESAJET_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "PesaJet payments are not configured. Please contact support." });
      return;
    }
    const payerPhone = `+256${nationalPhone}`;
    const recentRequest = await db.select({ id: rechargeRequestsTable.id })
      .from(rechargeRequestsTable)
      .where(and(
        eq(rechargeRequestsTable.accountId, accountId),
        eq(rechargeRequestsTable.amountUgx, amount),
        eq(rechargeRequestsTable.payerPhone, payerPhone),
        eq(rechargeRequestsTable.provider, provider),
        eq(rechargeRequestsTable.status, "pending"),
        gte(rechargeRequestsTable.createdAt, new Date(Date.now() - 15 * 60 * 1000)),
      ))
      .orderBy(desc(rechargeRequestsTable.createdAt))
      .limit(1);
    const [request] = recentRequest.length > 0
      ? recentRequest
      : await db.insert(rechargeRequestsTable)
        .values({ accountId, amountUgx: amount, payerPhone, provider })
        .returning({ id: rechargeRequestsTable.id });
    let paymentResponse: globalThis.Response;
    try {
      paymentResponse = await fetch("https://payments.pesajet.com/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({
          type: "COLLECTION",
          amount,
          currency: "UGX",
          phoneNumber: payerPhone,
          provider,
          reference: request.id,
          idempotencyKey: request.id,
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      req.log.warn({ error, route: "recharge-requests.pesajet", requestId: request.id }, "PesaJet response was not received; request remains pending for reconciliation");
      res.status(202).json({ requestId: request.id, status: "pending", message: "PesaJet’s response is delayed. If a mobile-money PIN prompt arrived, complete it only on your phone; do not submit another request yet." });
      return;
    }
    if (!paymentResponse.ok) {
      await db.update(rechargeRequestsTable)
        .set({ status: "failed" })
        .where(and(eq(rechargeRequestsTable.id, request.id), eq(rechargeRequestsTable.status, "pending")));
      req.log.warn({ route: "recharge-requests.pesajet", requestId: request.id, statusCode: paymentResponse.status }, "PesaJet rejected collection request");
      res.status(502).json({ error: "PesaJet could not start this payment. Check the number and try again." });
      return;
    }
    res.status(201).json({ requestId: request.id, status: "pending", message: `Check the ${provider.toUpperCase()} number for a PesaJet payment prompt. Enter your PIN only in the official mobile-money prompt, never on this site. Your wallet is credited after an administrator confirms receipt.` });
  } catch (error) {
    req.log.error({ error, route: "recharge-requests.create" }, "Could not create manual recharge request");
    res.status(500).json({ error: "Could not create the recharge request." });
  }
});

router.get("/payout-account", async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  try {
    const [payoutAccount] = await db.select({
      provider: payoutAccountsTable.provider,
      holderName: payoutAccountsTable.holderName,
      phoneNumber: payoutAccountsTable.phoneNumber,
      updatedAt: payoutAccountsTable.updatedAt,
    }).from(payoutAccountsTable).where(eq(payoutAccountsTable.accountId, accountId)).limit(1);
    res.json(GetMyPayoutAccountResponse.parse({ payoutAccount: payoutAccount ?? null }));
  } catch (error) {
    req.log.error({ error, route: "payout-account.get" }, "Could not load payout destination");
    res.status(500).json({ error: "Could not load payout destination." });
  }
});

router.put("/payout-account", requireSameOrigin, async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  const parsed = SaveMyPayoutAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a provider, account-holder name, and valid Ugandan mobile-money number." });
    return;
  }
  const compact = parsed.data.phoneNumber.trim().replace(/[\s().-]/g, "");
  const national = compact.startsWith("+256") ? compact.slice(4)
    : compact.startsWith("256") ? compact.slice(3)
      : compact.startsWith("0") ? compact.slice(1) : compact;
  if (!/^7\d{8}$/.test(national)) {
    res.status(400).json({ error: "Enter a valid Ugandan mobile-money number." });
    return;
  }
  try {
    const [payoutAccount] = await db.insert(payoutAccountsTable).values({
      accountId,
      provider: parsed.data.provider,
      holderName: parsed.data.holderName.trim(),
      phoneNumber: `+256${national}`,
    }).onConflictDoUpdate({
      target: payoutAccountsTable.accountId,
      set: {
        provider: parsed.data.provider,
        holderName: parsed.data.holderName.trim(),
        phoneNumber: `+256${national}`,
        updatedAt: new Date(),
      },
    }).returning({
      provider: payoutAccountsTable.provider,
      holderName: payoutAccountsTable.holderName,
      phoneNumber: payoutAccountsTable.phoneNumber,
      updatedAt: payoutAccountsTable.updatedAt,
    });
    res.json(SaveMyPayoutAccountResponse.parse({ payoutAccount }));
  } catch (error) {
    req.log.error({ error, route: "payout-account.save" }, "Could not save payout destination");
    res.status(500).json({ error: "Could not save payout destination." });
  }
});

router.get("/withdrawals", async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  try {
    const withdrawals = await db.select({
      id: withdrawalRequestsTable.id,
      amountUgx: withdrawalRequestsTable.amountUgx,
      feeUgx: withdrawalRequestsTable.feeUgx,
      receivedUgx: withdrawalRequestsTable.receivedUgx,
      payoutPhone: withdrawalRequestsTable.payoutPhone,
      payoutProvider: withdrawalRequestsTable.payoutProvider,
      payoutHolderName: withdrawalRequestsTable.payoutHolderName,
      status: withdrawalRequestsTable.status,
      createdAt: withdrawalRequestsTable.createdAt,
      processedAt: withdrawalRequestsTable.processedAt,
      resolutionNote: withdrawalRequestsTable.resolutionNote,
    }).from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.accountId, accountId))
      .orderBy(sql`${withdrawalRequestsTable.createdAt} DESC`)
      .limit(100);
    res.json(GetMyWithdrawalsResponse.parse({ withdrawals }));
  } catch (error) {
    req.log.error({ error, route: "withdrawals.get" }, "Could not load member withdrawal history");
    res.status(500).json({ error: "Could not load withdrawal history." });
  }
});

router.post("/withdrawals", requireSameOrigin, async (req, res): Promise<void> => {
  const accountId = await currentAccountId(req, res);
  if (!accountId) return;
  const settings = await readSiteSettings();
  if (settings.maintenanceMode) {
    res.status(503).json({ error: settings.maintenanceMessage });
    return;
  }
  const parsed = CreateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid whole-UGX withdrawal amount." });
    return;
  }
  if (parsed.data.amountUgx < settings.minimumWithdrawalUgx) {
    res.status(400).json({ error: `Minimum withdrawal is UGX ${settings.minimumWithdrawalUgx.toLocaleString()}.` });
    return;
  }
  const nowKampala = new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Kampala", hour: "2-digit", minute: "2-digit", hour12: false });
  const inWindow = settings.withdrawalWindowStart <= settings.withdrawalWindowEnd
    ? nowKampala >= settings.withdrawalWindowStart && nowKampala <= settings.withdrawalWindowEnd
    : nowKampala >= settings.withdrawalWindowStart || nowKampala <= settings.withdrawalWindowEnd;
  if (settings.limitWithdrawalsToHours && !inWindow) {
    res.status(409).json({ error: `Withdrawals are available between ${settings.withdrawalWindowStart} and ${settings.withdrawalWindowEnd} Uganda time.` });
    return;
  }
  const kampalaDayStart = new Date(`${kampalaDate()}T00:00:00+03:00`);
  try {
    const result = await db.transaction(async (tx) => {
      const [account] = await tx.select({
        walletBalanceUgx: phoneAccountsTable.walletBalanceUgx,
        phoneNumber: phoneAccountsTable.phoneNumber,
      }).from(phoneAccountsTable)
        .where(eq(phoneAccountsTable.id, accountId))
        .for("update")
        .limit(1);
      if (!account) return { kind: "missing" as const };
      if (account.walletBalanceUgx < parsed.data.amountUgx) return { kind: "insufficient" as const };
      if (settings.maximumWithdrawalsPerMemberPerDay > 0) {
        const [daily] = await tx.select({ total: count() }).from(withdrawalRequestsTable)
          .where(and(eq(withdrawalRequestsTable.accountId, accountId), gt(withdrawalRequestsTable.createdAt, kampalaDayStart)));
        if ((daily?.total ?? 0) >= settings.maximumWithdrawalsPerMemberPerDay) return { kind: "daily-limit" as const };
      }
      const [destination] = await tx.select().from(payoutAccountsTable)
        .where(eq(payoutAccountsTable.accountId, accountId)).limit(1);
      const feeUgx = Math.round(parsed.data.amountUgx * settings.withdrawalFeePercent / 100);
      const receivedUgx = parsed.data.amountUgx - feeUgx;
      const [withdrawal] = await tx.insert(withdrawalRequestsTable).values({
        accountId,
        amountUgx: parsed.data.amountUgx,
        feeUgx,
        receivedUgx,
        payoutPhone: destination?.phoneNumber ?? account.phoneNumber,
        payoutProvider: destination?.provider ?? "registered",
        payoutHolderName: destination?.holderName ?? null,
      }).returning({
        id: withdrawalRequestsTable.id,
        amountUgx: withdrawalRequestsTable.amountUgx,
        feeUgx: withdrawalRequestsTable.feeUgx,
        receivedUgx: withdrawalRequestsTable.receivedUgx,
        payoutPhone: withdrawalRequestsTable.payoutPhone,
        payoutProvider: withdrawalRequestsTable.payoutProvider,
        payoutHolderName: withdrawalRequestsTable.payoutHolderName,
        status: withdrawalRequestsTable.status,
        createdAt: withdrawalRequestsTable.createdAt,
        processedAt: withdrawalRequestsTable.processedAt,
        resolutionNote: withdrawalRequestsTable.resolutionNote,
      });
      await tx.update(phoneAccountsTable)
        .set({ walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} - ${parsed.data.amountUgx}` })
        .where(eq(phoneAccountsTable.id, accountId));
      return { kind: "created" as const, withdrawal };
    });
    if (result.kind === "missing") {
      res.status(404).json({ error: "Member account not found." });
      return;
    }
    if (result.kind === "insufficient") {
      res.status(409).json({ error: "Your available wallet balance is too low for this withdrawal." });
      return;
    }
    if (result.kind === "daily-limit") {
      res.status(409).json({ error: "You have reached the daily withdrawal limit." });
      return;
    }
    res.status(201).json(CreateWithdrawalResponse.parse({ withdrawals: [result.withdrawal] }));
  } catch (error) {
    req.log.error({ error, route: "withdrawals.create" }, "Could not create withdrawal request");
    res.status(500).json({ error: "Could not submit the withdrawal request." });
  }
});

export default router;
