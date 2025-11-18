import express from "express";
import cors from "cors";
import authRoutes from "./authRoutes"

export function createServer() {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Health check route
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "auth" });
  });

  app.use(authRoutes)

  return app;
}
