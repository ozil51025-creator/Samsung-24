import { createHash, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { and, count, desc, eq, gt, inArray, isNotNull, isNull, sum, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  adminAccountsTable,
  adminAuditLogsTable,
  giftCodesTable,
  adminSiteSettingsTable,
  phoneAccountsTable,
  phoneReferralCodesTable,
  phoneSessionsTable,
  payoutAccountsTable,
  presenceClaimsTable,
  productCatalogTable,
  productOrdersTable,
  referralCommissionsTable,
  rechargeRequestsTable,
  teamDepositMilestoneClaimsTable,
  taskCenterSettingsTable,
  withdrawalRequestsTable,
} from "@workspace/db";
import {
  AddAdminAccountBody,
  AddAdminAccountResponse,
  CreateAdminWalletAdjustmentBody,
  CreateAdminWalletAdjustmentResponse,
  GetAdminGiftCodesResponse,
  CreateAdminGiftCodeBody,
  CreateAdminGiftCodeResponse,
  RedeemGiftCodeBody,
  RedeemGiftCodeResponse,
  GetAdminSiteSettingsResponse,
  UpdateAdminSiteSettingsBody,
  GetAdminProductsResponse,
  GetProductCatalogResponse,
  GetAdminAccountsResponse,
  GetAdminAuditLogsResponse,
  GetAdminTaskCenterSettingsResponse,
  GetAdminMembersResponse,
  GetAdminMemberDetailsResponse,
  GetAdminOverviewResponse,
  GrantAdminMemberProductBody,
  GrantAdminMemberProductResponse,
  ResetAdminMemberPasswordResponse,
  UpdateAdminMemberStatusBody,
  UpdateAdminMemberStatusResponse,
  GetTaskCenterSettingsResponse,
  UpdateAdminTaskCenterSettingsBody,
  UpdateAdminTaskCenterSettingsResponse,
  UpdateAdminProductsBody,
  UpdateAdminProductsResponse,
  GetAdminWithdrawalsResponse,
  ProcessAdminWithdrawalBody,
  ProcessAdminWithdrawalResponse,
} from "@workspace/api-zod";
import {
  calculateLevelOneToThreeTeamDeposits,
  getReferralAncestorsThroughLevelThree,
  TEAM_DEPOSIT_MILESTONES,
} from "../lib/team-deposit-milestones";
import { readSiteSettings } from "../lib/site-settings";

const router: IRouter = Router();

router.get("/admin/gift-codes", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const rows = await db.select({
      id: giftCodesTable.id,
      code: giftCodesTable.code,
      amountUgx: giftCodesTable.amountUgx,
      createdAt: giftCodesTable.createdAt,
      redeemedAt: giftCodesTable.redeemedAt,
      redeemedByPhone: phoneAccountsTable.phoneNumber,
    }).from(giftCodesTable)
      .leftJoin(phoneAccountsTable, eq(giftCodesTable.redeemedByAccountId, phoneAccountsTable.id))
      .orderBy(desc(giftCodesTable.createdAt)).limit(500);
    res.json(GetAdminGiftCodesResponse.parse({ codes: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), redeemedAt: row.redeemedAt?.toISOString() ?? null })) }));
  } catch (error) {
    req.log.error({ error, route: "admin.gift-codes.get" }, "Could not load gift codes");
    res.status(500).json({ error: "Could not load gift codes." });
  }
});

router.post("/admin/gift-codes", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = CreateAdminGiftCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid gift-code amount." });
    return;
  }
  try {
    const code = randomBytes(10).toString("hex").toUpperCase();
    const [created] = await db.insert(giftCodesTable).values({
      code,
      amountUgx: parsed.data.amountUgx,
      createdByAdminAccountId: admin.id,
    }).returning();
    await db.insert(adminAuditLogsTable).values({
      adminAccountId: admin.id,
      action: "gift_code.created",
      amountUgx: created.amountUgx,
      details: "Issued a single-use wallet credit code.",
    });
    res.status(201).json(CreateAdminGiftCodeResponse.parse({
      id: created.id,
      code: created.code,
      amountUgx: created.amountUgx,
      createdAt: created.createdAt.toISOString(),
      redeemedAt: null,
      redeemedByPhone: null,
    }));
  } catch (error) {
    req.log.error({ error, route: "admin.gift-codes.create" }, "Could not create gift code");
    res.status(500).json({ error: "Could not create gift code." });
  }
});
const defaultTaskDefinitions = [
  { id: "invite-3", title: "Invite 3 Level 1 members", objective: 3, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
  { id: "invite-10", title: "Invite 10 Level 1 members", objective: 10, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
  { id: "invite-30", title: "Invite 30 Level 1 members", objective: 30, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
  { id: "presence", title: "Presence", objective: 1, objectiveUnit: "day", rewardUgx: 500, rewardFrequency: "daily", enabled: true },
];
const initialProductCatalog = [
  ["usb-c-cable", "Samsung USB-C Cable", 30000, "cable"],
  ["usb-c-adapter", "Samsung 25W USB-C Adapter", 50000, "charger"],
  ["usb-c-earphones", "Samsung USB-C Earphones", 115000, "earphones"],
  ["smarttag2", "Galaxy SmartTag2 Tracker", 250000, "tag"],
  ["galaxy-buds", "Galaxy Buds Wireless Earbuds", 370000, "buds"],
  ["galaxy-fit", "Galaxy Fit Fitness Band", 250000, "band"],
  ["galaxy-a-lte", "Galaxy A Series LTE Phone", 775000, "phone"],
  ["galaxy-a-5g", "Galaxy A Series 5G Phone", 1650000, "phone5g"],
  ["galaxy-tab-a", "Galaxy Tab A Series Tablet", 3000000, "tablet"],
  ["galaxy-s-fe", "Galaxy S FE Smartphone", 5000000, "sfe"],
  ["galaxy-s-ultra", "Galaxy S Ultra Smartphone", 8000000, "ultra"],
  ["galaxy-z-fold", "Galaxy Z Fold Smartphone", 12000000, "fold"],
] as const;

function isLegacyCheckInTask(task: { id: string; title: string }) {
  return task.id === "daily-check-in" || /\bcheck[\s-]*in\b/i.test(task.title);
}

function isInviteMilestone(task: { id: string; title: string }) {
  return task.id.toLowerCase().startsWith("invite-") || /\binvit/i.test(task.title);
}

function cookieName() {
  return process.env.NODE_ENV === "production" ? "__Host-rewards_session" : "rewards_session";
}

function normalizePhone(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;
  let national = compact.startsWith("+") ? compact.slice(1) : compact;
  if (national.startsWith("256")) national = national.slice(3);
  if (national.startsWith("0")) national = national.slice(1);
  return /^7\d{8}$/.test(national) ? `+256${national}` : null;
}

const ADMIN_SCRYPT_COST = 32_768;
function hashTemporaryPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, { N: ADMIN_SCRYPT_COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(`scrypt$${ADMIN_SCRYPT_COST}$8$1$${salt.toString("base64url")}$${key.toString("base64url")}`);
    });
  });
}

