import axios from "axios";
import type { User, Account, Transaction } from "./types";

const AUTH_BASE_URL = "http://localhost:4001";
const ACCOUNT_BASE_URL = "http://localhost:4002";
const TRANSACTION_BASE_URL = "http://localhost:4003";

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateTransactionPayload {
  fromAccountId: string;
  toAccountId: string;      // recipient account ID
  amount: number;
  reference?: string;
  currency?: string;
  isNewRecipient?: boolean;
}

export interface FraudCheckResult {
  decision: "ALLOW" | "FLAG" | "FLAGGED" | "BLOCK";
  score: number;
  reasons: string[];
}

export interface CreateTransactionResponse {
  transaction: Transaction;
  fraud: FraudCheckResult;
}


export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await axios.post(`${AUTH_BASE_URL}/auth/login`, {
    email,
    password,
  });

  return res.data as LoginResponse;
}

export interface MyAccountsResponse {
  accounts: Account[];
}

export async function getMyAccounts(token: string): Promise<MyAccountsResponse> {
  const res = await axios.get(`${ACCOUNT_BASE_URL}/accounts/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data as MyAccountsResponse;
}

export interface AccountTransactionsResponse {
  transactions: Transaction[];
}

export async function getTransactionsForAccount(
  accountId: string,
  token: string
): Promise<AccountTransactionsResponse> {
  const res = await axios.get(
    `${TRANSACTION_BASE_URL}/transactions/account/${accountId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data as AccountTransactionsResponse;
}


export async function createTransaction(
  payload: CreateTransactionPayload,
  token: string
): Promise<CreateTransactionResponse> {
  const res = await axios.post(
    `${TRANSACTION_BASE_URL}/transactions`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data as CreateTransactionResponse;
}
