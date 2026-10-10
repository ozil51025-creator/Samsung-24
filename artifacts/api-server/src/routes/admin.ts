import { createHash } from "node:crypto";
import { and, count, desc, eq, gt, isNotNull } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  phoneAccountsTable,
  phoneReferralCodesTable,
  phoneSessionsTable,
} from "@workspace/db";
import {
  AdminMembers,
  AdminOverview,
} from "@workspace/api-zod";

const router: IRouter = Router();

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
    res.json(AdminOverview.parse({
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
    res.json(AdminMembers.parse({ members: rows }));
  } catch (error) {
    req.log.error({ error, route: "admin.members" }, "Could not load admin member list");
    res.status(500).json({ error: "Could not load member accounts." });
  }
});

export default router;