async function requireAdmin(req: Request, res: Response): Promise<{ id: string; isOwner: boolean } | null> {
  const configuredPhone = typeof process.env.ADMIN_PHONE === "string"
    ? normalizePhone(process.env.ADMIN_PHONE)
    : null;
  if (!configuredPhone) {
    res.status(503).json({ error: "Admin access is not configured." });
    return null;
  }

  const token = req.cookies?.[cookieName()];
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    res.status(401).json({ error: "Sign in with the configured admin account." });
    return null;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [account] = await db
    .select({ id: phoneAccountsTable.id, phoneNumber: phoneAccountsTable.phoneNumber, isActive: phoneAccountsTable.isActive })
    .from(phoneSessionsTable)
    .innerJoin(phoneAccountsTable, eq(phoneSessionsTable.accountId, phoneAccountsTable.id))
    .where(and(
      eq(phoneSessionsTable.tokenHash, tokenHash),
      gt(phoneSessionsTable.expiresAt, new Date()),
      eq(phoneAccountsTable.isActive, true),
    ))
    .limit(1);

  if (!account) {
    res.status(401).json({ error: "Sign in with the configured admin account." });
    return null;
  }
  const [membership] = account.phoneNumber === configuredPhone
    ? [null]
    : await db
      .select({ accountId: adminAccountsTable.accountId })
      .from(adminAccountsTable)
      .where(eq(adminAccountsTable.accountId, account.id))
      .limit(1);
  if (account.phoneNumber !== configuredPhone && !membership) {
    res.status(403).json({ error: "This account is not authorized to use the admin panel." });
    return null;
  }
  return { id: account.id, isOwner: account.phoneNumber === configuredPhone };
}

async function ensureProductCatalog() {
  await db.insert(productCatalogTable).values(initialProductCatalog.map(([id, name, priceUgx, illustration]) => ({
    id, name, priceUgx, illustration, isActive: true,
  }))).onConflictDoNothing();
}

async function requireMemberAccountId(req: Request, res: Response): Promise<string | null> {
  const token = req.cookies?.[cookieName()];
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    res.status(401).json({ error: "Not signed in." });
    return null;
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [account] = await db.select({ id: phoneAccountsTable.id })
    .from(phoneSessionsTable)
    .innerJoin(phoneAccountsTable, eq(phoneSessionsTable.accountId, phoneAccountsTable.id))
    .where(and(
      eq(phoneSessionsTable.tokenHash, tokenHash),
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

router.get("/products/catalog", async (req, res): Promise<void> => {
  const accountId = await requireMemberAccountId(req, res);
  if (!accountId) return;
  res.set("Cache-Control", "no-store");
  try {
    await ensureProductCatalog();
    const products = await db.select().from(productCatalogTable);
    const [totals] = await db.select({ purchasedCount: count() })
      .from(productOrdersTable)
      .where(eq(productOrdersTable.buyerAccountId, accountId));
    res.json(GetProductCatalogResponse.parse({
      products: products.filter((product) => product.isActive),
      purchasedCount: totals?.purchasedCount ?? 0,
      // No product-earnings ledger exists yet; purchase prices are spend, not earnings received.
      totalCollectedUgx: 0,
    }));
  } catch {
    res.status(500).json({ error: "Could not load the product catalog." });
  }
});

router.get("/admin/products", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    await ensureProductCatalog();
    res.json(GetAdminProductsResponse.parse({ products: await db.select().from(productCatalogTable) }));
  } catch {
    res.status(500).json({ error: "Could not load products." });
  }
});

router.put("/admin/products", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = UpdateAdminProductsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a product name and a valid listed UGX price." });
    return;
  }
  try {
    await ensureProductCatalog();
    const current = await db.select({ id: productCatalogTable.id }).from(productCatalogTable);
    const currentIds = current.map((item) => item.id).sort();
    const submittedIds = parsed.data.products.map((item) => item.id).sort();
    if (currentIds.length !== submittedIds.length || currentIds.some((id, index) => id !== submittedIds[index])) {
      res.status(400).json({ error: "The product list must include each existing catalog item exactly once." });
      return;
    }
    await db.transaction(async (tx) => {
      for (const product of parsed.data.products) {
        await tx.update(productCatalogTable).set({
          name: product.name,
          priceUgx: product.priceUgx,
          isActive: product.isActive,
          updatedAt: new Date(),
        }).where(eq(productCatalogTable.id, product.id));
      }
      await tx.insert(adminAuditLogsTable).values({
        adminAccountId: admin.id,
        action: "products.updated",
        details: JSON.stringify({ products: parsed.data.products.map(({ id, name, priceUgx, isActive }) => ({ id, name, priceUgx, isActive })) }),
      });
    });
    res.json(UpdateAdminProductsResponse.parse({ products: await db.select().from(productCatalogTable) }));
  } catch (error) {
    req.log.error({ error, route: "admin.products.put" }, "Could not update product catalog");
    res.status(500).json({ error: "Could not save product changes." });
  }
});

