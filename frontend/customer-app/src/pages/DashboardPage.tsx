import { useEffect, useState } from "react";
import type { Account, Transaction } from "../types";
import { useAuth } from "../auth";
import { getMyAccounts, getTransactionsForAccount } from "../api";

function DashboardPage() {
  const { user, token } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

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

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg space-y-6">
      <header>
        <h1 className="text-xl font-semibold mb-1 text-slate-100">
          Welcome{user ? `, ${user.fullName}` : ""} 👋
        </h1>
        <p className="text-xs text-slate-400">
          Here you can see your accounts and recent transactions.
        </p>
      </header>

      {/* Accounts section */}
      <section>
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
          <div className="text-sm text-slate-300">
            You don&apos;t have any accounts yet.
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
      </section>

      {/* Transactions section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Recent transactions
        </h2>

        {!selectedAccountId && (
          <div className="text-sm text-slate-300">
            Select an account to see its transactions.
          </div>
        )}

        {selectedAccountId && txLoading && (
          <div className="text-sm text-slate-300">
            Loading transactions...
          </div>
        )}

        {selectedAccountId && txError && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-2">
            {txError}
          </div>
        )}

        {selectedAccountId &&
          !txLoading &&
          !txError &&
          transactions.length === 0 && (
            <div className="text-sm text-slate-300">
              No transactions for this account yet.
            </div>
          )}

        {selectedAccountId &&
          !txLoading &&
          !txError &&
          transactions.length > 0 && (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isOutgoing = tx.fromAccountId === selectedAccountId;
                const directionLabel = isOutgoing ? "Sent" : "Received";
                const amountSign = isOutgoing ? "-" : "+";
                const amountColor = isOutgoing ? "text-red-400" : "text-green-400";

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
                      <div className="text-[10px] text-slate-500 mt-1">
                        Status: {tx.status}
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
