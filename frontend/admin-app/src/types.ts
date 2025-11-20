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