router.get("/admin/overview", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const [
      [users], [referred], [active], [wallets], [deposited], [purchases],
      [paidWithdrawals], [pendingWithdrawals], [commissions], [checkins],
    ] = await Promise.all([
      db.select({ value: count() }).from(phoneAccountsTable),
      db.select({ value: count() }).from(phoneReferralCodesTable).where(isNotNull(phoneReferralCodesTable.referredByAccountId)),
      db.select({ value: count() }).from(phoneAccountsTable).where(eq(phoneAccountsTable.isActive, true)),
      db.select({ value: sum(sql<number>`(${phoneAccountsTable.walletBalanceUgx} + ${phoneAccountsTable.depositBalanceUgx})`) }).from(phoneAccountsTable),
      db.select({ value: sum(phoneAccountsTable.totalDepositedUgx) }).from(phoneAccountsTable),
      db.select({ count: count(), total: sum(productOrdersTable.priceUgx) }).from(productOrdersTable),
      db.select({ value: sum(withdrawalRequestsTable.amountUgx) }).from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.status, "paid")),
      db.select({ count: count(), total: sum(withdrawalRequestsTable.amountUgx) }).from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.status, "pending")),
      db.select({ value: sum(referralCommissionsTable.amountUgx) }).from(referralCommissionsTable),
      db.select({ value: sum(presenceClaimsTable.rewardUgx) }).from(presenceClaimsTable),
    ]);
    res.json(GetAdminOverviewResponse.parse({
      totalUsers: users.value,
      referredUsers: referred.value,
      activeUsers: active.value,
      walletBalanceUgx: Number(wallets.value ?? 0),
      totalDepositedUgx: Number(deposited.value ?? 0),
      totalProductPurchases: purchases.count,
      productPurchaseTotalUgx: Number(purchases.total ?? 0),
      paidWithdrawalsUgx: Number(paidWithdrawals.value ?? 0),
      pendingWithdrawalsCount: pendingWithdrawals.count,
      pendingWithdrawalsUgx: Number(pendingWithdrawals.total ?? 0),
      referralCommissionsUgx: Number(commissions.value ?? 0),
      checkinRewardsUgx: Number(checkins.value ?? 0),
      financialRecordsAvailable: true,
    }));
  } catch (error) {
    req.log.error({ error, route: "admin.overview" }, "Could not load admin overview");
    res.status(500).json({ error: "Could not load the admin overview." });
  }
});

router.get("/admin/members", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const rows = await db
      .select({
        id: phoneAccountsTable.id,
        phoneNumber: phoneAccountsTable.phoneNumber,
        createdAt: phoneAccountsTable.createdAt,
        referralCode: phoneReferralCodesTable.referralCode,
        referredByAccountId: phoneReferralCodesTable.referredByAccountId,
        isActive: phoneAccountsTable.isActive,
        walletBalanceUgx: phoneAccountsTable.walletBalanceUgx,
        depositBalanceUgx: phoneAccountsTable.depositBalanceUgx,
        totalDepositedUgx: phoneAccountsTable.totalDepositedUgx,
        payoutProvider: payoutAccountsTable.provider,
        payoutHolderName: payoutAccountsTable.holderName,
        payoutPhone: payoutAccountsTable.phoneNumber,
      })
      .from(phoneAccountsTable)
      .leftJoin(phoneReferralCodesTable, eq(phoneReferralCodesTable.accountId, phoneAccountsTable.id))
      .leftJoin(payoutAccountsTable, eq(payoutAccountsTable.accountId, phoneAccountsTable.id))
      .orderBy(desc(phoneAccountsTable.createdAt))
      .limit(250);
    res.json(GetAdminMembersResponse.parse({ members: rows, ownerActionsAllowed: admin.isOwner }));
  } catch (error) {
    req.log.error({ error, route: "admin.members" }, "Could not load admin member list");
    res.status(500).json({ error: "Could not load member accounts." });
  }
});

