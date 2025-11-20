import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import type { Transaction, TransactionStatsDay, Notification } from "../types";
import {
  getFlaggedTransactions,
  approveFlaggedTransaction,
  rejectFlaggedTransaction,
  getTransactionStats,
  getMyNotifications,
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

function AdminDashboardPage() {
  const { user, token, logout } = useAuth();

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

  useEffect(() => {
    void loadFlagged();
    void loadStats(statsDays);
    void loadNotifications();
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
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

        {/* Notifications panel */}
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

        {/* Flagged transactions table */}
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
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
      </div>
    </div>
  );
}

export default AdminDashboardPage;
