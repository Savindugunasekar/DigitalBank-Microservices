import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import type { Transaction } from "../types";
import {
  getFlaggedTransactions,
  approveFlaggedTransaction,
  rejectFlaggedTransaction,
} from "../api";

function AdminDashboardPage() {
  const { user, token, logout } = useAuth();

  const [flagged, setFlagged] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

  useEffect(() => {
    void loadFlagged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleApprove(id: string) {
    if (!token) return;
    try {
      setActionLoadingId(id);
      await approveFlaggedTransaction(id, token);
      await loadFlagged();
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

        <section className="mb-4">
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
      </div>
    </div>
  );
}

export default AdminDashboardPage;
