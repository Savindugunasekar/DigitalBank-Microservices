import { useEffect, useState } from "react";
import type { Account, Transaction, Notification } from "../types";
import { useAuth } from "../auth";
import {
  getMyAccounts,
  getTransactionsForAccount,
  getMyNotifications,
} from "../api";

type TxFilter = "ALL" | "INCOMING" | "OUTGOING" | "FLAGGED";

function getStatusClasses(status: Transaction["status"]) {
  switch (status) {
    case "EXECUTED":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/40";
    case "FLAGGED":
      return "bg-amber-500/10 text-amber-300 border-amber-400/40";
    case "BLOCKED":
      return "bg-rose-500/10 text-rose-300 border-rose-400/40";
    case "PENDING":
      return "bg-slate-500/10 text-slate-200 border-slate-400/40";
    default:
      return "bg-slate-500/10 text-slate-200 border-slate-400/40";
  }
}

function formatStatusLabel(status: Transaction["status"]) {
  switch (status) {
    case "EXECUTED":
      return "Executed";
    case "FLAGGED":
      return "Flagged";
    case "BLOCKED":
      return "Blocked";
    case "PENDING":
      return "Pending";
    default:
      return status;
  }
}

function ActivityPage() {
  const { token } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );

  const [filter, setFilter] = useState<TxFilter>("ALL");

  // Fetch accounts
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const data = await getMyAccounts(token);
        setAccounts(data.accounts);
        if (data.accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      }
    })();
  }, [token, selectedAccountId]);

  // Fetch transactions when account changes
  useEffect(() => {
    if (!token || !selectedAccountId) return;

    (async () => {
      try {
        setTxLoading(true);
        setTxError(null);
        const data = await getTransactionsForAccount(selectedAccountId, token);
        setTransactions(data.transactions);
      } catch (err: any) {
        console.error("Failed to fetch transactions", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch transactions.";
        setTxError(msg);
      } finally {
        setTxLoading(false);
      }
    })();
  }, [token, selectedAccountId]);

  // Fetch notifications
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        setNotificationsLoading(true);
        setNotificationsError(null);
        const data = await getMyNotifications(token);
        setNotifications(data.notifications);
      } catch (err: any) {
        console.error("Failed to fetch notifications", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch notifications.";
        setNotificationsError(msg);
      } finally {
        setNotificationsLoading(false);
      }
    })();
  }, [token]);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;

  const filteredTransactions = transactions.filter((tx) => {
    if (!selectedAccountId) return false;

    const isOutgoing = tx.fromAccountId === selectedAccountId;
    const isIncoming = tx.toAccountId === selectedAccountId;

    switch (filter) {
      case "INCOMING":
        return isIncoming && !isOutgoing;
      case "OUTGOING":
        return isOutgoing;
      case "FLAGGED":
        return tx.status === "FLAGGED";
      case "ALL":
      default:
        return true;
    }
  });

  const hasAnyTransactions = transactions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            Activity
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Full transaction history
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Browse all transactions, filter by direction or review flagged
            activity in one place.
          </p>
        </div>

        <div className="mt-1 sm:mt-0 rounded-2xl bg-slate-950/70 border border-white/10 px-4 py-3 text-right shadow-inner shadow-slate-900/60">
          <p className="text-[11px] text-slate-400 mb-1">Selected account</p>
          {selectedAccount ? (
            <>
              <p className="text-sm font-semibold text-slate-50 truncate">
                {selectedAccount.currency} {selectedAccount.accountNumber}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Balance{" "}
                <span className="font-semibold text-slate-100">
                  {selectedAccount.currency}{" "}
                  {selectedAccount.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400">
              No account selected yet.
            </p>
          )}
        </div>
      </section>

      {/* Main layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: filters + transactions */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          {/* Account selector + filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Account
              </label>
              <select
                value={selectedAccountId ?? ""}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.currency} {acc.accountNumber} •{" "}
                    {acc.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["ALL", "All"],
                  ["INCOMING", "Incoming"],
                  ["OUTGOING", "Outgoing"],
                  ["FLAGGED", "Flagged"],
                ] as [TxFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`px-3 py-1 rounded-full text-[11px] border transition ${
                    filter === value
                      ? "bg-blue-500 text-white border-blue-400 shadow-sm"
                      : "bg-slate-900 border-slate-600 text-slate-200 hover:border-blue-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions list */}
          {selectedAccountId == null && (
            <p className="text-xs text-slate-400">
              Select an account to view its transactions.
            </p>
          )}

          {selectedAccountId && txLoading && (
            <p className="text-xs text-slate-400">Loading transactions...</p>
          )}

          {selectedAccountId && txError && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-2">
              {txError}
            </div>
          )}

          {selectedAccountId &&
            !txLoading &&
            !txError &&
            !hasAnyTransactions && (
              <p className="text-xs text-slate-400">
                No transactions for this account yet.
              </p>
            )}

          {selectedAccountId &&
            !txLoading &&
            !txError &&
            hasAnyTransactions &&
            filteredTransactions.length === 0 && (
              <p className="text-xs text-slate-400">
                No transactions match this filter.
              </p>
            )}

          {selectedAccountId &&
            !txLoading &&
            !txError &&
            filteredTransactions.length > 0 && (
              <div className="mt-1 space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredTransactions.map((tx) => {
                  const isOutgoing = tx.fromAccountId === selectedAccountId;
                  const directionLabel = isOutgoing ? "Sent" : "Received";
                  const amountSign = isOutgoing ? "-" : "+";
                  const amountColor = isOutgoing
                    ? "text-rose-400"
                    : "text-emerald-400";

                  return (
                    <div
                      key={tx.id}
                      className="rounded-xl border border-white/5 bg-slate-950/80 px-3 py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 mb-0.5">
                          {directionLabel}
                        </p>
                        <p className="font-medium text-slate-50 truncate">
                          {tx.reference || "No reference"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${getStatusClasses(
                              tx.status
                            )}`}
                          >
                            {formatStatusLabel(tx.status)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={`font-semibold ${amountColor}`}>
                          {amountSign}
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          ID: {tx.id.slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Right: notifications & summary */}
        <div className="space-y-4">
          {/* Summary card */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-50 mb-2">
              Activity summary
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-200">
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">
                  Total transactions
                </p>
                <p className="text-sm font-semibold">
                  {transactions.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">
                  Flagged
                </p>
                <p className="text-sm font-semibold text-amber-300">
                  {transactions.filter((t) => t.status === "FLAGGED").length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">
                  Executed
                </p>
                <p className="text-sm font-semibold text-emerald-300">
                  {transactions.filter((t) => t.status === "EXECUTED").length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">
                  Blocked
                </p>
                <p className="text-sm font-semibold text-rose-300">
                  {transactions.filter((t) => t.status === "BLOCKED").length}
                </p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-50 mb-2">
              Notifications
            </h2>

            {notificationsLoading ? (
              <p className="text-xs text-slate-400">Loading...</p>
            ) : notificationsError ? (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-2">
                {notificationsError}
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-slate-400">
                No notifications yet.
              </p>
            ) : (
              <div className="space-y-2 text-xs max-h-64 overflow-y-auto pr-1">
                {notifications.map((n) => {
                  const typeAccent =
                    n.type === "FRAUD_ALERT"
                      ? "border-amber-400/60 bg-amber-500/5"
                      : n.type === "TRANSACTION"
                      ? "border-emerald-400/60 bg-emerald-500/5"
                      : "border-slate-500/40 bg-slate-500/5";

                  return (
                    <div
                      key={n.id}
                      className={`rounded-xl border px-3 py-2 ${typeAccent}`}
                    >
                      <div className="flex justify-between gap-2 mb-1">
                        <p className="font-medium text-slate-50 truncate">
                          {n.title}
                        </p>
                        <span className="text-[9px] text-slate-300 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-100 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {n.type === "FRAUD_ALERT"
                          ? "Fraud alert"
                          : n.type === "TRANSACTION"
                          ? "Transaction"
                          : "System"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ActivityPage;
