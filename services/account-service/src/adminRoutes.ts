import { Router } from "express";
import axios from "axios";
import prisma from "./prisma";
import { authMiddleware, requireRole, AuthedRequest } from "./authMiddleware";

const router = Router();

// URL for talking to auth-service (inside k8s or docker network)
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:4001";

/**
 * Helper: fetch user details from auth-service by ID
 */
async function fetchUserForAccount(userId: string) {
  try {
    const res = await axios.get(`${AUTH_SERVICE_URL}/internal/users/${userId}`);
    return res.data.user as {
      id: string;
      email: string;
      fullName: string;
      kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
    };
  } catch (err) {
    console.error("Failed to fetch user for account:", userId, err);
    return null;
  }
}

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
      // 1️⃣ Get accounts from account-service DB
      const rawAccounts = await prisma.account.findMany({
        orderBy: { createdAt: "desc" },
      });

      // 2️⃣ Enrich each with owner info from auth-service
      const accounts = await Promise.all(
        rawAccounts.map(async (acc) => {
          const user = await fetchUserForAccount(acc.userId);

          if (!user) {
            // Fallback if auth-service can't find the user
            return {
              id: acc.id,
              accountNumber: acc.accountNumber,
              currency: acc.currency,
              balance: acc.balance,
              status: acc.status,
              type: acc.type,
              ownerId: acc.userId,
              ownerEmail: "unknown",
              ownerFullName: "Unknown user",
              ownerKycStatus: "PENDING" as const,
              createdAt: acc.createdAt,
              updatedAt: acc.updatedAt,
            };
          }

          return {
            id: acc.id,
            accountNumber: acc.accountNumber,
            currency: acc.currency,
            balance: acc.balance,
            status: acc.status,
            type: acc.type,
            ownerId: acc.userId,
            ownerEmail: user.email,
            ownerFullName: user.fullName,
            ownerKycStatus: user.kycStatus,
            createdAt: acc.createdAt,
            updatedAt: acc.updatedAt,
          };
        })
      );

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

      // 1️⃣ Update the account status
      const acc = await prisma.account.update({
        where: { id },
        data: { status: status as any },
      });

      // 2️⃣ Fetch owner info from auth-service
      const user = await fetchUserForAccount(acc.userId);

      let enriched;
      if (!user) {
        enriched = {
          id: acc.id,
          accountNumber: acc.accountNumber,
          currency: acc.currency,
          balance: acc.balance,
          status: acc.status,
          type: acc.type,
          ownerId: acc.userId,
          ownerEmail: "unknown",
          ownerFullName: "Unknown user",
          ownerKycStatus: "PENDING" as const,
          createdAt: acc.createdAt,
          updatedAt: acc.updatedAt,
        };
      } else {
        enriched = {
          id: acc.id,
          accountNumber: acc.accountNumber,
          currency: acc.currency,
          balance: acc.balance,
          status: acc.status,
          type: acc.type,
          ownerId: acc.userId,
          ownerEmail: user.email,
          ownerFullName: user.fullName,
          ownerKycStatus: user.kycStatus,
          createdAt: acc.createdAt,
          updatedAt: acc.updatedAt,
        };
      }

      return res.json({ account: enriched });
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
