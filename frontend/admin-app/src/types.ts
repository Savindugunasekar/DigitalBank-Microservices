export type Role = "CUSTOMER" | "ADMIN" | "RISK_OFFICER";

export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type AccountType = "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT";


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
  ownerEmail:string;
  ownerFullName:string;
  ownerKycStatus: "PENDING" | "VERIFIED" | "REJECTED"; 
  type: AccountType;
  createdAt: string;
  updatedAt: string;

}


export type KycApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type KycApplication = {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  userKycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  nicNumber: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city: string;
  employmentStatus: string;
  employerName?: string | null;
  jobTitle?: string | null;
  monthlyIncome: string;
  sourceOfFunds: string;
  status: KycApplicationStatus;
  createdAt: string;
  updatedAt: string;
};