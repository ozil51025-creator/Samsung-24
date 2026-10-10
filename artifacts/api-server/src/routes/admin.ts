import { createHash } from "node:crypto";
import { and, count, desc, eq, gt, isNotNull } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  phoneAccountsTable,
  phoneReferralCodesTable,
  phoneSessionsTable,
  taskCenterSettingsTable,
} from "@workspace/db";
import {
  GetAdminTaskCenterSettingsResponse,
  GetAdminMembersResponse,
  GetAdminOverviewResponse,
  GetTaskCenterSettingsResponse,
  UpdateAdminTaskCenterSettingsBody,
  UpdateAdminTaskCenterSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const defaultTaskDefinitions = [
  { id: "invite-3", title: "Invite 3 Level 1 members", objective: 3, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
  { id: "invite-10", title: "Invite 10 Level 1 members", objective: 10, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
  { id: "invite-30", title: "Invite 30 Level 1 members", objective: 30, objectiveUnit: "members", rewardUgx: null, rewardFrequency: "once", enabled: false },
];

function isPresenceTask(task: { id: string; title: string }) {
  return task.id === "daily-check-in" || /\bcheck[\s-]*in\b/i.test(task.title);
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
    .select({ id: phoneAccountsTable.id, phoneNumber: phoneAccountsTable.phoneNumber })
    .from(phoneSessionsTable)
    .innerJoin(phoneAccountsTable, eq(phoneSessionsTable.accountId, phoneAccountsTable.id))
    .where(and(
      eq(phoneSessionsTable.tokenHash, tokenHash),
      gt(phoneSessionsTable.expiresAt, new Date()),
    ))
    .limit(1);

  if (!account) {
    res.status(401).json({ error: "Sign in with the configured admin account." });
    return null;
  }
  if (account.phoneNumber !== configuredPhone) {
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

async function readTaskCenterSettings() {
  const [stored] = await db.select({ tasks: taskCenterSettingsTable.tasks })
    .from(taskCenterSettingsTable)
    .where(eq(taskCenterSettingsTable.id, "default"))
    .limit(1);
  const settings = GetAdminTaskCenterSettingsResponse.parse({ tasks: stored?.tasks ?? defaultTaskDefinitions });
  return settings.tasks.filter((task) => !isPresenceTask(task));
}

router.get("/task-center", async (req, res): Promise<void> => {
  try {
    res.json(GetTaskCenterSettingsResponse.parse({ tasks: await readTaskCenterSettings() }));
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
  const tasks = parsed.data.tasks.filter((task) => !isPresenceTask(task));
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
    res.json(UpdateAdminTaskCenterSettingsResponse.parse({ tasks }));
  } catch (error) {
    req.log.error({ error, route: "admin.task-center.put" }, "Could not save task definitions");
    res.status(500).json({ error: "Could not save task definitions." });
  }
});

export default router;
