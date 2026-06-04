import express from "express";
import paymentRoutes from "./routes/PaymentRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("PayOnce API Running");
});

app.use("/api/v1", paymentRoutes);

export default app;
