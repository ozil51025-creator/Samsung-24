export const TEAM_DEPOSIT_MILESTONES = [
  { id: "direct-deposits-100000", thresholdUgx: 100_000, rewardUgx: 2_000 },
  { id: "direct-deposits-500000", thresholdUgx: 500_000, rewardUgx: 20_000 },
  { id: "direct-deposits-700000", thresholdUgx: 700_000, rewardUgx: 10_000 },
  { id: "direct-deposits-1000000", thresholdUgx: 1_000_000, rewardUgx: 10_000 },
  { id: "direct-deposits-2000000", thresholdUgx: 2_000_000, rewardUgx: 50_000 },
  { id: "direct-deposits-4000000", thresholdUgx: 4_000_000, rewardUgx: 100_000 },
] as const;
