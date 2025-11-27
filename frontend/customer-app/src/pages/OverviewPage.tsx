import { useEffect, useState } from "react";
import type { Account, Transaction, Notification } from "../types";
import { useAuth } from "../auth";
import {
  getMyAccounts,
  getTransactionsForAccount,
  getMyNotifications,
} from "../api";

function OverviewPage() {
  const { token, user } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        setLoading(true);
        const [accRes, notifRes] = await Promise.all([
          getMyAccounts(token),
          getMyNotifications(token),
        ]);

        setAccounts(accRes.accounts);
        setNotifications(notifRes.notifications);

        if (accRes.accounts[0]) {
          const txRes = await getTransactionsForAccount(
            accRes.accounts[0].id,
            token
          );
          setTransactions(txRes.transactions);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const mainAccount = accounts[0] ?? null;
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const recentTransactions = transactions.slice(0, 5);
  const recentNotifications = notifications.slice(0, 4);
  const lastTx = recentTransactions[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Hero / greeting */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            Overview
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Welcome{user ? `, ${user.fullName}` : ""} <span>👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Here&apos;s a quick snapshot of your balances, recent activity and
            alerts in one place.
          </p>
        </div>

        {mainAccount && (
          <div className="mt-2 sm:mt-0 flex items-center gap-3 rounded-2xl bg-slate-900/60 border border-white/10 px-4 py-3 shadow-inner shadow-slate-900/60">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-400 to-sky-400 flex items-center justify-center text-xs font-semibold text-slate-950">
              {mainAccount.currency}
            </div>
            <div className="leading-tight">
              <p className="text-[11px] text-slate-400">Primary balance</p>
              <p className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-200 bg-clip-text text-transparent">
                {mainAccount.currency}{" "}
                {mainAccount.balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-[11px] text-slate-500">
                {accounts.length} account
                {accounts.length !== 1 ? "s" : ""} in total
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Stat cards row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 py-3 shadow-inner shadow-slate-900/70">
          <p className="text-[11px] text-slate-400 mb-1">Total balance</p>
          <p className="text-lg font-semibold text-slate-50">
            {mainAccount ? mainAccount.currency : "LKR"}{" "}
            {totalBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Across all active accounts
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 py-3 shadow-inner shadow-slate-900/70">
          <p className="text-[11px] text-slate-400 mb-1">Accounts</p>
          <p className="text-lg font-semibold text-slate-50">
            {accounts.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Savings, current and deposits
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 py-3 shadow-inner shadow-slate-900/70">
          <p className="text-[11px] text-slate-400 mb-1">Last transaction</p>
          {lastTx ? (
            <>
              <p className="text-sm font-medium text-slate-50 truncate">
                {lastTx.reference || "No reference"}
              </p>
              <p className="text-[11px] text-slate-500">
                {new Date(lastTx.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-slate-500">
              No transactions recorded yet.
            </p>
          )}
        </div>
      </section>

      {/* Main 2-column content (responsive) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: transactions (span 2) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Recent transactions
              </h2>
              <p className="text-[11px] text-slate-500">
                Latest activity on your primary account
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400">Loading...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-xs text-slate-400">
              No transactions yet. Once you start sending or receiving money,
              they will show up here.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                // Simple styling: positive = incoming, negative = outgoing (if you use negatives)
                const isCredit = tx.amount >= 0;
                const amountColor = isCredit
                  ? "text-emerald-400"
                  : "text-rose-400";

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/80 px-3 py-2.5 text-xs sm:text-[13px]"
                  >
                    <div className="min-w-0">
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
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className={`font-semibold ${amountColor}`}>
                        {isCredit ? "+" : "-"}
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

        {/* Right: notifications */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Notifications
              </h2>
              <p className="text-[11px] text-slate-500">
                Fraud alerts, system messages & more
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400">Loading...</div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-xs text-slate-400">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-2 text-xs overflow-y-auto max-h-64 pr-1">
              {recentNotifications.map((n) => {
                const typeAccent =
                  n.type === "FRAUD_ALERT"
                    ? "border-amber-400/50 bg-amber-500/5"
                    : n.type === "TRANSACTION"
                    ? "border-emerald-400/50 bg-emerald-500/5"
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
                        ? "Transaction update"
                        : "System message"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default OverviewPage;
