import express from "express";
import cors from "cors";
import authRoutes from "./authRoutes";
import adminRoutes from "./adminRoutes"; // 🔹 add this

export function createServer() {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Health check route
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "auth" });
  });

  app.use(authRoutes);
  app.use(adminRoutes); // 🔹 add this

  return app;
}
