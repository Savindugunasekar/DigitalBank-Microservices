import { Router } from "express";

const router = Router();

type FraudDecision = "ALLOW" | "FLAG" | "BLOCK";

interface FraudCheckRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
  timestamp?: string; // ISO string (optional)
  isNewRecipient?: boolean;
}

interface FraudCheckResponse {
  decision: FraudDecision;
  score: number;
  reasons: string[];
}

router.post("/fraud/check", (req, res) => {
  const {
    fromAccountId,
    toAccountId,
    amount,
    currency,
    timestamp,
    isNewRecipient,
  } = req.body as FraudCheckRequest;

  if (!fromAccountId || !toAccountId || amount == null) {
    return res.status(400).json({
      message: "fromAccountId, toAccountId and amount are required",
    });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      message: "amount must be a positive number",
    });
  }

  let score = 10;
  const reasons: string[] = [];

  // Rule 1: High amount
  if (numericAmount >= 100000) {
    score += 30;
    reasons.push("High amount over 100000");
  }
  if (numericAmount >= 500000) {
    score += 30;
    reasons.push("Very high amount over 500000");
  }

  // Parse timestamp (if provided) to apply time-of-day rules
  let hour: number | null = null;
  if (timestamp) {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      hour = date.getUTCHours(); // we can refine later for local time zones
    }
  }

  // Rule 2: Night-time transaction
  if (hour !== null && (hour < 6 || hour >= 23)) {
    score += 20;
    reasons.push("Night-time transaction");
  }

  // Rule 3: New recipient + large amount
  if (isNewRecipient && numericAmount >= 50000) {
    score += 20;
    reasons.push("Large transfer to new recipient");
  }

  // Clamp score between 0 and 100 just to be safe
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let decision: FraudDecision;
  if (score < 40) {
    decision = "ALLOW";
  } else if (score < 70) {
    decision = "FLAG";
  } else {
    decision = "BLOCK";
  }

  const response: FraudCheckResponse = {
    decision,
    score,
    reasons,
  };

  return res.json(response);
});

export default router;
