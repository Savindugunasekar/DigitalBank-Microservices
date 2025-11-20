import axios from "axios";
import type {
  LoginResponse,
  Transaction,
  TransactionStatsDay,
  Notification,
} from "./types";

export const AUTH_BASE_URL = "http://localhost:4001";
export const TRANSACTION_BASE_URL = "http://localhost:4003";
export const NOTIFICATION_BASE_URL = "http://localhost:4005";

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

// ---------- Risk analytics stats ----------

export interface GetTransactionStatsResponse {
  stats: TransactionStatsDay[];
}

export async function getTransactionStats(
  token: string,
  days = 30
): Promise<GetTransactionStatsResponse> {
  const res = await axios.get<GetTransactionStatsResponse>(
    `${TRANSACTION_BASE_URL}/admin/transactions/stats`,
    {
      params: { days },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

// ---------- Notifications for current admin ----------

export interface GetMyNotificationsResponse {
  notifications: Notification[];
}

export async function getMyNotifications(
  token: string
): Promise<GetMyNotificationsResponse> {
  const res = await axios.get<GetMyNotificationsResponse>(
    `${NOTIFICATION_BASE_URL}/notifications/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}
