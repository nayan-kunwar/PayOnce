import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";
import healthRoutes from "./routes/healthRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";
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
  }),
);
app.use(helmet());
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

app.use(express.static(publicDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/demo", (_req, res) => {
  res.sendFile(path.join(publicDir, "demo.html"));
});

app.use(healthRoutes);
app.use("/demo/api", demoRoutes);
app.use("/api/v1", paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
