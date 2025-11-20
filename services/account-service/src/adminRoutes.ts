import { Router } from "express";
import prisma from "./prisma";
import { authMiddleware, requireRole, AuthedRequest } from "./authMiddleware";

const router = Router();

/**
 * GET /admin/accounts
 * List all accounts (ADMIN only)
 */
router.get(
  "/admin/accounts",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (_req: AuthedRequest, res) => {
    try {
      const accounts = await prisma.account.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          accountNumber: true,
          currency: true,
          balance: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ accounts });
    } catch (err) {
      console.error("Get admin accounts error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /admin/accounts/:id/status
 * Change account status (ADMIN only)
 * body: { status: "ACTIVE" | "FROZEN" | "CLOSED" }
 */
router.patch(
  "/admin/accounts/:id/status",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: string };

      if (!status) {
        return res.status(400).json({ message: "status is required" });
      }

      const allowed = ["ACTIVE", "FROZEN", "CLOSED"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const account = await prisma.account.update({
        where: { id },
        data: { status: status as any },
        select: {
          id: true,
          userId: true,
          accountNumber: true,
          currency: true,
          balance: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ account });
    } catch (err: any) {
      console.error("Change account status error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ message: "Account not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
