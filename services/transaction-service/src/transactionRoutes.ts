import { Router } from "express";
import axios from "axios"
import prisma, { TransactionStatus } from "./prisma";
import { AuthedRequest, authMiddleware } from "./authMiddleware";


const router = Router();

// POST /transactions
// Body: { fromAccountId, toAccountId, amount, reference? }
router.post("/transactions", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { fromAccountId, toAccountId, amount, reference } = req.body;

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

    const authHeader = req.headers["authorization"] || "";

    // 1) Validate that fromAccount exists and belongs to this user
    try {
      await axios.get(`http://localhost:4002/accounts/${fromAccountId}`, {
        headers: {
          Authorization: authHeader,
        },
      });
      // If this succeeds, account exists & is owned by user/admin
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        if (status === 404) {
          return res.status(400).json({ message: "fromAccount does not exist" });
        }
        if (status === 403) {
          return res
            .status(403)
            .json({ message: "You are not the owner of fromAccount" });
        }
      }

      console.error("Error validating fromAccount with Account service:", err);
      return res.status(502).json({
        message: "Failed to validate fromAccount with Account service",
      });
    }

    // 2) Execute internal transfer in Account service
    try {
      await axios.post(
        "http://localhost:4002/accounts/internal-transfer",
        {
          fromAccountId,
          toAccountId,
          amount: numericAmount,
        },
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const msg = err.response.data?.message || "Transfer failed";

        if (status === 400) {
          return res.status(400).json({ message: msg });
        }
      }

      console.error("Error executing internal transfer:", err);
      return res.status(502).json({
        message: "Failed to execute transfer via Account service",
      });
    }

    // 3) Record transaction as EXECUTED
    const tx = await prisma.transaction.create({
      data: {
        fromAccountId,
        toAccountId,
        amount: numericAmount,
        status: TransactionStatus.EXECUTED,
        reference,
      },
    });

    return res.status(201).json({ transaction: tx });
  } catch (err) {
    console.error("Create transaction error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// GET /transactions/account/:accountId
// Returns all txns where this account is sender or receiver
router.get(
  "/transactions/account/:accountId",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({ message: "accountId is required" });
      }

      const txs = await prisma.transaction.findMany({
        where: {
          OR: [
            { fromAccountId: accountId },
            { toAccountId: accountId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ transactions: txs });
    } catch (err) {
      console.error("Get account transactions error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