router.get("/admin/members/:memberId/details", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const memberId = req.params.memberId;
  if (!/^[0-9a-f-]{36}$/i.test(memberId)) {
    res.status(400).json({ error: "Invalid member account." });
    return;
  }
  try {
    const [memberRow] = await db.select({
      id: phoneAccountsTable.id, phoneNumber: phoneAccountsTable.phoneNumber, createdAt: phoneAccountsTable.createdAt,
      referralCode: phoneReferralCodesTable.referralCode, referredByAccountId: phoneReferralCodesTable.referredByAccountId,
      isActive: phoneAccountsTable.isActive, walletBalanceUgx: phoneAccountsTable.walletBalanceUgx,
      depositBalanceUgx: phoneAccountsTable.depositBalanceUgx, totalDepositedUgx: phoneAccountsTable.totalDepositedUgx,
      payoutProvider: payoutAccountsTable.provider, payoutHolderName: payoutAccountsTable.holderName, payoutPhone: payoutAccountsTable.phoneNumber,
    }).from(phoneAccountsTable)
      .leftJoin(phoneReferralCodesTable, eq(phoneReferralCodesTable.accountId, phoneAccountsTable.id))
      .leftJoin(payoutAccountsTable, eq(payoutAccountsTable.accountId, phoneAccountsTable.id))
      .where(eq(phoneAccountsTable.id, memberId)).limit(1);
    if (!memberRow) { res.status(404).json({ error: "Member account not found." }); return; }
    const [inviter] = memberRow.referredByAccountId
      ? await db.select({ phoneNumber: phoneAccountsTable.phoneNumber }).from(phoneAccountsTable).where(eq(phoneAccountsTable.id, memberRow.referredByAccountId)).limit(1)
      : [];
    const teamRows = await db.select({
      accountId: phoneAccountsTable.id, phoneNumber: phoneAccountsTable.phoneNumber, referralCode: phoneReferralCodesTable.referralCode,
      referredByAccountId: phoneReferralCodesTable.referredByAccountId, createdAt: phoneAccountsTable.createdAt, isActive: phoneAccountsTable.isActive,
    }).from(phoneAccountsTable).innerJoin(phoneReferralCodesTable, eq(phoneReferralCodesTable.accountId, phoneAccountsTable.id));
    const phoneById = new Map(teamRows.map((row) => [row.accountId, row.phoneNumber]));
    const referrals: Array<{ level: number; phoneNumber: string; referralCode: string | null; referredByPhone: string | null; createdAt: Date; isActive: boolean }> = [];
    let parentIds = new Set([memberId]);
    for (let level = 1; level <= 3; level += 1) {
      const current = teamRows.filter((row) => row.referredByAccountId && parentIds.has(row.referredByAccountId));
      referrals.push(...current.map((row) => ({ level, phoneNumber: row.phoneNumber, referralCode: row.referralCode, referredByPhone: row.referredByAccountId ? phoneById.get(row.referredByAccountId) ?? null : null, createdAt: row.createdAt, isActive: row.isActive })));
      parentIds = new Set(current.map((row) => row.accountId));
      if (parentIds.size === 0) break;
    }
    const [productOrders, deposits, checkins, withdrawals, commissions, milestones, gifts, adjustments] = await Promise.all([
      db.select({ id: productOrdersTable.id, productName: productOrdersTable.productName, priceUgx: productOrdersTable.priceUgx, status: productOrdersTable.status, createdAt: productOrdersTable.createdAt }).from(productOrdersTable).where(eq(productOrdersTable.buyerAccountId, memberId)).orderBy(desc(productOrdersTable.createdAt)),
      db.select({ id: rechargeRequestsTable.id, amountUgx: rechargeRequestsTable.amountUgx, status: rechargeRequestsTable.status, createdAt: rechargeRequestsTable.createdAt }).from(rechargeRequestsTable).where(and(eq(rechargeRequestsTable.accountId, memberId), eq(rechargeRequestsTable.status, "verified"))),
      db.select({ id: presenceClaimsTable.id, amountUgx: presenceClaimsTable.rewardUgx, createdAt: presenceClaimsTable.createdAt }).from(presenceClaimsTable).where(eq(presenceClaimsTable.accountId, memberId)),
      db.select({ id: withdrawalRequestsTable.id, amountUgx: withdrawalRequestsTable.amountUgx, status: withdrawalRequestsTable.status, createdAt: withdrawalRequestsTable.createdAt }).from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.accountId, memberId)),
      db.select({ id: referralCommissionsTable.id, amountUgx: referralCommissionsTable.amountUgx, createdAt: referralCommissionsTable.createdAt }).from(referralCommissionsTable).where(eq(referralCommissionsTable.recipientAccountId, memberId)),
      db.select({ id: teamDepositMilestoneClaimsTable.id, amountUgx: teamDepositMilestoneClaimsTable.rewardUgx, createdAt: teamDepositMilestoneClaimsTable.createdAt }).from(teamDepositMilestoneClaimsTable).where(eq(teamDepositMilestoneClaimsTable.accountId, memberId)),
      db.select({ id: giftCodesTable.id, amountUgx: giftCodesTable.amountUgx, createdAt: giftCodesTable.redeemedAt }).from(giftCodesTable).where(and(eq(giftCodesTable.redeemedByAccountId, memberId), isNotNull(giftCodesTable.redeemedAt))),
      db.select({ id: adminAuditLogsTable.id, action: adminAuditLogsTable.action, amountUgx: adminAuditLogsTable.amountUgx, details: adminAuditLogsTable.details, createdAt: adminAuditLogsTable.createdAt }).from(adminAuditLogsTable).where(and(eq(adminAuditLogsTable.targetAccountId, memberId), inArray(adminAuditLogsTable.action, ["wallet.credit", "wallet.debit", "member.product.grant"]))),
    ]);
    const levelCounts = [1, 2, 3].map((level) => referrals.filter((referral) => referral.level === level).length);
    const checkinDates = [...new Set(checkins.map((claim) => claim.createdAt.toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" })))].sort().reverse();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" });
    const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" });
    let checkinStreak = 0;
    let expected = checkinDates[0] === today ? today : checkinDates[0] === yesterday ? yesterday : "";
    while (expected && checkinDates.includes(expected)) {
      checkinStreak += 1;
      const previous = new Date(`${expected}T00:00:00Z`);
      previous.setUTCDate(previous.getUTCDate() - 1);
      expected = previous.toISOString().slice(0, 10);
    }
    const activity = [
      ...productOrders.map((item) => ({ id: item.id, type: `Product purchase · ${item.productName}`, amountUgx: -item.priceUgx, status: item.status, createdAt: item.createdAt })),
      ...deposits.map((item) => ({ id: item.id, type: "Deposit credit", amountUgx: item.amountUgx, status: item.status, createdAt: item.createdAt })),
      ...checkins.map((item) => ({ id: item.id, type: "Daily check-in", amountUgx: item.amountUgx, status: "credited", createdAt: item.createdAt })),
      ...withdrawals.map((item) => ({ id: item.id, type: item.status === "failed" ? "Withdrawal refund" : "Withdrawal", amountUgx: item.status === "failed" ? item.amountUgx : -item.amountUgx, status: item.status, createdAt: item.createdAt })),
      ...commissions.map((item) => ({ id: item.id, type: "Referral commission", amountUgx: item.amountUgx, status: "credited", createdAt: item.createdAt })),
      ...milestones.map((item) => ({ id: item.id, type: "Team deposit reward", amountUgx: item.amountUgx, status: "credited", createdAt: item.createdAt })),
      ...gifts.filter((item) => item.createdAt).map((item) => ({ id: item.id, type: "Gift code credit", amountUgx: item.amountUgx, status: "credited", createdAt: item.createdAt as Date })),
      ...adjustments.map((item) => ({ id: String(item.id), type: item.action === "member.product.grant" ? item.details ?? "Admin product grant" : item.action === "wallet.debit" ? "Admin debit" : "Admin credit", amountUgx: item.action === "wallet.debit" ? -(item.amountUgx ?? 0) : (item.amountUgx ?? 0), status: item.action === "member.product.grant" ? "granted" : "completed", createdAt: item.createdAt })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json(GetAdminMemberDetailsResponse.parse({
      member: memberRow, invitedByPhone: inviter?.phoneNumber ?? null, referrals, productOrders, activity,
      referralCountsByLevel: { level1: levelCounts[0], level2: levelCounts[1], level3: levelCounts[2] },
      checkinStreak,
    }));
  } catch (error) {
    req.log.error({ error, route: "admin.member.details" }, "Could not load member details");
    res.status(500).json({ error: "Could not load member history." });
  }
});

router.post("/admin/members/:memberId/product-grants", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const memberId = req.params.memberId;
  const parsed = GrantAdminMemberProductBody.safeParse(req.body);
  if (!/^[0-9a-f-]{36}$/i.test(memberId) || !parsed.success) {
    res.status(400).json({ error: "Choose a valid member and product." });
    return;
  }
  try {
    const [[member], [product]] = await Promise.all([
      db.select({ id: phoneAccountsTable.id }).from(phoneAccountsTable).where(eq(phoneAccountsTable.id, memberId)).limit(1),
      db.select({ id: productCatalogTable.id, name: productCatalogTable.name, isActive: productCatalogTable.isActive }).from(productCatalogTable).where(eq(productCatalogTable.id, parsed.data.productId)).limit(1),
    ]);
    if (!member || !product || !product.isActive) { res.status(404).json({ error: "Member or active product not found." }); return; }
    await db.insert(adminAuditLogsTable).values({
      adminAccountId: admin.id, action: "member.product.grant", targetAccountId: member.id,
      details: `Free admin product grant: ${product.name}. Wallet unchanged.`,
    });
    res.status(201).json(GrantAdminMemberProductResponse.parse({ message: `${product.name} was recorded as a free admin gift. The wallet was not changed.` }));
  } catch (error) {
    req.log.error({ error, route: "admin.member.product-grant" }, "Could not grant member product");
    res.status(500).json({ error: "Could not grant the product." });
  }
});

