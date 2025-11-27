import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import type { AdminAccount, AccountStatus } from "../types";
import { getAdminAccounts, updateAccountStatus } from "../api";

function AdminAccountsPage() {
  const { token } = useAuth();

  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountActionId, setAccountActionId] = useState<string | null>(null);

  // Fetch accounts
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
    void loadAccounts();
  }, [token]);

  // Change status
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

  // Simple stats for header
  const totalAccounts = adminAccounts.length;
  const activeCount = adminAccounts.filter(
    (a) => a.status === "ACTIVE"
  ).length;
  const frozenCount = adminAccounts.filter(
    (a) => a.status === "FROZEN"
  ).length;
  const closedCount = adminAccounts.filter(
    (a) => a.status === "CLOSED"
  ).length;
  const totalBalance = adminAccounts.reduce(
    (sum, a) => sum + (a.balance || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Hero / summary */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/85 via-slate-900/85 to-slate-950/85 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            Accounts
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Customer accounts &amp; controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Monitor balances across the book and manage account states
            (ACTIVE, FROZEN, CLOSED) for risk and operations.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-slate-950/70 border border-white/10 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
            <p className="text-[10px] text-slate-400 mb-0.5">
              Total accounts
            </p>
            <p className="text-lg font-semibold text-slate-50">
              {totalAccounts}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Closed: {closedCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/70 border border-emerald-400/40 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
            <p className="text-[10px] text-slate-400 mb-0.5">Active</p>
            <p className="text-lg font-semibold text-emerald-300">
              {activeCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/70 border border-amber-400/40 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
            <p className="text-[10px] text-slate-400 mb-0.5">Frozen</p>
            <p className="text-lg font-semibold text-amber-300">
              {frozenCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/70 border border-rose-400/40 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
            <p className="text-[10px] text-slate-400 mb-0.5">
              Total balance
            </p>
            <p className="text-lg font-semibold text-rose-300">
              {totalBalance.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              All accounts
            </h2>
            <p className="text-[11px] text-slate-500">
              Freeze or close accounts directly from this view when needed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAccounts()}
            className="text-[11px] px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition"
          >
            Refresh
          </button>
        </div>

        {accountsError && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-3">
            {accountsError}
          </div>
        )}

        {accountsLoading && (
          <div className="text-xs text-slate-300">Loading accounts…</div>
        )}

        {!accountsLoading &&
          adminAccounts.length === 0 &&
          !accountsError && (
            <div className="text-xs text-slate-300">
              No accounts found in the system.
            </div>
          )}

        {!accountsLoading && adminAccounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-white/10 rounded-xl overflow-hidden">
              <thead className="bg-slate-950/90">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-white/10">
                    Account #
                  </th>
                  <th className="px-3 py-2 text-left border-b border-white/10">
                    Owner (user ID)
                  </th>
                  <th className="px-3 py-2 text-left border-b border-white/10">
                    Currency
                  </th>
                  <th className="px-3 py-2 text-right border-b border-white/10">
                    Balance
                  </th>
                  <th className="px-3 py-2 text-left border-b border-white/10">
                    Status
                  </th>
                  <th className="px-3 py-2 text-center border-b border-white/10">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {adminAccounts.map((a) => {
                  const statusColor =
                    a.status === "ACTIVE"
                      ? "text-emerald-300"
                      : a.status === "FROZEN"
                      ? "text-amber-300"
                      : "text-rose-300";

                  return (
                    <tr
                      key={a.id}
                      className="odd:bg-slate-950/70 even:bg-slate-900/60"
                    >
                      <td className="px-3 py-2 border-b border-white/5">
                        <span className="font-mono text-[11px]">
                          {a.accountNumber}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5">
                        <span className="font-mono text-[11px]">
                          {a.userId.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5">
                        {a.currency}
                      </td>
                      <td className="px-3 py-2 border-b border-white/5 text-right">
                        {a.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-2 border-b border-white/5">
                        <span className={statusColor}>{a.status}</span>
                      </td>
                      <td className="px-3 py-2 border-b border-white/5 text-center">
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
                            className="px-2 py-1 rounded-md text-[11px] bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminAccountsPage;
