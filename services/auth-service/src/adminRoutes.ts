import { Router } from "express";
import prisma from "./prisma";
import { authMiddleware, requireRole, AuthedRequest } from "./authMiddleware";

const router = Router();

/**
 * GET /admin/users
 * List all users (ADMIN only)
 */
router.get(
  "/admin/users",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (_req: AuthedRequest, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ users });
    } catch (err) {
      console.error("Get admin users error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /admin/users/:id/role
 * Change user role (ADMIN only)
 * body: { role: "CUSTOMER" | "ADMIN" | "RISK_OFFICER" }
 */
router.patch(
  "/admin/users/:id/role",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body as { role?: string };

      if (!role) {
        return res.status(400).json({ message: "role is required" });
      }

      const allowed = ["CUSTOMER", "ADMIN", "RISK_OFFICER"];
      if (!allowed.includes(role)) {
        return res.status(400).json({ message: "Invalid role value" });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role: role as any },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ user });
    } catch (err: any) {
      console.error("Change user role error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
