import { createHash, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { and, count, desc, eq, gt, inArray, isNotNull, sql, sum } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  adminAccountsTable,
  adminAuditLogsTable,
  phoneAccountsTable,
  phoneReferralCodesTable,
  phoneSessionsTable,
  rechargeRequestsTable,
  teamDepositMilestoneClaimsTable,
  taskCenterSettingsTable,
} from "@workspace/db";
import {
  AddAdminAccountBody,
  AddAdminAccountResponse,
  CreateAdminWalletAdjustmentBody,
  CreateAdminWalletAdjustmentResponse,
  GetAdminAccountsResponse,
  GetAdminAuditLogsResponse,
  GetAdminTaskCenterSettingsResponse,
  GetAdminMembersResponse,
  GetAdminOverviewResponse,
  ResetAdminMemberPasswordResponse,
  UpdateAdminMemberStatusBody,
  UpdateAdminMemberStatusResponse,
  GetTaskCenterSettingsResponse,
  UpdateAdminTaskCenterSettingsBody,
  UpdateAdminTaskCenterSettingsResponse,
} from "@workspace/api-zod";
import {
  calculateLevelOneToThreeTeamDeposits,
  getReferralAncestorsThroughLevelThree,
  TEAM_DEPOSIT_MILESTONES,
} from "../lib/team-deposit-milestones";

const router: IRouter = Router();
const defaultTaskDefinitions = [
  { id: "invite-3", title: "Invite 3 Level 1 members", objective: 3, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
  { id: "invite-10", title: "Invite 10 Level 1 members", objective: 10, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
  { id: "invite-30", title: "Invite 30 Level 1 members", objective: 30, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
  { id: "presence", title: "Presence", objective: 1, objectiveUnit: "day", rewardUgx: 500, rewardFrequency: "daily", enabled: true },
];

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

async function requireAdmin(req: Request, res: Response): Promise<{ id: string } | null> {
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
  return { id: account.id };
}

router.get("/admin/overview", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const [users] = await db.select({ value: count() }).from(phoneAccountsTable);
    const [referred] = await db
      .select({ value: count() })
      .from(phoneReferralCodesTable)
      .where(isNotNull(phoneReferralCodesTable.referredByAccountId));
    res.json(GetAdminOverviewResponse.parse({
      totalUsers: users.value,
      referredUsers: referred.value,
      financialRecordsAvailable: false,
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
      })
      .from(phoneAccountsTable)
      .leftJoin(phoneReferralCodesTable, eq(phoneReferralCodesTable.accountId, phoneAccountsTable.id))
      .orderBy(desc(phoneAccountsTable.createdAt))
      .limit(250);
    res.json(GetAdminMembersResponse.parse({ members: rows }));
  } catch (error) {
    req.log.error({ error, route: "admin.members" }, "Could not load admin member list");
    res.status(500).json({ error: "Could not load member accounts." });
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
        action: parsed.data.isActive ? "member.activated" : "member.deactivated",
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

export default router;
