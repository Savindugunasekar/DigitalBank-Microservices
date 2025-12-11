import { Router } from "express";
import prisma, { TransactionStatus } from "./prisma";
import { authMiddleware, AuthedRequest } from "./authMiddleware";
import type { Prisma } from "@prisma/client";
import axios from "axios";
import {
  ACCOUNT_SERVICE_URL,
  FRAUD_SERVICE_URL,
  NOTIFICATION_SERVICE_URL,
} from "./config";

const router = Router();

/**
 * Helper: add interval to a date
 */
function addInterval(
  from: Date,
  interval: "DAILY" | "WEEKLY" | "MONTHLY"
): Date {
  const d = new Date(from);
  switch (interval) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d;
}

// ----------------------------------------------
// Fraud service types + helper (same pattern as /transactions)
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
  const { fromAccountId, toAccountId, amount, currency, isNewRecipient } =
    params;

  const payload = {
    fromAccountId,
    toAccountId,
    amount,
    currency: currency || "LKR",
    timestamp: new Date().toISOString(),
    isNewRecipient: isNewRecipient ?? false,
  };

  const response = await axios.post(
    `${FRAUD_SERVICE_URL}/fraud/check`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data as FraudCheckResult;
}

// ----------------------------------------------
// Notification service helper (same pattern as /transactions)
// ----------------------------------------------

async function sendNotification(payload: {
  userId: string;
  type: "TRANSACTION" | "FRAUD_ALERT" | "SYSTEM";
  title: string;
  message: string;
}) {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Recurring] Failed to send notification:", err);
  }
}

/**
 * POST /recurring-payments
 * Create a new recurring payment for the authenticated user
 *
 * body: {
 *   fromAccountId: string;
 *   toAccountId: string;
 *   amount: number;
 *   currency?: string;        // default "LKR"
 *   interval: "DAILY" | "WEEKLY" | "MONTHLY";
 *   firstRunAt?: string;      // ISO date string (optional)
 *   description?: string;
 * }
 */