router.post("/admin/members/:memberId/password-reset", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const memberId = req.params.memberId;
  if (!/^[0-9a-f-]{36}$/i.test(memberId)) {
    res.status(400).json({ error: "Invalid member account." });
    return;
  }
  try {
    const [member] = await db.select({ id: phoneAccountsTable.id }).from(phoneAccountsTable).where(eq(phoneAccountsTable.id, memberId)).limit(1);
    if (!member) {
      res.status(404).json({ error: "Member account was not found." });
      return;
    }
    const temporaryPassword = randomBytes(18).toString("base64url");
    const passwordHash = await hashTemporaryPassword(temporaryPassword);
    await db.transaction(async (tx) => {
      await tx.update(phoneAccountsTable).set({ passwordHash }).where(eq(phoneAccountsTable.id, memberId));
      await tx.delete(phoneSessionsTable).where(eq(phoneSessionsTable.accountId, memberId));
      await tx.insert(adminAuditLogsTable).values({
        adminAccountId: admin.id,
        targetAccountId: memberId,
        action: "member.password_reset",
        reason: "Administrator issued a temporary password",
      });
    });
    res.json(ResetAdminMemberPasswordResponse.parse({ memberId, temporaryPassword }));
  } catch (error) {
    req.log.error({ error, route: "admin.member.password-reset" }, "Could not reset member password");
    res.status(500).json({ error: "Could not reset the member password." });
  }
});

router.patch("/admin/members/:memberId/status", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (!admin.isOwner) { res.status(403).json({ error: "Only the root owner can ban or restore member accounts." }); return; }
  const memberId = req.params.memberId;
  const parsed = UpdateAdminMemberStatusBody.safeParse(req.body);
  if (!/^[0-9a-f-]{36}$/i.test(memberId) || !parsed.success) {
    res.status(400).json({ error: "Choose an account status and enter a reason." });
    return;
  }
  if (!parsed.data.isActive) {
    const primaryPhone = typeof process.env.ADMIN_PHONE === "string" ? normalizePhone(process.env.ADMIN_PHONE) : null;
    const [target] = await db.select({ phoneNumber: phoneAccountsTable.phoneNumber })
      .from(phoneAccountsTable).where(eq(phoneAccountsTable.id, memberId)).limit(1);
    if (target?.phoneNumber === primaryPhone) {
      res.status(409).json({ error: "The primary administrator account cannot be deactivated." });
      return;
    }
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [member] = await tx.update(phoneAccountsTable)
        .set({ isActive: parsed.data.isActive })
        .where(eq(phoneAccountsTable.id, memberId))
        .returning({ id: phoneAccountsTable.id, isActive: phoneAccountsTable.isActive });
      if (!member) return null;
      if (!parsed.data.isActive) await tx.delete(phoneSessionsTable).where(eq(phoneSessionsTable.accountId, memberId));
      await tx.insert(adminAuditLogsTable).values({
        adminAccountId: admin.id,
        targetAccountId: memberId,
        action: parsed.data.isActive ? "member.activated" : parsed.data.reason.startsWith("Soft-archived by owner") ? "member.archived" : "member.deactivated",
        reason: parsed.data.reason,
      });
      return member;
    });
    if (!result) {
      res.status(404).json({ error: "Member account was not found." });
      return;
    }
    res.json(UpdateAdminMemberStatusResponse.parse({ memberId, isActive: result.isActive }));
  } catch (error) {
    req.log.error({ error, route: "admin.member.status" }, "Could not update member status");
    res.status(500).json({ error: "Could not update member status." });
  }
});

router.post("/admin/members/:memberId/wallet-adjustments", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (!admin.isOwner) { res.status(403).json({ error: "Only the root owner can credit or debit member wallets." }); return; }
  const memberId = req.params.memberId;
  const parsed = CreateAdminWalletAdjustmentBody.safeParse(req.body);
  if (!/^[0-9a-f-]{36}$/i.test(memberId) || !parsed.success) {
    res.status(400).json({ error: "Enter a positive whole-UGX amount and a reason." });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const { amountUgx, direction, reason } = parsed.data;
      const [member] = await tx.update(phoneAccountsTable)
        .set({ walletBalanceUgx: direction === "credit"
          ? sql`${phoneAccountsTable.walletBalanceUgx} + ${amountUgx}`
          : sql`${phoneAccountsTable.walletBalanceUgx} - ${amountUgx}` })
        .where(and(
          eq(phoneAccountsTable.id, memberId),
          direction === "debit" ? sql`${phoneAccountsTable.walletBalanceUgx} >= ${amountUgx}` : sql`true`,
        ))
        .returning({ walletBalanceUgx: phoneAccountsTable.walletBalanceUgx });
      if (!member) return null;
      await tx.insert(adminAuditLogsTable).values({
        adminAccountId: admin.id,
        targetAccountId: memberId,
        action: `wallet.${direction}`,
        amountUgx,
        reason,
        details: "Available wallet balance adjustment; accumulated earnings and deposit totals were not changed.",
      });
      return member;
    });
    if (!result) {
      res.status(400).json({ error: "Member was not found or the debit exceeds the available wallet balance." });
      return;
    }
    res.json(CreateAdminWalletAdjustmentResponse.parse({ memberId, walletBalanceUgx: result.walletBalanceUgx }));
  } catch (error) {
    req.log.error({ error, route: "admin.member.wallet-adjustment" }, "Could not adjust member wallet");
    res.status(500).json({ error: "Could not adjust the member wallet." });
  }
});

router.get("/admin/audit-logs", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const logs = await db.select().from(adminAuditLogsTable).orderBy(desc(adminAuditLogsTable.createdAt)).limit(100);
    const ids = [...new Set(logs.flatMap((log) => [log.adminAccountId, log.targetAccountId].filter((id): id is string => Boolean(id))))];
    const accounts = ids.length
      ? await db.select({ id: phoneAccountsTable.id, phoneNumber: phoneAccountsTable.phoneNumber }).from(phoneAccountsTable).where(inArray(phoneAccountsTable.id, ids))
      : [];
    const phones = new Map(accounts.map((account) => [account.id, account.phoneNumber]));
    res.json(GetAdminAuditLogsResponse.parse({ logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      performedByPhone: phones.get(log.adminAccountId) ?? "+256700000000",
      targetPhone: log.targetAccountId ? phones.get(log.targetAccountId) ?? null : null,
      amountUgx: log.amountUgx,
      reason: log.reason,
      details: log.details,
      createdAt: log.createdAt,
    })) }));
  } catch (error) {
    req.log.error({ error, route: "admin.audit-logs" }, "Could not load administrator audit history");
    res.status(500).json({ error: "Could not load administrator audit history." });
  }
});

