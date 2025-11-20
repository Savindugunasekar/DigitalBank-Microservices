import axios from "axios";
import type { LoginResponse, Transaction } from "./types";

export const AUTH_BASE_URL = "http://localhost:4001";
export const TRANSACTION_BASE_URL = "http://localhost:4003";

// ---------- Auth ----------

export async function login(email: string, password: string) {
  const res = await axios.post<LoginResponse>(`${AUTH_BASE_URL}/auth/login`, {
    email,
    password,
  });

  return res.data;
}

// ---------- Flagged transactions ----------

export interface GetFlaggedTransactionsResponse {
  transactions: Transaction[];
}

export async function getFlaggedTransactions(
  token: string
): Promise<GetFlaggedTransactionsResponse> {
  const res = await axios.get<GetFlaggedTransactionsResponse>(
    `${TRANSACTION_BASE_URL}/admin/transactions/flagged`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

export async function approveFlaggedTransaction(
  id: string,
  token: string
): Promise<void> {
  await axios.post(
    `${TRANSACTION_BASE_URL}/admin/transactions/${id}/approve`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function rejectFlaggedTransaction(
  id: string,
  token: string
): Promise<void> {
  await axios.post(
    `${TRANSACTION_BASE_URL}/admin/transactions/${id}/reject`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}
