import express from "express";
import cors from "cors";
import transactionRoutes from "./transactionRoutes"
import recurringPaymentsRoutes from "./recurringPaymentsRoutes"
export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "transaction" });
  });

  // Transaction routes
  app.use(transactionRoutes);
  app.use(recurringPaymentsRoutes)

  return app;
}
