export type Role = "CUSTOMER" | "ADMIN" | "RISK_OFFICER";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Match your transaction-service enum
export type TransactionStatus =
  | "PENDING"
  | "EXECUTED"
  | "FLAGGED"
  | "REJECTED"
  | "BLOCKED";

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

export interface TransactionStatsDay {
  date: string; // YYYY-MM-DD
  flagged: number;
  executed: number;
  rejected: number;
}

// ✅ New: Notification type (same idea as customer app)
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