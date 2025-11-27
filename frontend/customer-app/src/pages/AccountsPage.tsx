import { useEffect, useState } from "react";
import type { Account } from "../types";
import { useAuth } from "../auth";
import { getMyAccounts, createAccount } from "../api";

type AccountType = "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT";

function AccountsPage() {
  const { token } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );

  const [newAccountType, setNewAccountType] = useState<AccountType>("SAVINGS");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Fetch accounts
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
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
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, selectedAccountId]);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;

  async function handleOpenAccount() {
    if (!token) {
      setCreateError("You must be logged in to open an account.");
      return;
    }

    try {
      setCreatingAccount(true);
      setCreateError(null);
      setCreateSuccess(null);

      const { account } = await createAccount(
        { currency: "LKR", type: newAccountType },
        token
      );

      setAccounts((prev) => [...prev, account]);
      setSelectedAccountId(account.id);
      setCreateSuccess("New account opened successfully.");
    } catch (err: any) {
      console.error("Create account failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to open a new account.";
      setCreateError(msg);
    } finally {
      setCreatingAccount(false);
    }
  }

  function statusBadgeClasses(status: Account["status"]) {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-400/40";
      case "FROZEN":
        return "bg-amber-500/10 text-amber-300 border-amber-400/40";
      case "CLOSED":
        return "bg-rose-500/10 text-rose-300 border-rose-400/40";
      default:
        return "bg-slate-500/10 text-slate-200 border-slate-400/40";
    }
  }

  function typeLabel(type?: Account["type"]) {
    switch (type) {
      case "SAVINGS":
        return "Savings";
      case "CURRENT":
        return "Current";
      case "FIXED_DEPOSIT":
        return "Fixed deposit";
      default:
        return type || "Account";
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            Accounts
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Your accounts at a glance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            View balances, account details and open new accounts in one place.
          </p>
        </div>

        <div className="mt-1 sm:mt-0 rounded-2xl bg-slate-950/70 border border-white/10 px-4 py-3 text-right shadow-inner shadow-slate-900/60">
          <p className="text-[11px] text-slate-400 mb-1">Total balance</p>
          <p className="text-lg font-semibold text-slate-50">
            {accounts[0]?.currency ?? "LKR"}{" "}
            {totalBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {accounts.length} account
            {accounts.length !== 1 ? "s" : ""} •{" "}
            {accounts.filter((a) => a.status === "ACTIVE").length} active
          </p>
        </div>
      </section>

      {/* Main layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Accounts list */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                All accounts
              </h2>
              <p className="text-[11px] text-slate-500">
                Select an account to see more details on the right.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400">Loading accounts...</div>
          ) : error ? (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2">
              {error}
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-xs text-slate-400">
              You don&apos;t have any accounts yet. Use the panel on the right
              to open your first account.
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc) => {
                const isSelected = acc.id === selectedAccountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 flex items-center justify-between gap-3 transition
                      ${
                        isSelected
                          ? "border-blue-400/70 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
                          : "border-white/5 bg-slate-950/80 hover:border-blue-400/40 hover:bg-slate-900"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-600 via-slate-400 to-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-900">
                        {acc.currency}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-50 truncate">
                          {typeLabel(acc.type)}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          Account #{acc.accountNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-slate-50">
                        {acc.currency}{" "}
                        {acc.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          statusBadgeClasses(acc.status),
                        ].join(" ")}
                      >
                        {acc.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Details + open account */}
        <div className="space-y-4">
          {/* Selected account details */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-50 mb-2">
              Account details
            </h2>
            {!selectedAccount ? (
              <p className="text-xs text-slate-400">
                Select an account from the list to view more details here.
              </p>
            ) : (
              <div className="space-y-3 text-xs text-slate-200">
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
                      Type
                    </p>
                    <p className="font-medium">
                      {typeLabel(selectedAccount.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Currency
                    </p>
                    <p className="font-medium">{selectedAccount.currency}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Status
                    </p>
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        statusBadgeClasses(selectedAccount.status),
                      ].join(" ")}
                    >
                      {selectedAccount.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Balance
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Created
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {new Date(selectedAccount.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Last updated
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {new Date(selectedAccount.updatedAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Open new account */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-50 mb-2">
              Open a new account
            </h2>
            <p className="text-[11px] text-slate-400 mb-3">
              Create an additional account to separate savings, salary, or
              day-to-day spending.
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

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Account type
                </label>
                <select
                  value={newAccountType}
                  onChange={(e) =>
                    setNewAccountType(e.target.value as AccountType)
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SAVINGS">Savings account</option>
                  <option value="CURRENT">Current account</option>
                  <option value="FIXED_DEPOSIT">Fixed deposit</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleOpenAccount}
                disabled={creatingAccount}
                className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-3 py-2 text-xs font-medium text-white transition"
              >
                {creatingAccount ? "Opening account..." : "Open new account"}
              </button>

              <p className="text-[10px] text-slate-500">
                By opening a new account, you agree to the bank&apos;s standard
                terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AccountsPage;
