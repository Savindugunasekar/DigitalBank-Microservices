import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import type { Account, RecurringPayment } from "../types";
import {
  getMyAccounts,
  getMyRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  type CreateRecurringPaymentPayload,
} from "../api";

function RecurringPaymentsPage() {
  const { token } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurring, setRecurring] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    interval: "DAILY" | "WEEKLY" | "MONTHLY";
    firstRunAt: string;
    description: string;
  }>({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    interval: "MONTHLY",
    firstRunAt: "",
    description: "",
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load accounts + recurring list
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [accRes, recRes] = await Promise.all([
          getMyAccounts(token),
          getMyRecurringPayments(token),
        ]);

        setAccounts(accRes.accounts);
        setRecurring(recRes.recurringPayments);

        // default fromAccountId to first account
        if (accRes.accounts[0] && !form.fromAccountId) {
          setForm((prev) => ({
            ...prev,
            fromAccountId: accRes.accounts[0].id,
          }));
        }
      } catch (err: any) {
        console.error("Failed to load recurring payments page data", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load data.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    const numericAmount = Number(form.amount);
    if (!form.fromAccountId || !form.toAccountId || numericAmount <= 0) {
      setCreateError("Please fill all fields with a valid amount.");
      setCreating(false);
      return;
    }

    try {
      const payload: CreateRecurringPaymentPayload = {
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: numericAmount,
        currency: "LKR",
        interval: form.interval,
        firstRunAt: form.firstRunAt
          ? new Date(form.firstRunAt).toISOString()
          : undefined,
        description: form.description || undefined,
      };

      const { recurringPayment } = await createRecurringPayment(payload, token);

      setRecurring((prev) => [recurringPayment, ...prev]);
      setCreateSuccess("Recurring payment created successfully.");

      setForm((prev) => ({
        ...prev,
        toAccountId: "",
        amount: "",
        description: "",
      }));
    } catch (err: any) {
      console.error("Create recurring payment failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create recurring payment.";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(
    id: string,
    status: "ACTIVE" | "PAUSED" | "CANCELLED"
  ) {
    if (!token) return;
    try {
      setUpdatingId(id);
      const { recurringPayment } = await updateRecurringPayment(
        id,
        { status },
        token
      );
      setRecurring((prev) =>
        prev.map((rp) => (rp.id === id ? recurringPayment : rp))
      );
    } catch (err: any) {
      console.error("Update recurring payment failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update recurring payment.";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  function statusClasses(status: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-400/40";
      case "PAUSED":
        return "bg-amber-500/10 text-amber-300 border-amber-400/40";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-300 border-rose-400/40";
      default:
        return "bg-slate-500/10 text-slate-200 border-slate-400/40";
    }
  }

  function intervalLabel(interval: string) {
    if (interval === "DAILY") return "Every day";
    if (interval === "WEEKLY") return "Every week";
    if (interval === "MONTHLY") return "Every month";
    return interval;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            Recurring payments
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Automate your regular transfers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Set up standing orders for rent, savings, subscriptions and more.
            We’ll execute them automatically on your chosen schedule.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-950/50 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Main layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Create form */}
        <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-50 mb-1">
            New recurring payment
          </h2>
          <p className="text-[11px] text-slate-500 mb-3">
            Define the source account, destination, amount and frequency.
          </p>

          {createError && (
            <div className="mb-2 text-[11px] text-red-300 bg-red-950/40 border border-red-700 rounded p-2">
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="mb-2 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-700 rounded p-2">
              {createSuccess}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            {/* From account */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                From account
              </label>
              <select
                name="fromAccountId"
                value={form.fromAccountId}
                onChange={handleFormChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select account…</option>
                {accounts.map((a) => {
                  const numericBalance = Number(a.balance);

                  return (
                    <option key={a.id} value={a.id}>
                      {a.currency}{" "}
                      {Number.isNaN(numericBalance)
                        ? a.balance // fallback if something weird
                        : numericBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                      • #{a.accountNumber}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* To account */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                To account ID
              </label>
              <input
                name="toAccountId"
                value={form.toAccountId}
                onChange={handleFormChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Destination account ID"
                required
              />
            </div>

            {/* Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Amount (LKR)
                </label>
                <input
                  name="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={handleFormChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Frequency
                </label>
                <select
                  name="interval"
                  value={form.interval}
                  onChange={handleFormChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
            </div>

            {/* First run date */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                First run (optional)
              </label>
              <input
                type="datetime-local"
                name="firstRunAt"
                value={form.firstRunAt}
                onChange={handleFormChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                If left empty, we’ll schedule it{" "}
                {intervalLabel(form.interval).toLowerCase()} from now.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Description (optional)
              </label>
              <input
                name="description"
                value={form.description}
                onChange={handleFormChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Rent, Loan, Monthly savings"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-3 py-2 text-xs font-medium text-white transition"
            >
              {creating ? "Creating…" : "Create recurring payment"}
            </button>
          </form>
        </div>

        {/* List of recurring payments */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Your recurring payments
              </h2>
              <p className="text-[11px] text-slate-500">
                Manage standing orders, pause them temporarily or cancel when no
                longer needed.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-slate-300">Loading…</div>
          ) : recurring.length === 0 ? (
            <div className="text-xs text-slate-400">
              You don&apos;t have any recurring payments yet. Create one on the
              left to get started.
            </div>
          ) : (
            <div className="space-y-2 text-xs max-h-[460px] overflow-y-auto pr-1">
              {recurring.map((rp) => (
                <div
                  key={rp.id}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-slate-400">From</span>
                      <span className="font-mono text-[11px] text-slate-100">
                        {rp.fromAccountId.slice(0, 8)}…
                      </span>
                      <span className="text-[11px] text-slate-400">→</span>
                      <span className="font-mono text-[11px] text-slate-100">
                        {rp.toAccountId.slice(0, 8)}…
                      </span>
                    </div>
                    <p className="font-semibold text-slate-50">
                      {rp.currency}{" "}
                      {Number(rp.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[11px] text-slate-400">
                        · {intervalLabel(rp.interval)}
                      </span>
                    </p>
                    {rp.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {rp.description}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">
                      Next run:{" "}
                      {new Date(rp.nextRunAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {rp.lastRunAt && (
                        <>
                          {" · Last run: "}
                          {new Date(rp.lastRunAt).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-between sm:justify-end flex-shrink-0">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        statusClasses(rp.status),
                      ].join(" ")}
                    >
                      {rp.status}
                    </span>
                    <div className="flex items-center gap-1">
                      {rp.status !== "CANCELLED" && (
                        <>
                          {rp.status === "ACTIVE" ? (
                            <button
                              type="button"
                              disabled={updatingId === rp.id}
                              onClick={() => void handleUpdate(rp.id, "PAUSED")}
                              className="px-2 py-1 rounded-md text-[11px] bg-amber-600 hover:bg-amber-500 disabled:opacity-60"
                            >
                              {updatingId === rp.id ? "…" : "Pause"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={updatingId === rp.id}
                              onClick={() => void handleUpdate(rp.id, "ACTIVE")}
                              className="px-2 py-1 rounded-md text-[11px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                            >
                              {updatingId === rp.id ? "…" : "Resume"}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={updatingId === rp.id}
                            onClick={() =>
                              void handleUpdate(rp.id, "CANCELLED")
                            }
                            className="px-2 py-1 rounded-md text-[11px] bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
                          >
                            {updatingId === rp.id ? "…" : "Cancel"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RecurringPaymentsPage;
