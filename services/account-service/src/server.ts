import express from "express";
import cors from "cors";
import accountRoutes from "./accountRoutes"

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "account" });
  });

  app.use(accountRoutes)

  return app;
}
