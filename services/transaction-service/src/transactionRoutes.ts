import { Router } from "express";
import prisma, { TransactionStatus } from "./prisma";
import { AuthedRequest, authMiddleware, requireRole } from "./authMiddleware";
import axios from "axios";

const router = Router();

// ----------------------------------------------
// Fraud service types + helper
// ----------------------------------------------

type FraudDecision = "ALLOW" | "FLAG" | "BLOCK";

interface FraudCheckResult {
  decision: FraudDecision;
  score: number;
  reasons: string[];
}

async function callFraudService(params: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
  isNewRecipient?: boolean;
}): Promise<FraudCheckResult> {
  const { fromAccountId, toAccountId, amount, currency, isNewRecipient } = params;

  const payload = {
    fromAccountId,
    toAccountId,
    amount,
    currency: currency || "LKR",
    timestamp: new Date().toISOString(), // current timestamp
    isNewRecipient: isNewRecipient ?? false,
  };

  const response = await axios.post("http://localhost:4004/fraud/check", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data as FraudCheckResult;
}

// ----------------------------------------------
// Notification service helper
// ----------------------------------------------

async function sendNotification(payload: {
  userId: string;
  type: "TRANSACTION" | "FRAUD_ALERT" | "SYSTEM";
  title: string;
  message: string;
}) {
  try {
    await axios.post("http://localhost:4005/notifications", payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}

// ----------------------------------------------
// POST /transactions
// ----------------------------------------------

router.post("/transactions", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const {
      fromAccountId,
      toAccountId,
      amount,
      reference,
      currency,
      isNewRecipient,
    } = req.body;

    if (!fromAccountId || !toAccountId || amount == null) {
      return res.status(400).json({
        message: "fromAccountId, toAccountId and amount are required",
      });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({
        message: "fromAccountId and toAccountId must be different",
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "amount must be a positive number",
      });
    }

    const authHeader = req.headers["authorization"] || "";

    // ---------------------------------------------------------
    // 1) Validate that fromAccount exists & belongs to user
    // ---------------------------------------------------------
    try {
      await axios.get(`http://localhost:4002/accounts/${fromAccountId}`, {
        headers: { Authorization: authHeader },
      });
      // If this succeeds → Account exists and belongs to user/admin
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        if (status === 404) {
          return res.status(400).json({ message: "fromAccount does not exist" });
        }
        if (status === 403) {
          return res.status(403).json({
            message: "You are not the owner of fromAccount",
          });
        }
      }
      console.error("Error validating fromAccount with Account service:", err);
      return res.status(502).json({
        message: "Failed to validate fromAccount with Account service",
      });
    }

    // ---------------------------------------------------------
    // 2) FRAUD CHECK
    // ---------------------------------------------------------

    let fraud: FraudCheckResult;
    try {
      fraud = await callFraudService({
        fromAccountId,
        toAccountId,
        amount: numericAmount,
        currency,
        isNewRecipient,
      });
    } catch (err: any) {
      console.error("Error calling Fraud service:", err.message || err);
      return res.status(502).json({
        message: "Failed to evaluate fraud risk for this transaction",
      });
    }

    const { decision, score, reasons } = fraud;

    // ---------------------------------------------------------
    // 3) If BLOCK → deny request (no DB write, no transfer)
    // ---------------------------------------------------------
    if (decision === "BLOCK") {
      return res.status(403).json({
        message: "Transaction blocked due to high fraud risk",
        fraud: { decision, score, reasons },
      });
    }

    // ---------------------------------------------------------
    // 4) If FLAG → record transaction (FLAGGED), no transfer
    // ---------------------------------------------------------
    if (decision === "FLAG") {
      const flaggedTx = await prisma.transaction.create({
        data: {
          fromAccountId,
          toAccountId,
          amount: numericAmount,
          status: TransactionStatus.FLAGGED,
          reference: reference || "Flagged by fraud rules",
        },
      });

      // Send fraud alert notification to the user
      if (req.user?.userId) {
        void sendNotification({
          userId: req.user.userId,
          type: "FRAUD_ALERT",
          title: "Transaction flagged for review",
          message: `A transaction of LKR ${numericAmount.toFixed(
            2
          )} to account ${toAccountId} was flagged for manual review.`,
        });
      }

      return res.status(202).json({
        message: "Transaction flagged for manual review",
        fraud: { decision, score, reasons },
        transaction: flaggedTx,
      });
    }

    // ---------------------------------------------------------
    // 5) If ALLOW → execute internal transfer via Account service
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 6) Save EXECUTED transaction
    // ---------------------------------------------------------

    const tx = await prisma.transaction.create({
      data: {
        fromAccountId,
        toAccountId,
        amount: numericAmount,
        status: TransactionStatus.EXECUTED,
        reference,
      },
    });

    // Send transaction notification to the user
    if (req.user?.userId) {
      void sendNotification({
        userId: req.user.userId,
        type: "TRANSACTION",
        title: "Transfer successful",
        message: `You sent LKR ${numericAmount.toFixed(
          2
        )} to account ${toAccountId}.`,
      });
    }

    return res.status(201).json({
      transaction: tx,
      fraud: { decision, score, reasons },
    });
  } catch (err) {
    console.error("Transaction create error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------------------------------------
// GET: all tx for an account
// ----------------------------------------------

router.get(
  "/transactions/account/:accountId",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    try {
      const { accountId } = req.params;

      const txs = await prisma.transaction.findMany({
        where: {
          OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
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

// ----------------------------------------------
// ADMIN: list flagged transactions
// GET /admin/transactions/flagged
// ----------------------------------------------
router.get(
  "/admin/transactions/flagged",
  authMiddleware,
  requireRole(["ADMIN", "RISK_OFFICER"]),
  async (_req: AuthedRequest, res) => {
    try {
      const flagged = await prisma.transaction.findMany({
        where: { status: TransactionStatus.FLAGGED },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ transactions: flagged });
    } catch (err) {
      console.error("Get flagged transactions error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ----------------------------------------------
// ADMIN: approve flagged transaction
// POST /admin/transactions/:id/approve
// ----------------------------------------------
router.post(
  "/admin/transactions/:id/approve",
  authMiddleware,
  requireRole(["ADMIN", "RISK_OFFICER"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;

      const tx = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!tx) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (tx.status !== TransactionStatus.FLAGGED) {
        return res.status(400).json({
          message: "Only FLAGGED transactions can be approved",
        });
      }

      // Execute transfer now via Account service
      try {
        const authHeader = req.headers["authorization"] || "";
        await axios.post(
          "http://localhost:4002/accounts/internal-transfer",
          {
            fromAccountId: tx.fromAccountId,
            toAccountId: tx.toAccountId,
            amount: Number(tx.amount),
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

        console.error("Error executing internal transfer (admin approve):", err);
        return res.status(502).json({
          message:
            "Failed to execute transfer via Account service while approving",
        });
      }

      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          status: TransactionStatus.EXECUTED,
        },
      });

      return res.json({
        message: "Transaction approved and executed",
        transaction: updated,
      });
    } catch (err) {
      console.error("Approve flagged transaction error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ----------------------------------------------
// ADMIN: reject flagged transaction
// POST /admin/transactions/:id/reject
// ----------------------------------------------
router.post(
  "/admin/transactions/:id/reject",
  authMiddleware,
  requireRole(["ADMIN", "RISK_OFFICER"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;

      const tx = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!tx) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (tx.status !== TransactionStatus.FLAGGED) {
        return res.status(400).json({
          message: "Only FLAGGED transactions can be rejected",
        });
      }

      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          status: TransactionStatus.REJECTED,
        },
      });

      return res.json({
        message: "Transaction rejected",
        transaction: updated,
      });
    } catch (err) {
      console.error("Reject flagged transaction error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
