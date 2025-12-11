import type { AccountType } from "./api";

export type Role = "CUSTOMER" | "ADMIN" | "RISK_OFFICER";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  hasSubmittedKyc: boolean;
  // plus any other fields prisma returns, but this is enough for now
}

export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  currency: string;
  balance: number;
  status: AccountStatus;
  type:AccountType;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "FLAGGED"
  | "EXECUTED"
  | "BLOCKED"
  | "REJECTED";

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  status: TransactionStatus;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "TRANSACTION" | "FRAUD_ALERT" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

// src/types.ts

export type RecurringInterval = "DAILY" | "WEEKLY" | "MONTHLY";
export type RecurringStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export interface RecurringPayment {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  interval: RecurringInterval;
  status: RecurringStatus;
  description: string | null;
  nextRunAt: string;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}
