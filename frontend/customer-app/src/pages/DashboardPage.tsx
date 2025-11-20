import { useEffect, useState, type FormEvent } from "react";
import type { Account, Transaction, Notification } from "../types";
import { useAuth } from "../auth";
import {
  getMyAccounts,
  getTransactionsForAccount,
  createTransaction,
  getMyNotifications,
  createAccount,
} from "../api";

// Helper to style transaction status chip
function getStatusClasses(status: Transaction["status"]) {
  switch (status) {
    case "EXECUTED":
      return "bg-emerald-900/60 text-emerald-300 border-emerald-500/60";
    case "FLAGGED":
      return "bg-amber-900/60 text-amber-300 border-amber-500/60";
    case "BLOCKED":
      return "bg-red-900/60 text-red-300 border-red-500/60";
    case "PENDING":
      return "bg-slate-800 text-slate-200 border-slate-500/60";
    default:
      return "bg-slate-900 text-slate-300 border-slate-600";
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

type TxFilter = "ALL" | "INCOMING" | "OUTGOING" | "FLAGGED";

function DashboardPage() {
  const { user, token } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // New transfer form state
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [creatingTx, setCreatingTx] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Transaction filter state
  const [txFilter, setTxFilter] = useState<TxFilter>("ALL");

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createAccountError, setCreateAccountError] = useState<string | null>(
    null
  );
  async function handleOpenAccount() {
    if (!token) {
      setCreateAccountError("You must be logged in to open an account.");
      return;
    }

    try {
      setCreatingAccount(true);
      setCreateAccountError(null);

      // For now, we create a default LKR account
      const { account } = await createAccount({ currency: "LKR" }, token);

      // Refresh account list
      setAccounts((prev) => [...prev, account]);
      setSelectedAccountId(account.id);
    } catch (err: any) {
      console.error("Create account failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to open a new account.";
      setCreateAccountError(msg);
    } finally {
      setCreatingAccount(false);
    }
  }

  async function handleCreateTransaction(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!token) {
      setCreateError("You are not authenticated.");
      return;
    }

    if (!selectedAccountId) {
      setCreateError("Please select a source account first.");
      return;
    }

    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setCreateError("Please enter a valid amount greater than 0.");
      return;
    }

    try {
      setCreatingTx(true);

      const response = await createTransaction(
        {
          fromAccountId: selectedAccountId,
          toAccountId,
          amount: amountNumber,
          reference: reference || undefined,
          currency: "LKR",
          isNewRecipient: false,
        },
        token!
      );

      const { fraud } = response;
      const topReason = fraud.reasons?.[0];

      if (fraud.decision === "ALLOW") {
        setCreateSuccess(
          `Transfer executed successfully. (Fraud score: ${fraud.score.toFixed(
            2
          )}${topReason ? `, reason: ${topReason}` : ""})`
        );
      } else if (fraud.decision === "FLAG" || fraud.decision === "FLAGGED") {
        setCreateSuccess(
          `Transfer created but flagged for review. (Fraud score: ${fraud.score.toFixed(
            2
          )}${topReason ? `, reason: ${topReason}` : ""})`
        );
      } else if (fraud.decision === "BLOCK") {
        setCreateError(
          `Transfer blocked by fraud checks: ${
            topReason || "High risk detected"
          } (Fraud score: ${fraud.score.toFixed(2)})`
        );
        return;
      }

      // Clear form
      setToAccountId("");
      setAmount("");
      setReference("");

      // Refresh accounts and transactions
      try {
        // 1) Refresh accounts to update balances
        setAccountsLoading(true);
        const accountsData = await getMyAccounts(token!);
        setAccounts(accountsData.accounts);

        if (
          selectedAccountId &&
          !accountsData.accounts.find((a) => a.id === selectedAccountId)
        ) {
          setSelectedAccountId(
            accountsData.accounts.length > 0
              ? accountsData.accounts[0].id
              : null
          );
        }

        // 2) Refresh transactions for the selected account
        if (selectedAccountId) {
          setTxLoading(true);
          const { transactions } = await getTransactionsForAccount(
            selectedAccountId,
            token!
          );
          setTransactions(transactions);
        }

        // 3) Refresh notifications
        setNotificationsLoading(true);
        const { notifications } = await getMyNotifications(token!);
        setNotifications(notifications);
      } finally {
        setAccountsLoading(false);
        setTxLoading(false);
        setNotificationsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create transaction.";
      setCreateError(msg);
    } finally {
      setCreatingTx(false);
    }
  }

  // Fetch accounts on mount / when token changes
  useEffect(() => {
    if (!token) {
      setAccountsError("You are not logged in.");
      setAccountsLoading(false);
      return;
    }

    const fetchAccounts = async () => {
      try {
        setAccountsLoading(true);
        setAccountsError(null);
        const data = await getMyAccounts(token);
        setAccounts(data.accounts);

        if (data.accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch accounts", err);
        let msg = "Failed to fetch accounts.";
        if (err && typeof err === "object") {
          const maybeAny = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          if (maybeAny.response?.data?.message) {
            msg = maybeAny.response.data.message;
          } else if (typeof maybeAny.message === "string") {
            msg = maybeAny.message;
          }
        }
        setAccountsError(msg);
      } finally {
        setAccountsLoading(false);
      }
    };

    void fetchAccounts();
  }, [token, selectedAccountId]);

  // Fetch transactions when selectedAccountId changes
  useEffect(() => {
    if (!token || !selectedAccountId) return;

    const fetchTransactions = async () => {
      try {
        setTxLoading(true);
        setTxError(null);
        const data = await getTransactionsForAccount(selectedAccountId, token);
        setTransactions(data.transactions);
      } catch (err: unknown) {
        console.error("Failed to fetch transactions", err);
        let msg = "Failed to fetch transactions.";
        if (err && typeof err === "object") {
          const maybeAny = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          if (maybeAny.response?.data?.message) {
            msg = maybeAny.response.data.message;
          } else if (typeof maybeAny.message === "string") {
            msg = maybeAny.message;
          }
        }
        setTxError(msg);
      } finally {
        setTxLoading(false);
      }
    };

    void fetchTransactions();
  }, [token, selectedAccountId]);

  // Fetch notifications when token changes (or on first load)
  useEffect(() => {
    if (!token) {
      setNotificationsError("You are not logged in.");
      return;
    }

    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        setNotificationsError(null);
        const data = await getMyNotifications(token);
        setNotifications(data.notifications);
      } catch (err: unknown) {
        console.error("Failed to fetch notifications", err);
        let msg = "Failed to fetch notifications.";
        if (err && typeof err === "object") {
          const maybeAny = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          if (maybeAny.response?.data?.message) {
            msg = maybeAny.response.data.message;
          } else if (typeof maybeAny.message === "string") {
            msg = maybeAny.message;
          }
        }
        setNotificationsError(msg);
      } finally {
        setNotificationsLoading(false);
      }
    };

    void fetchNotifications();
  }, [token]);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;

  // Apply transaction filter
  const filteredTransactions = transactions.filter((tx) => {
    if (!selectedAccountId) return false;

    const isOutgoing = tx.fromAccountId === selectedAccountId;
    const isIncoming = tx.toAccountId === selectedAccountId;

    switch (txFilter) {
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
  const hasFilteredTransactions = filteredTransactions.length > 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1 text-slate-100">
            Welcome{user ? `, ${user.fullName}` : ""} 👋
          </h1>
          <p className="text-xs text-slate-400">
            Here you can see your accounts, recent transactions, and alerts.
          </p>
        </div>
      </header>

      {/* Accounts + Notifications in a responsive grid */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Accounts section */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">
            Your accounts
          </h2>

          {accountsLoading && (
            <div className="text-sm text-slate-300">Loading accounts...</div>
          )}

          {accountsError && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-2">
              {accountsError}
            </div>
          )}

          {!accountsLoading && !accountsError && accounts.length === 0 && (
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/70">
              <h3 className="text-sm font-semibold text-slate-100 mb-1">
                You don&apos;t have any accounts yet
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Open your first LKR current account to start receiving and
                sending money.
              </p>

              {createAccountError && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-3">
                  {createAccountError}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleOpenAccount()}
                disabled={creatingAccount}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-xs font-medium text-white"
              >
                {creatingAccount ? "Opening account..." : "Open LKR account"}
              </button>
            </div>
          )}

          {!accountsLoading && !accountsError && accounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap mb-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      account.id === selectedAccountId
                        ? "bg-blue-600 border-blue-400 text-white"
                        : "bg-slate-900 border-slate-600 text-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {account.currency} {account.accountNumber}
                  </button>
                ))}
              </div>

              {selectedAccount && (
                <div className="border border-slate-700 rounded-lg p-3 flex justify-between items-center bg-slate-900/60">
                  <div>
                    <div className="text-xs text-slate-400">
                      Account #{selectedAccount.accountNumber}
                    </div>
                    <div className="text-sm text-slate-200">
                      {selectedAccount.currency}{" "}
                      <span className="font-semibold">
                        {selectedAccount.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Status:{" "}
                      <span
                        className={
                          selectedAccount.status === "ACTIVE"
                            ? "text-green-400"
                            : selectedAccount.status === "FROZEN"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {selectedAccount.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    <div>
                      Created:{" "}
                      {new Date(selectedAccount.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </div>
                    <div>
                      Updated:{" "}
                      {new Date(selectedAccount.updatedAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications panel */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
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
                No notifications yet.
              </div>
            )}

          {!notificationsLoading &&
            !notificationsError &&
            notifications.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
        </div>
      </section>

      {/* New Transfer section */}
      <section className="mt-2 bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          New transfer
        </h2>

        {createError && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-2">
            {createError}
          </div>
        )}

        {createSuccess && (
          <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-700 rounded p-2 mb-2">
            {createSuccess}
          </div>
        )}

        <form onSubmit={handleCreateTransaction} className="space-y-3">
          {/* From account */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              From account
            </label>
            <select
              value={selectedAccountId ?? ""}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              required
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.currency} {acc.accountNumber} · Balance:{" "}
                  {acc.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* To account */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              To account ID
            </label>
            <input
              type="text"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              placeholder="Recipient account ID"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              placeholder="e.g. 1000.00"
              required
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reference (optional)"
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              placeholder="Reason for transfer"
            />
          </div>

          <button
            type="submit"
            disabled={creatingTx}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {creatingTx ? "Sending..." : "Send money"}
          </button>
        </form>
      </section>

      {/* Transactions section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-200">
            Recent transactions
          </h2>

          {/* Filter controls */}
          {selectedAccountId && hasAnyTransactions && (
            <div className="flex gap-2">
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
                  onClick={() => setTxFilter(value)}
                  className={`px-2 py-0.5 rounded-full text-[10px] border ${
                    txFilter === value
                      ? "bg-blue-600 border-blue-400 text-white"
                      : "bg-slate-900 border-slate-600 text-slate-200 hover:border-blue-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!selectedAccountId && (
          <div className="text-sm text-slate-300">
            Select an account to see its transactions.
          </div>
        )}

        {selectedAccountId && txLoading && (
          <div className="text-sm text-slate-300">Loading transactions...</div>
        )}

        {selectedAccountId && txError && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-2">
            {txError}
          </div>
        )}

        {selectedAccountId && !txLoading && !txError && !hasAnyTransactions && (
          <div className="text-sm text-slate-300">
            No transactions for this account yet.
          </div>
        )}

        {selectedAccountId &&
          !txLoading &&
          !txError &&
          hasAnyTransactions &&
          !hasFilteredTransactions && (
            <div className="text-sm text-slate-300">
              No transactions match this filter.
            </div>
          )}

        {selectedAccountId &&
          !txLoading &&
          !txError &&
          hasFilteredTransactions && (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => {
                const isOutgoing = tx.fromAccountId === selectedAccountId;
                const directionLabel = isOutgoing ? "Sent" : "Received";
                const amountSign = isOutgoing ? "-" : "+";
                const amountColor = isOutgoing
                  ? "text-red-400"
                  : "text-green-400";

                return (
                  <div
                    key={tx.id}
                    className="border border-slate-700 rounded-lg p-3 bg-slate-900/60 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-xs text-slate-400">
                        {directionLabel} {amountSign}
                      </div>
                      <div className={`text-sm font-semibold ${amountColor}`}>
                        {amountSign}
                        {tx.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {tx.reference || "No reference"}
                      </div>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${getStatusClasses(
                            tx.status
                          )}`}
                        >
                          {formatStatusLabel(tx.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                      <div>
                        {new Date(tx.createdAt).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] mt-1">
                        Tx ID: {tx.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </section>
    </div>
  );
}

export default DashboardPage;
