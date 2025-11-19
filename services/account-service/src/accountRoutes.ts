import { Router } from "express";
import prisma, { AccountStatus } from "./prisma";
import { AuthedRequest, authMiddleware } from "./authMiddleware";


const router = Router();

// Helper: simple account number generator (you can improve later)
async function generateAccountNumber() {
  // Count existing accounts and pad with zeros
  const count = await prisma.account.count();
  const next = count + 1;
  return `ACC-${next.toString().padStart(6, "0")}`; // e.g. ACC-000001
}

// POST /accounts  -> create a new account for current user
router.post("/accounts", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { currency } = req.body;

    const accountNumber = await generateAccountNumber();

    const account = await prisma.account.create({
      data: {
        accountNumber,
        userId,
        balance: 0,
        currency: currency || "LKR",
        status: AccountStatus.ACTIVE,
      },
    });

    return res.status(201).json({ account });
  } catch (err) {
    console.error("Create account error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /accounts/me  -> list all accounts for current user
router.get("/accounts/me", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ accounts });
  } catch (err) {
    console.error("Get my accounts error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /accounts/:id  -> get a single account if it belongs to current user (or ADMIN)
router.get("/accounts/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const requester = req.user!; // { userId, role }

    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Only owner or ADMIN can view
    if (account.userId !== requester.userId && requester.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: not your account" });
    }

    return res.json({ account });
  } catch (err) {
    console.error("Get account by id error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /accounts/internal-transfer
// Body: { fromAccountId, toAccountId, amount }
router.post(
  "/accounts/internal-transfer",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    try {
      const { fromAccountId, toAccountId, amount } = req.body;

      if (!fromAccountId || !toAccountId || !amount) {
        return res
          .status(400)
          .json({ message: "fromAccountId, toAccountId, amount are required" });
      }

      if (fromAccountId === toAccountId) {
        return res
          .status(400)
          .json({ message: "fromAccountId and toAccountId must be different" });
      }

      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res
          .status(400)
          .json({ message: "amount must be a positive number" });
      }

      // We do everything in a DB transaction to keep it consistent
      try {
        await prisma.$transaction(async (tx) => {
          // 1) Ensure fromAccount has enough balance and decrement
          const fromUpdate = await tx.account.updateMany({
            where: {
              id: fromAccountId,
              balance: { gte: numericAmount }, // balance >= amount
            },
            data: {
              balance: { decrement: numericAmount },
            },
          });

          if (fromUpdate.count === 0) {
            // Either account doesn't exist or insufficient funds
            throw new Error("INSUFFICIENT_FUNDS_OR_NOT_FOUND");
          }

          // 2) Credit toAccount (must exist)
          const toAccount = await tx.account.update({
            where: { id: toAccountId },
            data: {
              balance: { increment: numericAmount },
            },
          });

          // We don't return here; transaction completes if we reach this point
          return toAccount;
        });

        return res.status(200).json({ success: true });
      } catch (err: any) {
        if (err.message === "INSUFFICIENT_FUNDS_OR_NOT_FOUND") {
          return res
            .status(400)
            .json({ message: "Insufficient funds or account not found" });
        }

        console.error("Internal transfer DB error:", err);
        return res
          .status(500)
          .json({ message: "Failed to execute internal transfer" });
      }
    } catch (err) {
      console.error("Internal transfer error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);



export default router;
