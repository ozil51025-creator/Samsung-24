import {
  db,
  phoneAccountsTable,
  phoneReferralCodesTable,
  teamDepositMilestoneClaimsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";
import { calculateAllLevelTeamDeposits, TEAM_DEPOSIT_MILESTONES } from "./team-deposit-milestones";

export async function reconcileExistingTeamDepositMilestones() {
  return db.transaction(async (tx) => {
    const accounts = await tx.select({
      id: phoneAccountsTable.id,
      totalDepositedUgx: phoneAccountsTable.totalDepositedUgx,
    }).from(phoneAccountsTable);
    const referralLinks = await tx.select({
      accountId: phoneReferralCodesTable.accountId,
      referredByAccountId: phoneReferralCodesTable.referredByAccountId,
    }).from(phoneReferralCodesTable);
    const totalsByAccount = calculateAllLevelTeamDeposits(accounts, referralLinks);
    let claimsCreated = 0;
    let totalRewardUgx = 0;

    for (const account of accounts) {
      const teamDepositsUgx = totalsByAccount.get(account.id) ?? 0;
      for (const milestone of TEAM_DEPOSIT_MILESTONES) {
        if (teamDepositsUgx < milestone.thresholdUgx) continue;
        const [claim] = await tx.insert(teamDepositMilestoneClaimsTable)
          .values({
            accountId: account.id,
            milestoneId: milestone.id,
            rewardUgx: milestone.rewardUgx,
          })
          .onConflictDoNothing()
          .returning({ id: teamDepositMilestoneClaimsTable.id });
        if (!claim) continue;

        await tx.update(phoneAccountsTable)
          .set({
            walletBalanceUgx: sql`${phoneAccountsTable.walletBalanceUgx} + ${milestone.rewardUgx}`,
            totalAccumulatedUgx: sql`${phoneAccountsTable.totalAccumulatedUgx} + ${milestone.rewardUgx}`,
          })
          .where(sql`${phoneAccountsTable.id} = ${account.id}`);
        claimsCreated += 1;
        totalRewardUgx += milestone.rewardUgx;
      }
    }

    return { claimsCreated, totalRewardUgx };
  });
}
