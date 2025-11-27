import { useEffect, useState, type FormEvent } from "react";
import type { Account, Transaction } from "../types";
import { useAuth } from "../auth";
import {
  getMyAccounts,
  getTransactionsForAccount,
  createTransaction,
} from "../api";

type FraudDecision = "ALLOW" | "FLAG" | "FLAGGED" | "BLOCK" | string;

function PaymentsPage() {
  const { token } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );

  // Form state
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const [creatingTx, setCreatingTx] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Fraud explanation
  const [fraudDecision, setFraudDecision] = useState<FraudDecision | null>(
    null
  );
  const [fraudScore, setFraudScore] = useState<number | null>(null);
  const [fraudReason, setFraudReason] = useState<string | null>(null);

  // Recent transactions for selected account
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;

  // Fetch accounts on load
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        setAccountsLoading(true);
        setAccountsError(null);

        const data = await getMyAccounts(token);
        setAccounts(data.accounts);

        if (data.accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } catch (err: any) {
        console.error("Failed to fetch accounts", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch accounts.";
        setAccountsError(msg);
      } finally {
        setAccountsLoading(false);
      }
    })();
  }, [token, selectedAccountId]);

  // Fetch recent transactions whenever selected account changes
  useEffect(() => {
    if (!token || !selectedAccountId) return;

    (async () => {
      try {
        setTxLoading(true);
        const data = await getTransactionsForAccount(selectedAccountId, token);
        setRecentTx(data.transactions.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch recent transactions", err);
      } finally {
        setTxLoading(false);
      }
    })();
  }, [token, selectedAccountId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setCreateError(null);
    setCreateSuccess(null);
    setFraudDecision(null);
    setFraudScore(null);
    setFraudReason(null);

    if (!token) {
      setCreateError("You are not authenticated.");
      return;
    }

    if (!selectedAccountId) {
      setCreateError("Please select a source account.");
      return;
    }

    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setCreateError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!toAccountId.trim()) {
      setCreateError("Please enter a recipient account ID.");
      return;
    }

    try {
      setCreatingTx(true);

      const response = await createTransaction(
        {
          fromAccountId: selectedAccountId,
          toAccountId: toAccountId.trim(),
          amount: amountNumber,
          reference: reference || undefined,
          currency: "LKR",
          isNewRecipient: false,
        },
        token
      );

      const fraud = response.fraud;
      const topReason = fraud.reasons?.[0];

      setFraudDecision(fraud.decision);
      setFraudScore(fraud.score);
      setFraudReason(topReason || null);

      if (fraud.decision === "ALLOW") {
        setCreateSuccess(
          `Transfer executed successfully. Fraud score ${fraud.score.toFixed(
            2
          )}${topReason ? ` • ${topReason}` : ""}`
        );
      } else if (fraud.decision === "FLAG" || fraud.decision === "FLAGGED") {
        setCreateSuccess(
          `Transfer created but flagged for review. Fraud score ${fraud.score.toFixed(
            2
          )}${topReason ? ` • ${topReason}` : ""}`
        );
      } else if (fraud.decision === "BLOCK") {
        setCreateError(
          `Transfer blocked by fraud checks: ${
            topReason || "High risk detected"
          } (score ${fraud.score.toFixed(2)})`
        );
        return;
      } else {
        setCreateSuccess("Transfer created. (Fraud decision: unknown)");
      }

      // Clear form
      setToAccountId("");
      setAmount("");
      setReference("");

      // Refresh accounts + last few transactions
      try {
        const accData = await getMyAccounts(token);
        setAccounts(accData.accounts);

        if (selectedAccountId) {
          const txData = await getTransactionsForAccount(
            selectedAccountId,
            token
          );
          setRecentTx(txData.transactions.slice(0, 5));
        }
      } catch (err) {
        console.error("Refresh after payment failed", err);
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

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            Payments
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Send money securely
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Make transfers between your accounts or to other recipients with
            built-in fraud checks.
          </p>
        </div>

        <div className="mt-1 sm:mt-0 rounded-2xl bg-slate-950/70 border border-white/10 px-4 py-3 text-right shadow-inner shadow-slate-900/60">
          <p className="text-[11px] text-slate-400 mb-1">Available balance</p>

          {accountsLoading ? (
            <p className="text-xs text-slate-500">Loading accounts…</p>
          ) : accountsError ? (
            <p className="text-xs text-red-400 max-w-[220px] text-left">
              {accountsError}
            </p>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-50">
                {accounts[0]?.currency ?? "LKR"}{" "}
                {totalBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Across {accounts.length} account
                {accounts.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Main layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: payment form */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-50 mb-2">
            New transfer
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Choose a source account, enter a recipient and amount, then we’ll
            run real-time fraud checks before executing the payment.
          </p>

          {createError && (
            <div className="mb-2 text-[11px] text-red-400 bg-red-950/40 border border-red-700 rounded p-2">
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="mb-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-700 rounded p-2">
              {createSuccess}
            </div>
          )}

          {fraudDecision && (
            <div className="mb-3 text-[11px] rounded-lg border px-3 py-2 bg-slate-950/80 border-slate-600 text-slate-200">
              <div className="flex justify-between mb-1">
                <span>Fraud decision: {fraudDecision}</span>
                {fraudScore !== null && (
                  <span className="text-slate-300">
                    Score: {fraudScore.toFixed(2)}
                  </span>
                )}
              </div>
              {fraudReason && (
                <p className="text-[10px] text-slate-400">
                  Top reason: {fraudReason}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From account */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                From account
              </label>
              <select
                value={selectedAccountId ?? ""}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={accountsLoading || !!accountsError}
              >
                <option value="">Select source account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.currency} {acc.accountNumber} • Balance{" "}
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
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                To account ID
              </label>
              <input
                type="text"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Recipient account ID"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 1000.00"
                required
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Reference (optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Reason for transfer"
              />
            </div>

            <button
              type="submit"
              disabled={creatingTx || accountsLoading || !!accountsError}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2 text-xs font-medium text-white transition"
            >
              {creatingTx ? "Sending..." : "Send money"}
            </button>

            <p className="text-[10px] text-slate-500">
              Transfers are subject to fraud detection and may be blocked or
              flagged for manual review if unusual activity is detected.
            </p>
          </form>
        </div>

        {/* Right: selected account + recent payments */}
        <div className="space-y-4">
          {/* Selected account summary */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-50 mb-2">
              Payment source
            </h2>
            {!selectedAccount ? (
              <p className="text-xs text-slate-400">
                Select a source account on the left to see its details here.
              </p>
            ) : (
              <div className="space-y-2 text-xs text-slate-200">
                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">
                    Account number
                  </p>
                  <p className="font-medium text-slate-50">
                    {selectedAccount.accountNumber}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Currency
                    </p>
                    <p className="font-medium">{selectedAccount.currency}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Available balance
                    </p>
                    <p className="font-semibold">
                      {selectedAccount.currency}{" "}
                      {selectedAccount.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ensure you have sufficient balance before sending a payment.
                </p>
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-50 mb-2">
              Recent payments
            </h2>
            {txLoading ? (
              <p className="text-xs text-slate-400">Loading...</p>
            ) : recentTx.length === 0 ? (
              <p className="text-xs text-slate-400">
                No recent payments from this account.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {recentTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-xl border border-white/5 bg-slate-950/80 px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-50 truncate">
                        {tx.reference || "No reference"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-rose-400">
                        -
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
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PaymentsPage;