router.get("/admin/admins", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const admins = await db
      .select({
        id: phoneAccountsTable.id,
        phoneNumber: phoneAccountsTable.phoneNumber,
        createdAt: adminAccountsTable.createdAt,
      })
      .from(adminAccountsTable)
      .innerJoin(phoneAccountsTable, eq(adminAccountsTable.accountId, phoneAccountsTable.id))
      .orderBy(desc(adminAccountsTable.createdAt));
    res.json(GetAdminAccountsResponse.parse({ admins }));
  } catch (error) {
    req.log.error({ error, route: "admin.admins.get" }, "Could not load administrator accounts");
    res.status(500).json({ error: "Could not load administrator accounts." });
  }
});

router.post("/admin/admins", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = AddAdminAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid member phone number." });
    return;
  }
  const phoneNumber = normalizePhone(parsed.data.phoneNumber);
  if (!phoneNumber) {
    res.status(400).json({ error: "Enter a valid Ugandan mobile phone number." });
    return;
  }
  try {
    const [target] = await db
      .select({ id: phoneAccountsTable.id, phoneNumber: phoneAccountsTable.phoneNumber })
      .from(phoneAccountsTable)
      .where(eq(phoneAccountsTable.phoneNumber, phoneNumber))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "That phone number does not belong to a registered member." });
      return;
    }
    const configuredPhone = typeof process.env.ADMIN_PHONE === "string"
      ? normalizePhone(process.env.ADMIN_PHONE)
      : null;
    if (phoneNumber === configuredPhone) {
      res.status(409).json({ error: "That member is already the primary administrator." });
      return;
    }
    const [granted] = await db
      .insert(adminAccountsTable)
      .values({ accountId: target.id, grantedByAccountId: admin.id })
      .onConflictDoNothing()
      .returning({ createdAt: adminAccountsTable.createdAt });
    if (!granted) {
      res.status(409).json({ error: "That member is already an administrator." });
      return;
    }
    await db.insert(adminAuditLogsTable).values({
      adminAccountId: admin.id,
      targetAccountId: target.id,
      action: "admin.access_granted",
      reason: "Administrator granted access",
    });
    res.status(201).json(AddAdminAccountResponse.parse({
      id: target.id,
      phoneNumber: target.phoneNumber,
      createdAt: granted.createdAt,
    }));
  } catch (error) {
    req.log.error({ error, route: "admin.admins.post" }, "Could not grant administrator access");
    res.status(500).json({ error: "Could not grant administrator access." });
  }
});

async function readTaskCenterSettings() {
  const [stored] = await db.select({ tasks: taskCenterSettingsTable.tasks })
    .from(taskCenterSettingsTable)
    .where(eq(taskCenterSettingsTable.id, "default"))
    .limit(1);
  const settings = GetAdminTaskCenterSettingsResponse.parse({ tasks: stored?.tasks ?? defaultTaskDefinitions });
  return settings.tasks.filter((task) => !isLegacyCheckInTask(task));
}

router.get("/task-center", async (req, res): Promise<void> => {
  try {
    const tasks = (await readTaskCenterSettings()).filter(isInviteMilestone);
    res.json(GetTaskCenterSettingsResponse.parse({ tasks }));
  } catch (error) {
    req.log.error({ error, route: "task-center.get" }, "Could not load task definitions");
    res.status(500).json({ error: "Could not load task definitions." });
  }
});

router.get("/admin/task-center", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    res.json(GetAdminTaskCenterSettingsResponse.parse({ tasks: await readTaskCenterSettings() }));
  } catch (error) {
    req.log.error({ error, route: "admin.task-center.get" }, "Could not load admin task definitions");
    res.status(500).json({ error: "Could not load task definitions." });
  }
});

router.put("/admin/task-center", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = UpdateAdminTaskCenterSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check each task title, objective, UGX reward, and frequency." });
    return;
  }
  const tasks = parsed.data.tasks.filter((task) => !isLegacyCheckInTask(task));
  const ids = tasks.map((task) => task.id);
  if (new Set(ids).size !== ids.length) {
    res.status(400).json({ error: "Each task must have a unique ID." });
    return;
  }
  if (tasks.some((task) => task.enabled && task.rewardUgx === null)) {
    res.status(400).json({ error: "Set a UGX reward before marking a task active." });
    return;
  }
  try {
    await db.insert(taskCenterSettingsTable)
      .values({ id: "default", tasks, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: taskCenterSettingsTable.id,
        set: { tasks, updatedAt: new Date() },
      });
    await db.insert(adminAuditLogsTable).values({
      adminAccountId: admin.id,
      action: "task_center.updated",
      details: JSON.stringify({ taskCount: tasks.length, enabledTaskIds: tasks.filter((task) => task.enabled).map((task) => task.id) }),
    });
    res.json(UpdateAdminTaskCenterSettingsResponse.parse({ tasks }));
  } catch (error) {
    req.log.error({ error, route: "admin.task-center.put" }, "Could not save task definitions");
    res.status(500).json({ error: "Could not save task definitions." });
  }
});

router.get("/admin/recharge-requests", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const requests = await db
      .select({
        id: rechargeRequestsTable.id,
        amountUgx: rechargeRequestsTable.amountUgx,
        payerPhone: rechargeRequestsTable.payerPhone,
        status: rechargeRequestsTable.status,
        createdAt: rechargeRequestsTable.createdAt,
        memberPhone: phoneAccountsTable.phoneNumber,
      })
      .from(rechargeRequestsTable)
      .innerJoin(phoneAccountsTable, eq(rechargeRequestsTable.accountId, phoneAccountsTable.id))
      .orderBy(desc(rechargeRequestsTable.createdAt))
      .limit(100);
    res.json({ requests });
  } catch (error) {
    req.log.error({ error, route: "admin.recharge-requests" }, "Could not load recharge requests");
    res.status(500).json({ error: "Could not load recharge requests." });
  }
});

