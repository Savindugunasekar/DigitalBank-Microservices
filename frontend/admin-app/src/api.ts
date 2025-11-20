import axios from "axios";
import type {
  LoginResponse,
  Transaction,
  TransactionStatsDay,
  Notification,
  User,
  AdminAccount,
  Role,
  AccountStatus,
  KycStatus
} from "./types";

export const AUTH_BASE_URL = "http://localhost:4001";
export const TRANSACTION_BASE_URL = "http://localhost:4003";
export const NOTIFICATION_BASE_URL = "http://localhost:4005";

// ---------- Auth ----------
export interface AdminCreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  role?: Role;
  kycStatus?: KycStatus;
}
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

// ---------- Admin users / accounts ----------

export interface GetAdminUsersResponse {
  users: User[];
}

export interface GetAdminAccountsResponse {
  accounts: AdminAccount[];
}

export async function getAdminUsers(
  token: string
): Promise<GetAdminUsersResponse> {
  const res = await axios.get<GetAdminUsersResponse>(
    `${AUTH_BASE_URL}/admin/users`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

export async function getAdminAccounts(
  token: string
): Promise<GetAdminAccountsResponse> {
  const res = await axios.get<GetAdminAccountsResponse>(
    `http://localhost:4002/admin/accounts`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

export async function updateUserRole(
  id: string,
  role: Role,
  token: string
): Promise<User> {
  const res = await axios.patch<{ user: User }>(
    `${AUTH_BASE_URL}/admin/users/${id}/role`,
    { role },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data.user;
}

export async function updateAccountStatus(
  id: string,
  status: AccountStatus,
  token: string
): Promise<AdminAccount> {
  const res = await axios.patch<{ account: AdminAccount }>(
    `http://localhost:4002/admin/accounts/${id}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data.account;
}

export async function updateUserKycStatus(
  id: string,
  status: KycStatus,
  token: string
): Promise<User> {
  let path: string;

  if (status === "VERIFIED") {
    path = `${AUTH_BASE_URL}/admin/kyc/${id}/verify`;
  } else if (status === "REJECTED") {
    path = `${AUTH_BASE_URL}/admin/kyc/${id}/reject`;
  } else {
    throw new Error("Only VERIFIED or REJECTED are allowed here");
  }

  const res = await axios.patch<{ user: User }>(
    path,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data.user;
}

export async function adminCreateUser(
  payload: AdminCreateUserPayload,
  token: string
): Promise<User> {
  const res = await axios.post<{ user: User }>(
    `${AUTH_BASE_URL}/admin/users`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.user;
}