// frontend/admin-app/src/pages/AdminOverviewPage.tsx

import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Link } from "react-router-dom";

import type {
  Transaction,
  TransactionStatsDay,
  Notification,
} from "../types";
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

function AdminOverviewPage() {
  const { token } = useAuth();

  const [flagged, setFlagged] = useState<Transaction[]>([]);
  const [loadingFlagged, setLoadingFlagged] = useState(true);
  const [flaggedError, setFlaggedError] = useState<string | null>(null);
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
      setLoadingFlagged(true);
      setFlaggedError(null);
      const data = await getFlaggedTransactions(token);
      setFlagged(data.transactions);
    } catch (err: any) {
      console.error("Failed to load flagged transactions", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load flagged transactions.";
      setFlaggedError(msg);
    } finally {
      setLoadingFlagged(false);
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
      setFlaggedError(msg);
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
      setFlaggedError(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Quick risk stats for the top summary
  const totalFlagged = stats.reduce((sum, d) => sum + d.flagged, 0);
  const totalExecuted = stats.reduce((sum, d) => sum + d.executed, 0);
  const totalRejected = stats.reduce((sum, d) => sum + d.rejected, 0);

  return (
    <div className="space-y-6">
      {/* Hero / summary row */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/85 via-slate-900/85 to-slate-950/85 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            Admin overview
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Risk &amp; fraud control snapshot
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Monitor flagged flows, review high-risk payments and spot trends in
            approvals and rejections.
          </p>
        </div>


        <div className="flex flex-col items-end gap-2">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-950/70 border border-amber-400/40 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
              <p className="text-[10px] text-slate-400 mb-0.5">Flagged</p>
              <p className="text-lg font-semibold text-amber-300">
                {totalFlagged}
              </p>
              <p className="text-[10px] text-slate-500">Last {statsDays} days</p>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-emerald-400/40 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
              <p className="text-[10px] text-slate-400 mb-0.5">Approved</p>
              <p className="text-lg font-semibold text-emerald-300">
                {totalExecuted}
              </p>
              <p className="text-[10px] text-slate-500">Executed</p>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-rose-400/40 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
              <p className="text-[10px] text-slate-400 mb-0.5">Rejected</p>
              <p className="text-lg font-semibold text-rose-300">
                {totalRejected}
              </p>
              <p className="text-[10px] text-slate-500">Blocked as high risk</p>
            </div>
          </div>

          {/* KYC shortcut */}
          <Link
            to="/kyc"
            className="inline-flex items-center gap-1 rounded-full border border-blue-400/60 bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-100 hover:bg-blue-500/20 hover:border-blue-300 transition"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
            Review KYC applications
          </Link>
        </div>

      </section>

      {/* Main grid: left flagged + right notifications */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Flagged transactions */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Flagged transactions
              </h2>
              <p className="text-[11px] text-slate-500">
                Review and either approve or reject high-risk payments.
              </p>
            </div>
          </div>

          {flaggedError && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-3">
              {flaggedError}
            </div>
          )}

          {loadingFlagged && (
            <div className="text-xs text-slate-300">Loading flagged…</div>
          )}

          {!loadingFlagged && flagged.length === 0 && !flaggedError && (
            <div className="text-xs text-slate-300">
              No flagged transactions at the moment. 🎉
            </div>
          )}

          {!loadingFlagged && flagged.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-white/10 rounded-xl overflow-hidden">
                <thead className="bg-slate-950/90">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      Tx ID
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      From
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      To
                    </th>
                    <th className="px-3 py-2 text-right border-b border-white/10">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      Reference
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      Created
                    </th>
                    <th className="px-3 py-2 text-center border-b border-white/10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((tx) => (
                    <tr
                      key={tx.id}
                      className="odd:bg-slate-950/70 even:bg-slate-900/60"
                    >
                      <td className="px-3 py-2 border-b border-white/5">
                        <span className="font-mono text-[11px]">
                          {tx.id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5">
                        <span className="font-mono text-[11px] text-slate-200">
                          {tx.fromAccountId}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5">
                        <span className="font-mono text-[11px] text-slate-200">
                          {tx.toAccountId}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5 text-right">
                        <span className="font-semibold text-amber-300">
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5 max-w-[180px]">
                        <span className="text-slate-200">
                          {tx.reference || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5">
                        <span className="text-[11px] text-slate-300">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={actionLoadingId === tx.id}
                            onClick={() => void handleApprove(tx.id)}
                            className="px-2 py-1 rounded-md text-[11px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                          >
                            {actionLoadingId === tx.id
                              ? "Working…"
                              : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === tx.id}
                            onClick={() => void handleReject(tx.id)}
                            className="px-2 py-1 rounded-md text-[11px] bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
                          >
                            {actionLoadingId === tx.id ? "Working…" : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Notifications
              </h2>
              <p className="text-[11px] text-slate-500">
                Fraud alerts, system notices &amp; admin updates.
              </p>
            </div>
          </div>

          {notificationsLoading && (
            <div className="text-xs text-slate-300">Loading…</div>
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
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                {notifications.map((n) => {
                  const typeColor =
                    n.type === "FRAUD_ALERT"
                      ? "border-amber-400/60 bg-amber-500/5"
                      : n.type === "TRANSACTION"
                        ? "border-emerald-400/60 bg-emerald-500/5"
                        : "border-slate-500/50 bg-slate-500/5";

                  return (
                    <div
                      key={n.id}
                      className={`border rounded-xl px-3 py-2 ${typeColor}`}
                    >
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <span className="font-medium text-slate-50 truncate">
                          {n.title}
                        </span>
                        <span className="text-[9px] text-slate-300 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-100 line-clamp-2">
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
        </div>
      </section>

      {/* Risk analytics chart */}
      <section className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              Risk analytics
            </h2>
            <p className="text-[11px] text-slate-500">
              Daily counts of flagged, approved and rejected transactions.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Range:</span>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setStatsDays(d);
                  void loadStats(d);
                }}
                className={`px-2 py-0.5 rounded-full border ${statsDays === d
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
          <div className="text-xs text-slate-300">Loading analytics…</div>
        )}

        {!statsLoading && stats.length === 0 && !statsError && (
          <div className="text-xs text-slate-300">
            No analytics data for this period yet.
          </div>
        )}

        {!statsLoading && stats.length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mt-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
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
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminOverviewPage;