router.post("/admin/recharge-requests/:id/verify", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const id = req.params.id;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(400).json({ error: "Invalid recharge request." });
    return;
  }
  try {
    const request = await db.transaction(async (tx) => {
      const [verified] = await tx.update(rechargeRequestsTable)
        .set({ status: "verified" })
        .where(and(eq(rechargeRequestsTable.id, id), eq(rechargeRequestsTable.status, "pending")))
        .returning({
          id: rechargeRequestsTable.id,
          accountId: rechargeRequestsTable.accountId,
          amountUgx: rechargeRequestsTable.amountUgx,
        });
      if (!verified) return null;

      const [account] = await tx.update(phoneAccountsTable)
        .set({
          walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${verified.amountUgx}`,
          depositBalanceUgx: sql`${phoneAccountsTable.depositBalanceUgx} + ${verified.amountUgx}`,
          totalDepositedUgx: sql`${phoneAccountsTable.totalDepositedUgx} + ${verified.amountUgx}`,
        })
        .where(eq(phoneAccountsTable.id, verified.accountId))
        .returning({ id: phoneAccountsTable.id });
      if (!account) throw new Error("Recharge account no longer exists.");
      await tx.insert(adminAuditLogsTable).values({
        adminAccountId: admin.id,
        targetAccountId: verified.accountId,
        action: "deposit.verified",
        amountUgx: verified.amountUgx,
        reason: `Recharge request ${verified.id} verified`,
      });

      const depositAccounts = await tx.select({
        id: phoneAccountsTable.id,
        totalDepositedUgx: phoneAccountsTable.totalDepositedUgx,
      }).from(phoneAccountsTable);
      const referralLinks = await tx.select({
        accountId: phoneReferralCodesTable.accountId,
        referredByAccountId: phoneReferralCodesTable.referredByAccountId,
      }).from(phoneReferralCodesTable);
      const teamDepositsByAccount = calculateLevelOneToThreeTeamDeposits(depositAccounts, referralLinks);
      const ancestorIds = getReferralAncestorsThroughLevelThree(verified.accountId, referralLinks).sort();
      for (const referrerId of ancestorIds) {
        await tx.select({ id: phoneAccountsTable.id })
          .from(phoneAccountsTable)
          .where(eq(phoneAccountsTable.id, referrerId))
          .for("update");
        const teamDeposits = teamDepositsByAccount.get(referrerId) ?? 0;
        for (const milestone of TEAM_DEPOSIT_MILESTONES) {
          if (teamDeposits < milestone.thresholdUgx) continue;
          const [claim] = await tx.insert(teamDepositMilestoneClaimsTable)
            .values({ accountId: referrerId, milestoneId: milestone.id, rewardUgx: milestone.rewardUgx })
            .onConflictDoNothing()
            .returning({ id: teamDepositMilestoneClaimsTable.id });
          if (!claim) continue;
          await tx.update(phoneAccountsTable)
            .set({
              walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${milestone.rewardUgx}`,
              totalAccumulatedUgx: sql`${phoneAccountsTable.totalAccumulatedUgx} + ${milestone.rewardUgx}`,
            })
            .where(eq(phoneAccountsTable.id, referrerId));
        }
      }
      return verified;
    });
    if (!request) {
      res.status(404).json({ error: "Pending recharge request was not found." });
      return;
    }
    res.json({ requestId: request.id, status: "verified", walletCredited: true });
  } catch (error) {
    req.log.error({ error, route: "admin.recharge-requests.verify" }, "Could not verify recharge request");
    res.status(500).json({ error: "Could not verify recharge request." });
  }
});

router.get("/admin/transactions", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const [orders, deposits, checkins, withdrawals, milestones, giftRedemptions, commissions, adjustments] = await Promise.all([
      db.select({ id: productOrdersTable.id, member: phoneAccountsTable.phoneNumber, amountUgx: productOrdersTable.priceUgx, status: productOrdersTable.status, createdAt: productOrdersTable.createdAt })
        .from(productOrdersTable).innerJoin(phoneAccountsTable, eq(productOrdersTable.buyerAccountId, phoneAccountsTable.id)).limit(500),
      db.select({ id: rechargeRequestsTable.id, member: phoneAccountsTable.phoneNumber, amountUgx: rechargeRequestsTable.amountUgx, status: rechargeRequestsTable.status, createdAt: rechargeRequestsTable.createdAt })
        .from(rechargeRequestsTable).innerJoin(phoneAccountsTable, eq(rechargeRequestsTable.accountId, phoneAccountsTable.id)).where(eq(rechargeRequestsTable.status, "verified")).limit(500),
      db.select({ id: presenceClaimsTable.id, member: phoneAccountsTable.phoneNumber, amountUgx: presenceClaimsTable.rewardUgx, createdAt: presenceClaimsTable.createdAt })
        .from(presenceClaimsTable).innerJoin(phoneAccountsTable, eq(presenceClaimsTable.accountId, phoneAccountsTable.id)).limit(500),
      db.select({ id: withdrawalRequestsTable.id, member: phoneAccountsTable.phoneNumber, amountUgx: withdrawalRequestsTable.amountUgx, status: withdrawalRequestsTable.status, createdAt: withdrawalRequestsTable.createdAt })
        .from(withdrawalRequestsTable).innerJoin(phoneAccountsTable, eq(withdrawalRequestsTable.accountId, phoneAccountsTable.id)).limit(500),
      db.select({ id: teamDepositMilestoneClaimsTable.id, member: phoneAccountsTable.phoneNumber, amountUgx: teamDepositMilestoneClaimsTable.rewardUgx, createdAt: teamDepositMilestoneClaimsTable.createdAt })
        .from(teamDepositMilestoneClaimsTable).innerJoin(phoneAccountsTable, eq(teamDepositMilestoneClaimsTable.accountId, phoneAccountsTable.id)).limit(500),
      db.select({ id: giftCodesTable.id, member: phoneAccountsTable.phoneNumber, amountUgx: giftCodesTable.amountUgx, createdAt: giftCodesTable.redeemedAt })
        .from(giftCodesTable).innerJoin(phoneAccountsTable, eq(giftCodesTable.redeemedByAccountId, phoneAccountsTable.id)).where(isNotNull(giftCodesTable.redeemedAt)).limit(500),
      db.select({ id: referralCommissionsTable.id, member: phoneAccountsTable.phoneNumber, amountUgx: referralCommissionsTable.amountUgx, createdAt: referralCommissionsTable.createdAt })
        .from(referralCommissionsTable).innerJoin(phoneAccountsTable, eq(referralCommissionsTable.recipientAccountId, phoneAccountsTable.id)).limit(500),
      db.select({ id: adminAuditLogsTable.id, member: adminAuditLogsTable.targetAccountId, amountUgx: adminAuditLogsTable.amountUgx, action: adminAuditLogsTable.action, createdAt: adminAuditLogsTable.createdAt })
        .from(adminAuditLogsTable).where(and(inArray(adminAuditLogsTable.action, ["wallet.credit", "wallet.debit"]), isNotNull(adminAuditLogsTable.targetAccountId))).limit(500),
    ]);
    const transactions = [
      ...orders.map((item) => ({ ...item, type: "Product Purchase", amountUgx: -item.amountUgx })),
      ...deposits.map((item) => ({ ...item, type: "Deposit Credit" })),
      ...checkins.map((item) => ({ ...item, type: "Check-in", status: "credited" })),
      ...withdrawals.map((item) => ({ ...item, type: item.status === "failed" ? "Withdrawal Refund" : "Withdrawal", amountUgx: item.status === "failed" ? item.amountUgx : -item.amountUgx })),
      ...milestones.map((item) => ({ ...item, type: "Team Deposit Milestone", status: "credited" })),
      ...giftRedemptions.map((item) => ({ ...item, type: "Gift Code Credit", status: "credited", createdAt: item.createdAt ?? new Date(0) })),
      ...commissions.map((item) => ({ ...item, type: "Referral Commission", status: "credited" })),
      ...adjustments.map((item) => ({ id: String(item.id), member: item.member ?? "Unknown member", amountUgx: item.action === "wallet.debit" ? -(item.amountUgx ?? 0) : (item.amountUgx ?? 0), type: item.action === "wallet.debit" ? "Admin Debit" : "Admin Credit", status: "completed", createdAt: item.createdAt })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 500);
    res.json({ transactions });
  } catch (error) {
    req.log.error({ error, route: "admin.transactions.get" }, "Could not load transaction history");
    res.status(500).json({ error: "Could not load transactions." });
  }
});

