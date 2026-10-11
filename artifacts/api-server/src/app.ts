import express, { type Express } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import pesajetWebhookRouter from "./routes/pesajet-webhook";
import { logger } from "./lib/logger";

const app: Express = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use("/api/webhooks/pesajet", express.raw({ type: "application/json", limit: "32kb" }), pesajetWebhookRouter);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", router);

// Render serves the web app and API from one origin so existing /api requests
// and secure session cookies work without a separate frontend proxy.
const webDistCandidates = [
  path.resolve(process.cwd(), "artifacts/gadget-shop-signup/dist/public"),
  path.resolve(process.cwd(), "../gadget-shop-signup/dist/public"),
];
const webDistPath =
  webDistCandidates.find((candidate) =>
    existsSync(path.join(candidate, "index.html")),
  ) ?? webDistCandidates[0];
const webIndexPath = path.join(webDistPath, "index.html");

if (process.env.NODE_ENV === "production" && !existsSync(webIndexPath)) {
  throw new Error(
    `Samsung web build not found at ${webIndexPath}. Run the web build before starting the API.`,
  );
}

if (existsSync(webIndexPath)) {
  app.use(express.static(webDistPath, { index: false }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.sendFile(webIndexPath);
  });
}

export default app;
