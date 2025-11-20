// frontend/admin-app/src/pages/AdminDashboardPage.tsx

import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import type {
  Transaction,
  TransactionStatsDay,
  Notification,
  User,
  AdminAccount,
  Role,
  AccountStatus,
  KycStatus,
} from "../types";
import {
  getFlaggedTransactions,
  approveFlaggedTransaction,
  rejectFlaggedTransaction,
  getTransactionStats,
  getMyNotifications,
  getAdminUsers,
  getAdminAccounts,
  updateUserRole,
  updateAccountStatus,
  updateUserKycStatus,
  adminCreateUser,
} from "../api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type TabKey = "OVERVIEW" | "USERS" | "ACCOUNTS";

function AdminDashboardPage() {
  const { user, token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("OVERVIEW");

  const [flagged, setFlagged] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [stats, setStats] = useState<TransactionStatsDay[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsDays, setStatsDays] = useState(30);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );

  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountActionId, setAccountActionId] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<Role>("CUSTOMER");
  const [createKycStatus, setCreateKycStatus] = useState<KycStatus>("PENDING");
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  async function handleCreateUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setCreateUserError(null);

    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      setCreateUserError("Please fill in name, email and password.");
      return;
    }

    if (createPassword.length < 6) {
      setCreateUserError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setCreateUserLoading(true);
      const newUser = await adminCreateUser(
        {
          fullName: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
          kycStatus: createKycStatus,
        },
        token
      );

      // prepend to user list
      setAdminUsers((prev) => [newUser, ...prev]);

      // reset form
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("CUSTOMER");
      setCreateKycStatus("PENDING");
      setShowCreateUser(false);
    } catch (err: any) {
      console.error("Admin create user failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create user.";
      setCreateUserError(msg);
    } finally {
      setCreateUserLoading(false);
    }
  }

  async function loadFlagged() {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getFlaggedTransactions(token);
      setFlagged(data.transactions);
    } catch (err: any) {
      console.error("Failed to load flagged transactions", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load flagged transactions.";
      setError(msg);
    } finally {
      setLoading(false);
      setActionLoadingId(null);
    }
  }

  async function loadStats(days: number) {
    if (!token) return;
    try {
      setStatsLoading(true);
      setStatsError(null);
      const data = await getTransactionStats(token, days);
      setStats(data.stats);
    } catch (err: any) {
      console.error("Failed to load stats", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load analytics data.";
      setStatsError(msg);
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadNotifications() {
    if (!token) return;
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const data = await getMyNotifications(token);
      setNotifications(data.notifications);
    } catch (err: any) {
      console.error("Failed to load notifications", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load notifications.";
      setNotificationsError(msg);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function loadUsers() {
    if (!token) return;
    try {
      setUsersLoading(true);
      setUsersError(null);
      const data = await getAdminUsers(token);
      setAdminUsers(data.users);
    } catch (err: any) {
      console.error("Failed to load users", err);
      const msg =
        err?.response?.data?.message || err?.message || "Failed to load users.";
      setUsersError(msg);
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadAccounts() {
    if (!token) return;
    try {
      setAccountsLoading(true);
      setAccountsError(null);
      const data = await getAdminAccounts(token);
      setAdminAccounts(data.accounts);
    } catch (err: any) {
      console.error("Failed to load accounts", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load accounts.";
      setAccountsError(msg);
    } finally {
      setAccountsLoading(false);
      setAccountActionId(null);
    }
  }

  useEffect(() => {
    void loadFlagged();
    void loadStats(statsDays);
    void loadNotifications();
    void loadUsers();
    void loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleApprove(id: string) {
    if (!token) return;
    try {
      setActionLoadingId(id);
      await approveFlaggedTransaction(id, token);
      await loadFlagged();
      await loadStats(statsDays);
      await loadNotifications();
    } catch (err: any) {
      console.error("Approve failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to approve transaction.";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!token) return;
    try {
      setActionLoadingId(id);
      await rejectFlaggedTransaction(id, token);
      await loadFlagged();
      await loadStats(statsDays);
      await loadNotifications();
    } catch (err: any) {
      console.error("Reject failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reject transaction.";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleChangeUserRole(userId: string, role: Role) {
    if (!token) return;
    try {
      const updated = await updateUserRole(userId, role, token);
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err: any) {
      console.error("Update user role failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user role.";
      setUsersError(msg);
    }
  }

  async function handleChangeAccountStatus(
    accountId: string,
    status: AccountStatus
  ) {
    if (!token) return;
    try {
      setAccountActionId(accountId);
      const updated = await updateAccountStatus(accountId, status, token);
      setAdminAccounts((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
    } catch (err: any) {
      console.error("Update account status failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update account status.";
      setAccountsError(msg);
    } finally {
      setAccountActionId(null);
    }
  }

  async function handleChangeUserKyc(
    userId: string,
    status: KycStatus
  ): Promise<void> {
    if (!token) return;
    try {
      const updated = await updateUserKycStatus(userId, status, token);
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err: any) {
      console.error("Update user KYC failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user KYC status.";
      setUsersError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h1 className="text-xl font-semibold">
              Digital Bank – Admin / Risk Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Logged in as {user?.fullName} ({user?.role})
            </p>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-700 hover:bg-slate-600 border border-slate-500"
          >
            Logout
          </button>
        </header>

        {/* Tabs */}
        <nav className="flex gap-2 mb-4 text-xs">
          {[
            { key: "OVERVIEW", label: "Overview" },
            { key: "USERS", label: "Users" },
            { key: "ACCOUNTS", label: "Accounts" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-3 py-1.5 rounded-full border ${
                activeTab === tab.key
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-slate-900 border-slate-600 text-slate-200 hover:border-blue-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* OVERVIEW TAB */}
        {activeTab === "OVERVIEW" && (
          <>
            {/* Notifications */}
            <section className="mb-4 bg-slate-900 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-200">
                  Notifications
                </h2>
              </div>

              {notificationsLoading && (
                <div className="text-xs text-slate-300">
                  Loading notifications...
                </div>
              )}

              {notificationsError && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-2">
                  {notificationsError}
                </div>
              )}

              {!notificationsLoading &&
                !notificationsError &&
                notifications.length === 0 && (
                  <div className="text-xs text-slate-400">
                    No notifications for this admin yet.
                  </div>
                )}

              {!notificationsLoading &&
                !notificationsError &&
                notifications.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {notifications.map((n) => {
                      const typeColor =
                        n.type === "FRAUD_ALERT"
                          ? "border-amber-500/60 bg-amber-950/30"
                          : n.type === "TRANSACTION"
                          ? "border-emerald-500/60 bg-emerald-950/30"
                          : "border-slate-600 bg-slate-950/40";

                      return (
                        <div
                          key={n.id}
                          className={`border rounded-md px-3 py-2 text-xs text-slate-100 ${typeColor}`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold">{n.title}</span>
                            <span className="text-[10px] text-slate-300">
                              {new Date(n.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-200">
                            {n.message}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400">
                            {n.type === "FRAUD_ALERT"
                              ? "Fraud alert"
                              : n.type === "TRANSACTION"
                              ? "Transaction"
                              : "System"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </section>

            {/* Flagged transactions */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-slate-200 mb-2">
                Flagged transactions
              </h2>

              {error && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-3">
                  {error}
                </div>
              )}

              {loading && (
                <div className="text-sm text-slate-300">Loading...</div>
              )}

              {!loading && flagged.length === 0 && !error && (
                <div className="text-sm text-slate-300">
                  No flagged transactions at the moment. 🎉
                </div>
              )}

              {!loading && flagged.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-slate-700 rounded-lg overflow-hidden">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left border-b border-slate-700">
                          Tx ID
                        </th>
                        <th className="px-3 py-2 text-left border-b border-slate-700">
                          From
                        </th>
                        <th className="px-3 py-2 text-left border-b border-slate-700">
                          To
                        </th>
                        <th className="px-3 py-2 text-right border-b border-slate-700">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left border-b border-slate-700">
                          Reference
                        </th>
                        <th className="px-3 py-2 text-left border-b border-slate-700">
                          Created
                        </th>
                        <th className="px-3 py-2 text-center border-b border-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {flagged.map((tx) => (
                        <tr
                          key={tx.id}
                          className="odd:bg-slate-900/40 even:bg-slate-900/10"
                        >
                          <td className="px-3 py-2 border-b border-slate-800">
                            <span className="font-mono">
                              {tx.id.slice(0, 8)}...
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            <span className="font-mono text-slate-200">
                              {tx.fromAccountId}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            <span className="font-mono text-slate-200">
                              {tx.toAccountId}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800 text-right">
                            <span className="font-semibold text-amber-300">
                              {tx.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800 max-w-[180px]">
                            <span className="text-slate-200">
                              {tx.reference || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            <span className="text-[11px] text-slate-300">
                              {new Date(tx.createdAt).toLocaleString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                disabled={actionLoadingId === tx.id}
                                onClick={() => void handleApprove(tx.id)}
                                className="px-2 py-1 rounded-md text-[11px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                              >
                                {actionLoadingId === tx.id
                                  ? "Working..."
                                  : "Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={actionLoadingId === tx.id}
                                onClick={() => void handleReject(tx.id)}
                                className="px-2 py-1 rounded-md text-[11px] bg-red-600 hover:bg-red-500 disabled:opacity-60"
                              >
                                {actionLoadingId === tx.id
                                  ? "Working..."
                                  : "Reject"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Risk analytics */}
            <section className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-200">
                  Risk analytics
                </h2>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Range:</span>
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setStatsDays(d);
                        void loadStats(d);
                      }}
                      className={`px-2 py-0.5 rounded-full border ${
                        statsDays === d
                          ? "bg-blue-600 border-blue-400 text-white"
                          : "bg-slate-900 border-slate-600 text-slate-200 hover:border-blue-400"
                      }`}
                    >
                      Last {d} days
                    </button>
                  ))}
                </div>
              </div>

              {statsError && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-3">
                  {statsError}
                </div>
              )}

              {statsLoading && (
                <div className="text-sm text-slate-300">
                  Loading analytics...
                </div>
              )}

              {!statsLoading && stats.length === 0 && !statsError && (
                <div className="text-sm text-slate-300">
                  No data for this period yet.
                </div>
              )}

              {!statsLoading && stats.length > 0 && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 mt-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#cbd5f5" }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: "#cbd5f5" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#020617",
                            borderColor: "#1e293b",
                            fontSize: 11,
                          }}
                          labelStyle={{ color: "#e5e7eb" }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="flagged"
                          name="Flagged"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="executed"
                          name="Approved (Executed)"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="rejected"
                          name="Rejected"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Daily counts of flagged, approved (executed) and rejected
                    transactions over the selected period.
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === "USERS" && (
          <section className="mt-2">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">Users</h2>
            <button
              type="button"
              onClick={() => setShowCreateUser((v) => !v)}
              className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 border border-blue-400"
            >
              {showCreateUser ? "Cancel" : "Create user"}
            </button>
            {/* Create user panel */}
            {showCreateUser && (
              <form
                onSubmit={handleCreateUserSubmit}
                className="mb-4 border border-slate-700 rounded-lg p-3 bg-slate-900/60 space-y-3"
              >
                <h3 className="text-xs font-semibold text-slate-200 mb-1">
                  New user details
                </h3>

                {createUserError && (
                  <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2">
                    {createUserError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-300">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="jane@example.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-300">
                      Password
                    </label>
                    <input
                      type="password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-300">
                      Role
                    </label>
                    <select
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as Role)}
                      className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="RISK_OFFICER">RISK_OFFICER</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-300">
                      KYC status
                    </label>
                    <select
                      value={createKycStatus}
                      onChange={(e) =>
                        setCreateKycStatus(e.target.value as KycStatus)
                      }
                      className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="px-3 py-1.5 rounded-md text-xs bg-slate-700 hover:bg-slate-600 border border-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserLoading}
                    className="px-3 py-1.5 rounded-md text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {createUserLoading ? "Creating..." : "Create user"}
                  </button>
                </div>
              </form>
            )}

            {usersError && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-3">
                {usersError}
              </div>
            )}

            {usersLoading && (
              <div className="text-sm text-slate-300">Loading users...</div>
            )}

            {!usersLoading && adminUsers.length === 0 && !usersError && (
              <div className="text-sm text-slate-300">
                No users found in the system.
              </div>
            )}

            {!usersLoading && adminUsers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border border-slate-700 rounded-lg overflow-hidden">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        User ID
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        KYC
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => {
                      const kyc = (u.kycStatus as KycStatus) || "PENDING";

                      const kycClass =
                        kyc === "VERIFIED"
                          ? "bg-emerald-900/40 text-emerald-300 border-emerald-600"
                          : kyc === "REJECTED"
                          ? "bg-red-900/40 text-red-300 border-red-600"
                          : "bg-amber-900/40 text-amber-300 border-amber-600";

                      return (
                        <tr
                          key={u.id}
                          className="odd:bg-slate-900/40 even:bg-slate-900/10"
                        >
                          <td className="px-3 py-2 border-b border-slate-800">
                            <span className="font-mono text-[11px]">
                              {u.id.slice(0, 8)}...
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            {u.fullName}
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            {u.email}
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                void handleChangeUserRole(
                                  u.id,
                                  e.target.value as Role
                                )
                              }
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs"
                            >
                              <option value="CUSTOMER">CUSTOMER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="RISK_OFFICER">RISK_OFFICER</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] uppercase ${kycClass}`}
                              >
                                {kyc}
                              </span>
                              {kyc === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-600 hover:bg-emerald-500"
                                    onClick={() =>
                                      void handleChangeUserKyc(u.id, "VERIFIED")
                                    }
                                  >
                                    Verify
                                  </button>
                                  <button
                                    type="button"
                                    className="px-2 py-0.5 rounded-md text-[10px] bg-red-600 hover:bg-red-500"
                                    onClick={() =>
                                      void handleChangeUserKyc(u.id, "REJECTED")
                                    }
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            <span className="text-[11px] text-slate-300">
                              {(u as any).createdAt
                                ? new Date(
                                    (u as any).createdAt
                                  ).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ACCOUNTS TAB */}
        {activeTab === "ACCOUNTS" && (
          <section className="mt-2">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">
              Accounts
            </h2>

            {accountsError && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-3">
                {accountsError}
              </div>
            )}

            {accountsLoading && (
              <div className="text-sm text-slate-300">Loading accounts...</div>
            )}

            {!accountsLoading &&
              adminAccounts.length === 0 &&
              !accountsError && (
                <div className="text-sm text-slate-300">
                  No accounts found in the system.
                </div>
              )}

            {!accountsLoading && adminAccounts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border border-slate-700 rounded-lg overflow-hidden">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        Account #
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        Owner
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        Currency
                      </th>
                      <th className="px-3 py-2 text-right border-b border-slate-700">
                        Balance
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-700">
                        Status
                      </th>
                      <th className="px-3 py-2 text-center border-b border-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminAccounts.map((a) => (
                      <tr
                        key={a.id}
                        className="odd:bg-slate-900/40 even:bg-slate-900/10"
                      >
                        <td className="px-3 py-2 border-b border-slate-800">
                          <span className="font-mono">{a.accountNumber}</span>
                        </td>
                        <td className="px-3 py-2 border-b border-slate-800">
                          <span className="font-mono text-[11px]">
                            {a.userId.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-3 py-2 border-b border-slate-800">
                          {a.currency}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-800 text-right">
                          {a.balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-800">
                          <span
                            className={
                              a.status === "ACTIVE"
                                ? "text-green-400"
                                : a.status === "FROZEN"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-b border-slate-800 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={accountActionId === a.id}
                              onClick={() =>
                                void handleChangeAccountStatus(a.id, "ACTIVE")
                              }
                              className="px-2 py-1 rounded-md text-[11px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                            >
                              Activate
                            </button>
                            <button
                              type="button"
                              disabled={accountActionId === a.id}
                              onClick={() =>
                                void handleChangeAccountStatus(a.id, "FROZEN")
                              }
                              className="px-2 py-1 rounded-md text-[11px] bg-amber-600 hover:bg-amber-500 disabled:opacity-60"
                            >
                              Freeze
                            </button>
                            <button
                              type="button"
                              disabled={accountActionId === a.id}
                              onClick={() =>
                                void handleChangeAccountStatus(a.id, "CLOSED")
                              }
                              className="px-2 py-1 rounded-md text-[11px] bg-red-600 hover:bg-red-500 disabled:opacity-60"
                            >
                              Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
