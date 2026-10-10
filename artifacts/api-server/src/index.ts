import app from "./app";
import { logger } from "./lib/logger";
import { reconcileExistingTeamDepositMilestones } from "./lib/reconcile-team-deposit-milestones";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function startServer() {
  const reconciliation = await reconcileExistingTeamDepositMilestones();
  logger.info(reconciliation, "Reconciled existing all-level team deposit milestones");

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

void startServer().catch((err: unknown) => {
  logger.error({ err }, "Could not reconcile team deposit milestones at startup");
  process.exit(1);
});
