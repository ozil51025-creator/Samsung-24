import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  phoneAccountsTable,
  phoneReferralCodesTable,
  rechargeRequestsTable,
  teamDepositMilestoneClaimsTable,
} from "@workspace/db";
import {
  calculateLevelOneToThreeTeamDeposits,
  getReferralAncestorsThroughLevelThree,
  TEAM_DEPOSIT_MILESTONES,
} from "../lib/team-deposit-milestones";

const router: IRouter = Router();

function hasValidSignature(rawBody: Buffer, signature: string, secret: string) {
  const normalized = signature.trim().replace(/^sha256=/i, "");
  const digest = createHmac("sha256", secret).update(rawBody).digest();
  const supplied = /^[0-9a-f]{64}$/i.test(normalized)
    ? Buffer.from(normalized, "hex")
    : Buffer.from(normalized, "base64");
  return supplied.length === digest.length && timingSafeEqual(supplied, digest);
}

router.post("/", (req, res) => {
  void (async () => {
    const secret = process.env.PESAJET_WEBHOOK_SECRET;
    if (!secret) {
      res.status(503).json({ error: "Webhook verification is not configured." });
      return;
    }
    if (!Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: "Expected a raw JSON webhook body." });
      return;
    }
    const signature = req.get("X-Webhook-Signature");
    if (!signature || !hasValidSignature(req.body, signature, secret)) {
      res.status(401).json({ error: "Invalid webhook signature." });
      return;
    }
    let event: unknown;
    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      res.status(400).json({ error: "Invalid webhook JSON." });
      return;
    }
    const payload = event && typeof event === "object" ? event as Record<string, unknown> : {};
    if (payload.event !== "payment.completed" || String(payload.status).toUpperCase() !== "COMPLETED") {
      res.status(200).json({ received: true, credited: false });
      return;
    }
    const reference = typeof payload.reference === "string" ? payload.reference : "";
    const transactionId = typeof payload.transactionId === "string" ? payload.transactionId : "";
    const amount = payload.amount;
    if (!/^[0-9a-f-]{36}$/i.test(reference) || !transactionId || !Number.isSafeInteger(amount) || payload.currency !== "UGX") {
      req.log.warn({ route: "pesajet.webhook", event: payload.event }, "Ignored malformed completed-payment event");
      res.status(200).json({ received: true, credited: false });
      return;
    }
    const credited = await db.transaction(async (tx) => {
      const [request] = await tx.update(rechargeRequestsTable)
        .set({ status: "verified" })
        .where(and(
          eq(rechargeRequestsTable.id, reference),
          eq(rechargeRequestsTable.status, "pending"),
          eq(rechargeRequestsTable.amountUgx, amount as number),
        ))
        .returning({ id: rechargeRequestsTable.id, accountId: rechargeRequestsTable.accountId, amountUgx: rechargeRequestsTable.amountUgx });
      if (!request) return false;
      const [account] = await tx.update(phoneAccountsTable)
        .set({
          walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${request.amountUgx}`,
          depositBalanceUgx: sql`${phoneAccountsTable.depositBalanceUgx} + ${request.amountUgx}`,
          totalDepositedUgx: sql`${phoneAccountsTable.totalDepositedUgx} + ${request.amountUgx}`,
        })
        .where(eq(phoneAccountsTable.id, request.accountId))
        .returning({ id: phoneAccountsTable.id });
      if (!account) throw new Error("Recharge account no longer exists.");

      const accounts = await tx.select({ id: phoneAccountsTable.id, totalDepositedUgx: phoneAccountsTable.totalDepositedUgx }).from(phoneAccountsTable);
      const links = await tx.select({ accountId: phoneReferralCodesTable.accountId, referredByAccountId: phoneReferralCodesTable.referredByAccountId }).from(phoneReferralCodesTable);
      const teamTotals = calculateLevelOneToThreeTeamDeposits(accounts, links);
      const ancestors = getReferralAncestorsThroughLevelThree(request.accountId, links).sort();
      for (const ancestorId of ancestors) {
        await tx.select({ id: phoneAccountsTable.id }).from(phoneAccountsTable).where(eq(phoneAccountsTable.id, ancestorId)).for("update");
        const teamDeposits = teamTotals.get(ancestorId) ?? 0;
        for (const milestone of TEAM_DEPOSIT_MILESTONES) {
          if (teamDeposits < milestone.thresholdUgx) continue;
          const [claim] = await tx.insert(teamDepositMilestoneClaimsTable)
            .values({ accountId: ancestorId, milestoneId: milestone.id, rewardUgx: milestone.rewardUgx })
            .onConflictDoNothing()
            .returning({ id: teamDepositMilestoneClaimsTable.id });
          if (claim) {
            await tx.update(phoneAccountsTable)
              .set({
                walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${milestone.rewardUgx}`,
                totalAccumulatedUgx: sql`${phoneAccountsTable.totalAccumulatedUgx} + ${milestone.rewardUgx}`,
              })
              .where(eq(phoneAccountsTable.id, ancestorId));
          }
        }
      }
      return true;
    });
    res.status(200).json({ received: true, credited });
  })().catch((error) => {
    req.log.error({ error, route: "pesajet.webhook" }, "Could not process verified PesaJet callback");
    if (!res.headersSent) res.status(500).json({ error: "Webhook processing failed." });
  });
});

export default router;
