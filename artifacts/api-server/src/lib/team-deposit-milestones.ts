export const TEAM_DEPOSIT_MILESTONES = [
  { id: "direct-deposits-100000", thresholdUgx: 100_000, rewardUgx: 2_000 },
  { id: "direct-deposits-500000", thresholdUgx: 500_000, rewardUgx: 20_000 },
  { id: "direct-deposits-700000", thresholdUgx: 700_000, rewardUgx: 10_000 },
  { id: "direct-deposits-1000000", thresholdUgx: 1_000_000, rewardUgx: 10_000 },
  { id: "direct-deposits-2000000", thresholdUgx: 2_000_000, rewardUgx: 50_000 },
  { id: "direct-deposits-4000000", thresholdUgx: 4_000_000, rewardUgx: 100_000 },
] as const;

export type DepositAccount = { id: string; totalDepositedUgx: number };
export type ReferralLink = { accountId: string; referredByAccountId: string | null };

const MAX_TEAM_LEVELS = 3;

function getParentByAccount(referrals: readonly ReferralLink[]) {
  return new Map(referrals.map(({ accountId, referredByAccountId }) => [accountId, referredByAccountId]));
}

export function calculateLevelOneToThreeTeamDeposits(
  accounts: readonly DepositAccount[],
  referrals: readonly ReferralLink[],
) {
  const parentByAccount = getParentByAccount(referrals);
  const totals = new Map(accounts.map(({ id }) => [id, 0]));

  for (const account of accounts) {
    const visited = new Set([account.id]);
    let ancestorId = parentByAccount.get(account.id) ?? null;
    let level = 0;
    while (ancestorId && level < MAX_TEAM_LEVELS) {
      if (visited.has(ancestorId)) throw new Error("Referral hierarchy contains a cycle.");
      visited.add(ancestorId);
      if (!totals.has(ancestorId)) break;
      totals.set(ancestorId, (totals.get(ancestorId) ?? 0) + account.totalDepositedUgx);
      ancestorId = parentByAccount.get(ancestorId) ?? null;
      level += 1;
    }
  }

  return totals;
}

export function getReferralAncestorsThroughLevelThree(
  accountId: string,
  referrals: readonly ReferralLink[],
) {
  const parentByAccount = getParentByAccount(referrals);
  const ancestors: string[] = [];
  const visited = new Set([accountId]);
  let ancestorId = parentByAccount.get(accountId) ?? null;
  let level = 0;

  while (ancestorId && level < MAX_TEAM_LEVELS) {
    if (visited.has(ancestorId)) throw new Error("Referral hierarchy contains a cycle.");
    visited.add(ancestorId);
    ancestors.push(ancestorId);
    ancestorId = parentByAccount.get(ancestorId) ?? null;
    level += 1;
  }

  return ancestors;
}
