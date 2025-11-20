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

/**
 * GET /admin/kyc/pending
 * List users with PENDING KYC
 */
router.get(
  "/admin/kyc/pending",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (_req: AuthedRequest, res) => {
    try {
      const pending = await prisma.user.findMany({
        where: { kycStatus: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
        },
      });

      return res.json({ users: pending });
    } catch (err) {
      console.error("Get pending KYC users error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /admin/kyc/:id/verify
 * Set kycStatus = VERIFIED
 */
router.patch(
  "/admin/kyc/:id/verify",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: { id },
        data: { kycStatus: "VERIFIED" },
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
      console.error("Verify KYC error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /admin/kyc/:id/reject
 * Set kycStatus = REJECTED
 */
router.patch(
  "/admin/kyc/:id/reject",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: { id },
        data: { kycStatus: "REJECTED" },
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
      console.error("Reject KYC error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