router.get("/admin/withdrawals", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const withdrawals = await db.select({
      id: withdrawalRequestsTable.id,
      amountUgx: withdrawalRequestsTable.amountUgx,
      feeUgx: withdrawalRequestsTable.feeUgx,
      receivedUgx: withdrawalRequestsTable.receivedUgx,
      payoutPhone: withdrawalRequestsTable.payoutPhone,
      payoutProvider: withdrawalRequestsTable.payoutProvider,
      payoutHolderName: sql<string | null>`COALESCE(${withdrawalRequestsTable.payoutHolderName}, ${payoutAccountsTable.holderName})`,
      status: withdrawalRequestsTable.status,
      createdAt: withdrawalRequestsTable.createdAt,
      processedAt: withdrawalRequestsTable.processedAt,
      resolutionNote: withdrawalRequestsTable.resolutionNote,
      memberPhone: phoneAccountsTable.phoneNumber,
    }).from(withdrawalRequestsTable)
      .innerJoin(phoneAccountsTable, eq(withdrawalRequestsTable.accountId, phoneAccountsTable.id))
      .leftJoin(payoutAccountsTable, eq(payoutAccountsTable.accountId, withdrawalRequestsTable.accountId))
      .orderBy(sql`${withdrawalRequestsTable.createdAt} DESC`)
      .limit(100);
    res.json(GetAdminWithdrawalsResponse.parse({ withdrawals }));
  } catch (error) {
    req.log.error({ error, route: "admin.withdrawals.get" }, "Could not load withdrawal requests");
    res.status(500).json({ error: "Could not load withdrawal requests." });
  }
});

router.post("/admin/withdrawals/:withdrawalId", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = ProcessAdminWithdrawalBody.safeParse(req.body);
  const id = req.params.withdrawalId;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) {
    res.status(400).json({ error: "Choose a valid outcome and enter a short processing note." });
    return;
  }
  try {
    const withdrawal = await db.transaction(async (tx) => {
      const [current] = await tx.select({
        id: withdrawalRequestsTable.id,
        accountId: withdrawalRequestsTable.accountId,
        amountUgx: withdrawalRequestsTable.amountUgx,
        status: withdrawalRequestsTable.status,
      }).from(withdrawalRequestsTable)
        .where(eq(withdrawalRequestsTable.id, id))
        .for("update")
        .limit(1);
      if (!current || current.status !== "pending") return null;
      if (parsed.data.status === "failed") {
        await tx.update(phoneAccountsTable)
          .set({ walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${current.amountUgx}` })
          .where(eq(phoneAccountsTable.id, current.accountId));
      }
      const [updated] = await tx.update(withdrawalRequestsTable).set({
        status: parsed.data.status,
        resolutionNote: parsed.data.resolutionNote.trim(),
        processedByAccountId: admin.id,
        processedAt: new Date(),
      }).where(eq(withdrawalRequestsTable.id, id)).returning();
      const [member] = await tx.select({ phoneNumber: phoneAccountsTable.phoneNumber })
        .from(phoneAccountsTable).where(eq(phoneAccountsTable.id, current.accountId)).limit(1);
      await tx.insert(adminAuditLogsTable).values({
        adminAccountId: admin.id,
        targetAccountId: current.accountId,
        action: parsed.data.status === "paid" ? "withdrawal.paid_manually" : "withdrawal.failed_refunded",
        amountUgx: current.amountUgx,
        reason: parsed.data.resolutionNote.trim(),
        details: `Withdrawal ${id}; ${parsed.data.status === "failed" ? "gross amount refunded" : "marked paid after manual transfer"}.`,
      });
      return { ...updated, memberPhone: member?.phoneNumber ?? "" };
    });
    if (!withdrawal) {
      res.status(409).json({ error: "This request is missing or has already been processed." });
      return;
    }
    res.json(ProcessAdminWithdrawalResponse.parse(withdrawal));
  } catch (error) {
    req.log.error({ error, route: "admin.withdrawals.process" }, "Could not process withdrawal request");
    res.status(500).json({ error: "Could not process the withdrawal request." });
  }
});

router.get("/admin/settings", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    res.json(await readSiteSettings());
  } catch (error) {
    req.log.error({ error, route: "admin.settings.get" }, "Could not load site settings");
    res.status(500).json({ error: "Could not load site settings." });
  }
});

router.put("/admin/settings", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = UpdateAdminSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the site settings and try again." });
    return;
  }
  try {
    const settings = parsed.data;
    await db.insert(adminSiteSettingsTable).values({ id: "default", settings, updatedAt: new Date() })
      .onConflictDoUpdate({ target: adminSiteSettingsTable.id, set: { settings, updatedAt: new Date() } });
    await db.insert(adminAuditLogsTable).values({
      adminAccountId: admin.id, action: "site_settings.updated",
      details: "Administrator updated site-wide settings.",
    });
    res.json(GetAdminSiteSettingsResponse.parse(settings));
  } catch (error) {
    req.log.error({ error, route: "admin.settings.update" }, "Could not save site settings");
    res.status(500).json({ error: "Could not save site settings." });
  }
});

export default router;
