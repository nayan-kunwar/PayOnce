import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express, { type Response } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { cspNonce } from "./middleware/cspNonce.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";
import authRoutes from "./routes/authRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";
import docsRoutes from "./routes/docsRoutes.js";
import paymentRoutes from "./routes/PaymentRoutes.js";

const publicDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
);

const app = express();

app.use(requestId);
app.use(
  pinoHttp({
    genReqId: (req) => req.requestId ?? "unknown",
    redact: ["req.headers.authorization", "req.headers.x-api-key"],
  }),
);
app.use(cspNonce);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        (_req, res) =>
          `'nonce-${(res as Response).locals.cspNonce ?? ""}'`,
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
    },
  },
}));
app.use(
  cors({
    origin:
      env.CORS_ORIGINS.length > 0
        ? env.CORS_ORIGINS
        : env.NODE_ENV === "production"
          ? false
          : true,
  }),
);
app.use(express.json());

app.use(docsRoutes);

app.use(express.static(publicDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/demo", (_req, res) => {
  res.sendFile(path.join(publicDir, "demo.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(publicDir, "auth.html"));
});

app.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(publicDir, "dashboard.html"));
});

app.use(healthRoutes);
app.use("/auth", authRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/dashboard/api", dashboardRoutes);
app.use("/demo/api", demoRoutes);
app.use("/api/v1", paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
