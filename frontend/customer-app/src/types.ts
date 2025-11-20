export type Role = "CUSTOMER" | "ADMIN" | "RISK_OFFICER";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
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
