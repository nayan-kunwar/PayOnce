import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";
import healthRoutes from "./routes/healthRoutes.js";
import paymentRoutes from "./routes/PaymentRoutes.js";

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

app.get("/", (_req, res) => {
  res.send("PayOnce API Running");
});

app.use(healthRoutes);
app.use("/api/v1", paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
