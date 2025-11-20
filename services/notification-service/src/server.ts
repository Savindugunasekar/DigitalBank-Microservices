import express from "express";
import cors from "cors";
import notificationRoutes from "./notificationRoutes";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "notification" });
  });

  app.use(notificationRoutes);

  return app;
}
