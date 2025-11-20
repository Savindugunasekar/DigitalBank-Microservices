export type Role = "CUSTOMER" | "ADMIN" | "RISK_OFFICER";

export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";


export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  kycStatus?: KycStatus;
}

export interface LoginResponse {
  token: string;
  user: User;
}

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
  date: string;
  flagged: number;
  executed: number;
  rejected: number;
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

export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";

export interface AdminAccount {
  id: string;
  userId: string;
  accountNumber: string;
  currency: string;
  balance: number;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}
