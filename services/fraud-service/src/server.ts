import express from "express";
import cors from "cors";
import fraudRoutes from "./fraudRoutes";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "fraud" });
  });

  // Fraud routes
  app.use(fraudRoutes);

  return app;
}
