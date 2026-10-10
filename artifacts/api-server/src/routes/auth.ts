import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import {
  db,
  phoneAccountsTable,
  phoneReferralCodesTable,
  phoneSessionsTable,
  presenceClaimsTable,
  rechargeRequestsTable,
  taskCenterSettingsTable,
} from "@workspace/db";
import {
  GetCurrentPhoneAccountResponse,
  LoginPhoneAccountBody,
  LoginPhoneAccountResponse,
  RegisterPhoneAccountBody,
  RegisterPhoneAccountResponse,
} from "@workspace/api-zod";

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
  return { enabled: configured?.enabled === true, rewardUgx };
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

function requireSameOrigin(
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
    const suppliedReferralCode = parsed.data.referralCode?.trim().toUpperCase();
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
            .values({ phoneNumber, passwordHash, walletBalanceUgx: 5000, totalAccumulatedUgx: 5000 })
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
    if (!(await verifyPassword(parsed.data.password, account?.passwordHash))) {
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
      })
      .from(phoneSessionsTable)
      .innerJoin(phoneAccountsTable, eq(phoneSessionsTable.accountId, phoneAccountsTable.id))
      .where(and(
        eq(phoneSessionsTable.tokenHash, hashSessionToken(token)),
        gt(phoneSessionsTable.expiresAt, new Date()),
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

router.get("/presence", async (req, res) => {
  try {
    const accountId = await currentAccountId(req, res);
    if (!accountId) return;
    const task = await currentPresenceTask();
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

router.post("/presence/claim", requireSameOrigin, async (req, res) => {
  try {
    const accountId = await currentAccountId(req, res);
    if (!accountId) return;
    const task = await currentPresenceTask();
    if (!task.enabled) {
      res.status(409).json({ error: "Presence is not active yet." });
      return;
    }
    const claimed = await db
      .insert(presenceClaimsTable)
      .values({ accountId, attendanceDate: kampalaDate(), rewardUgx: task.rewardUgx })
      .onConflictDoNothing()
      .returning({ id: presenceClaimsTable.id });
    const claims = await db
      .select({ rewardUgx: presenceClaimsTable.rewardUgx })
      .from(presenceClaimsTable)
      .where(eq(presenceClaimsTable.accountId, accountId));
    res.json({
      ...task,
      claimedToday: true,
      wasNewClaim: claimed.length > 0,
      totalUgx: claims.reduce((total, claim) => total + claim.rewardUgx, 0),
      days: claims.length,
    });
  } catch (error) {
    req.log.error({ error, route: "presence.claim" }, "Could not record presence");
    res.status(500).json({ error: "Could not record presence." });
  }
});

router.post("/recharge-requests", requireSameOrigin, async (req, res) => {
  try {
    const accountId = await currentAccountId(req, res);
    if (!accountId) return;
    const amount = req.body?.amount;
    const rawPhone = typeof req.body?.phone === "string" ? req.body.phone.trim().replace(/[\s().-]/g, "") : "";
    const nationalPhone = rawPhone.startsWith("+256") ? rawPhone.slice(4) : rawPhone.startsWith("256") ? rawPhone.slice(3) : rawPhone.startsWith("0") ? rawPhone.slice(1) : rawPhone;
    if (!Number.isSafeInteger(amount) || amount < 2000 || !/^7\d{8}$/.test(nationalPhone)) {
      res.status(400).json({ error: "Enter a valid Ugandan mobile number and recharge amount of at least UGX 2,000." });
      return;
    }
    const [request] = await db
      .insert(rechargeRequestsTable)
      .values({ accountId, amountUgx: amount, payerPhone: `+256${nationalPhone}` })
      .returning({ id: rechargeRequestsTable.id });
    res.status(201).json({ requestId: request.id, status: "pending" });
  } catch (error) {
    req.log.error({ error, route: "recharge-requests.create" }, "Could not create manual recharge request");
    res.status(500).json({ error: "Could not create the recharge request." });
  }
});

export default router;