router.post(
  "/recurring-payments",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const {
        fromAccountId,
        toAccountId,
        amount,
        currency,
        interval,
        firstRunAt,
        description,
      } = req.body as {
        fromAccountId?: string;
        toAccountId?: string;
        amount?: number;
        currency?: string;
        interval?: "DAILY" | "WEEKLY" | "MONTHLY";
        firstRunAt?: string;
        description?: string;
      };

      // Basic validation
      if (!fromAccountId || !toAccountId || !amount || !interval) {
        return res.status(400).json({
          message:
            "fromAccountId, toAccountId, amount and interval are required.",
        });
      }

      if (amount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be greater than zero." });
      }

      if (!["DAILY", "WEEKLY", "MONTHLY"].includes(interval)) {
        return res.status(400).json({ message: "Invalid interval value." });
      }

      let nextRunAt: Date;
      if (firstRunAt) {
        const parsed = new Date(firstRunAt);
        if (Number.isNaN(parsed.getTime())) {
          return res.status(400).json({ message: "Invalid firstRunAt value." });
        }
        // If firstRunAt is in the past, schedule for next interval from now
        const now = new Date();
        nextRunAt = parsed < now ? addInterval(now, interval) : parsed;
      } else {
        // Default: schedule first run at one interval from now
        nextRunAt = addInterval(new Date(), interval);
      }

      const created = await prisma.recurringPayment.create({
        data: {
          userId,
          fromAccountId,
          toAccountId,
          amount,
          currency: currency || "LKR",
          interval,
          nextRunAt,
          description: description || null,
          status: "ACTIVE",
        },
      });

      return res.status(201).json({ recurringPayment: created });
    } catch (err) {
      console.error("Create recurring payment error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /recurring-payments/my
 * List all recurring payments for the current user
 */
router.get(
  "/recurring-payments/my",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const items = await prisma.recurringPayment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ recurringPayments: items });
    } catch (err) {
      console.error("List recurring payments error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /recurring-payments/:id
 * Update status (pause / cancel / resume) or description
 *
 * body: {
 *   status?: "ACTIVE" | "PAUSED" | "CANCELLED";
 *   description?: string;
 * }
 */
router.patch(
  "/recurring-payments/:id",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { status, description } = req.body as {
        status?: "ACTIVE" | "PAUSED" | "CANCELLED";
        description?: string;
      };

      if (!status && typeof description === "undefined") {
        return res.status(400).json({
          message: "At least one of status or description must be provided.",
        });
      }

      if (status && !["ACTIVE", "PAUSED", "CANCELLED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value." });
      }

      // Only allow modifying your own recurring payments
      const existing = await prisma.recurringPayment.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res
          .status(404)
          .json({ message: "Recurring payment not found." });
      }

      const updated = await prisma.recurringPayment.update({
        where: { id },
        data: {
          status: status ?? existing.status,
          description:
            typeof description === "undefined"
              ? existing.description
              : description,
        },
      });

      return res.json({ recurringPayment: updated });
    } catch (err) {
      console.error("Update recurring payment error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * Helper: perform the actual money movement for a recurring payment.
 *
 * This reuses the same fraud + notification + account-service pattern as /transactions,
 * but runs as a background job (no user HTTP request).
 *
 * NOTE:
 * - For the Account service call we do NOT have a user JWT here.
 *   If your Account service strictly requires Authorization,
 *   you may want to add a service-to-service mechanism (API key / internal token).
 */
async function executeRecurringPayment(rec: {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: Prisma.Decimal;
  currency: string;
  description: string | null;
}) {
  const numericAmount = Number(rec.amount);

  console.log(
    `[Recurring] Executing recurringPayment=${rec.id} from=${rec.fromAccountId} to=${rec.toAccountId} amount=${numericAmount} ${rec.currency}`
  );

  // 1) FRAUD CHECK
  let fraud: FraudCheckResult;
  try {
    fraud = await callFraudService({
      fromAccountId: rec.fromAccountId,
      toAccountId: rec.toAccountId,
      amount: numericAmount,
      currency: rec.currency,
      isNewRecipient: false,
    });
  } catch (err: any) {
    console.error("[Recurring] Error calling Fraud service:", err);
    // If fraud fails, be conservative and do NOT execute transfer
    await prisma.transaction.create({
      data: {
        fromAccountId: rec.fromAccountId,
        toAccountId: rec.toAccountId,
        amount: numericAmount,
        status: TransactionStatus.REJECTED,
        reference: `Recurring payment ${rec.id} rejected (fraud service error)`,
      },
    });

    await sendNotification({
      userId: rec.userId,
      type: "FRAUD_ALERT",
      title: "Recurring payment blocked",
      message:
        "A scheduled recurring payment was blocked due to a fraud check error.",
    });

    return;
  }

  const { decision, score, reasons } = fraud;

  // 2) BLOCK → reject and notify
  if (decision === "BLOCK") {
    await prisma.transaction.create({
      data: {
        fromAccountId: rec.fromAccountId,
        toAccountId: rec.toAccountId,
        amount: numericAmount,
        status: TransactionStatus.REJECTED,
        reference:
          rec.description ||
          `Recurring payment ${rec.id} blocked by fraud rules`,
      },
    });

    await sendNotification({
      userId: rec.userId,
      type: "FRAUD_ALERT",
      title: "Recurring payment blocked",
      message: `A recurring payment of LKR ${numericAmount.toFixed(
        2
      )} was blocked due to high fraud risk.`,
    });

    console.log(
      `[Recurring] BLOCK decision for ${
        rec.id
      }, score=${score}, reasons=${reasons.join(", ")}`
    );

    return;
  }

  // 3) FLAG → record as FLAGGED, notify, do NOT move money
  if (decision === "FLAG") {
    await prisma.transaction.create({
      data: {
        fromAccountId: rec.fromAccountId,
        toAccountId: rec.toAccountId,
        amount: numericAmount,
        status: TransactionStatus.FLAGGED,
        reference:
          rec.description ||
          `Recurring payment ${rec.id} flagged for manual review`,
      },
    });

    await sendNotification({
      userId: rec.userId,
      type: "FRAUD_ALERT",
      title: "Recurring payment flagged",
      message: `A recurring payment of LKR ${numericAmount.toFixed(
        2
      )} was flagged for review.`,
    });

    console.log(
      `[Recurring] FLAG decision for ${
        rec.id
      }, score=${score}, reasons=${reasons.join(", ")}`
    );

    return;
  }

  // 4) ALLOW → call Account service internal-transfer, then store EXECUTED tx
  try {
    // NOTE: no user Authorization header here.
    // If your Account service enforces JWT, you’ll need to add
    // a service-level auth mechanism there.
    await axios.post(
      `${ACCOUNT_SERVICE_URL}/accounts/internal-transfer`,
      {
        fromAccountId: rec.fromAccountId,
        toAccountId: rec.toAccountId,
        amount: numericAmount,
      },
      {
        headers: {
          "Content-Type": "application/json",
          // e.g. "x-internal-service-key": process.env.SERVICE_API_KEY || ""
          // if you later add service-to-service auth.
        },
      }
    );
  } catch (err: any) {
    console.error("[Recurring] Error executing internal transfer:", err);

    // Record failed attempt as REJECTED transaction
    await prisma.transaction.create({
      data: {
        fromAccountId: rec.fromAccountId,
        toAccountId: rec.toAccountId,
        amount: numericAmount,
        status: TransactionStatus.REJECTED,
        reference:
          rec.description ||
          `Recurring payment ${rec.id} failed (Account service error)`,
      },
    });

    await sendNotification({
      userId: rec.userId,
      type: "SYSTEM",
      title: "Recurring payment failed",
      message:
        "A scheduled recurring payment could not be executed due to a technical error.",
    });

    return;
  }

  // 5) Save EXECUTED transaction + notify user
  await prisma.transaction.create({
    data: {
      fromAccountId: rec.fromAccountId,
      toAccountId: rec.toAccountId,
      amount: numericAmount,
      status: TransactionStatus.EXECUTED,
      reference:
        rec.description || `Recurring payment ${rec.id} executed successfully`,
    },
  });

  await sendNotification({
    userId: rec.userId,
    type: "TRANSACTION",
    title: "Recurring payment executed",
    message: `A recurring payment of LKR ${numericAmount.toFixed(
      2
    )} was sent successfully.`,
  });

  console.log(
    `[Recurring] ALLOW decision for ${rec.id}, executed successfully (score=${score})`
  );
}

/**
 * Scheduler: periodically scans for due recurring payments and executes them.
 */
const POLL_INTERVAL_MS = 3_600_000; // 1 hour
let isSchedulerRunning = false;

async function processDueRecurringPayments() {
  if (isSchedulerRunning) {
    // avoid overlapping runs
    return;
  }
  isSchedulerRunning = true;

  try {
    const now = new Date();

    // 1) Find due recurring payments
    const due = await prisma.recurringPayment.findMany({
      where: {
        status: "ACTIVE",
        nextRunAt: {
          lte: now,
        },
      },
      orderBy: { nextRunAt: "asc" },
      take: 50, // safety cap; adjust as needed
    });

    if (due.length === 0) {
      return;
    }

    console.log(
      `[Recurring] Found ${
        due.length
      } due recurring payments at ${now.toISOString()}`
    );

    for (const rp of due) {
      try {
        // 2) Execute the actual transfer
        await executeRecurringPayment({
          id: rp.id,
          userId: rp.userId,
          fromAccountId: rp.fromAccountId,
          toAccountId: rp.toAccountId,
          amount: rp.amount,
          currency: rp.currency,
          description: rp.description,
        });

        // 3) Update schedule: lastRunAt + nextRunAt
        const nextRunAt = addInterval(rp.nextRunAt, rp.interval);

        await prisma.recurringPayment.update({
          where: { id: rp.id },
          data: {
            lastRunAt: rp.nextRunAt,
            nextRunAt,
          },
        });

        console.log(
          `[Recurring] Successfully processed ${
            rp.id
          }, nextRunAt=${nextRunAt.toISOString()}`
        );
      } catch (innerErr) {
        console.error(
          `[Recurring] Error processing recurringPayment=${rp.id}:`,
          innerErr
        );
        // Optional: add failure counters & auto-pause here later
      }
    }
  } catch (err) {
    console.error("[Recurring] Scheduler loop error:", err);
  } finally {
    isSchedulerRunning = false;
  }
}

/**
 * Exported function to start the scheduler from index.ts
 */
export function startRecurringPaymentsScheduler() {
  console.log(
    `[Recurring] Starting recurring payments scheduler (interval=${POLL_INTERVAL_MS}ms)`
  );
  setInterval(() => {
    void processDueRecurringPayments();
  }, POLL_INTERVAL_MS);
}

export default router;
