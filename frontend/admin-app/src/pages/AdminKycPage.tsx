import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import {
  getKycApplications,
  getKycApplicationById,
  decideKycApplication,
} from "../api";
import type { KycApplication, KycApplicationStatus } from "../types";

function statusBadgeClasses(status: KycApplicationStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/60";
    case "REJECTED":
      return "bg-rose-500/10 text-rose-300 border-rose-400/60";
    case "UNDER_REVIEW":
      return "bg-blue-500/10 text-blue-300 border-blue-400/60";
    case "SUBMITTED":
    default:
      return "bg-amber-500/10 text-amber-200 border-amber-400/60";
  }
}

function AdminKycPage() {
  const { token, user } = useAuth();

  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<KycApplication | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<KycApplicationStatus | "ALL">("SUBMITTED");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [decisionMsg, setDecisionMsg] = useState<string | null>(null);

  // Load list
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        setLoadingList(true);
        setError(null);

        const statusParam =
          statusFilter === "ALL" ? undefined : statusFilter;

        const res = await getKycApplications(token, statusParam);
        setApplications(res.applications);

        if (res.applications.length > 0 && !selectedId) {
          setSelectedId(res.applications[0].id);
        }
      } catch (err: any) {
        console.error("Failed to fetch KYC applications", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch KYC applications.";
        setError(msg);
      } finally {
        setLoadingList(false);
      }
    })();
  }, [token, statusFilter]);

  // Load selected app details
  useEffect(() => {
    if (!token || !selectedId) {
      setSelectedApp(null);
      return;
    }

    (async () => {
      try {
        setLoadingDetail(true);
        setDetailError(null);
        const res = await getKycApplicationById(token, selectedId);
        setSelectedApp(res.application);
      } catch (err: any) {
        console.error("Failed to fetch KYC application detail", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch KYC application details.";
        setDetailError(msg);
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [token, selectedId]);

  const handleDecision = async (decision: "APPROVE" | "REJECT") => {
    if (!token || !selectedId) return;

    try {
      setDecisionLoading(true);
      setDecisionMsg(null);
      await decideKycApplication(token, selectedId, decision);
      setDecisionMsg(
        decision === "APPROVE"
          ? "Application approved and user KYC updated to VERIFIED."
          : "Application rejected and user KYC updated to REJECTED."
      );

      // Refresh list & detail
      const statusParam =
        statusFilter === "ALL" ? undefined : statusFilter;
      const listRes = await getKycApplications(token, statusParam);
      setApplications(listRes.applications);

      // If still exists in current filter, reload detail; otherwise clear
      const stillExists = listRes.applications.find((a) => a.id === selectedId);
      if (stillExists) {
        const detailRes = await getKycApplicationById(token, selectedId);
        setSelectedApp(detailRes.application);
      } else {
        setSelectedId(null);
        setSelectedApp(null);
      }
    } catch (err: any) {
      console.error("Failed to decide KYC application", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update KYC application.";
      setDecisionMsg(msg);
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            KYC Review
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Customer identity verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Review KYC submissions, validate customer details and approve or
            reject applications to control who can open accounts.
          </p>
        </div>

        {user && (
          <div className="mt-1 sm:mt-0 rounded-2xl bg-slate-950/70 border border-white/10 px-4 py-3 text-right shadow-inner shadow-slate-900/60">
            <p className="text-[11px] text-slate-400 mb-1">Signed in as</p>
            <p className="text-sm font-semibold text-slate-50">
              {user.fullName}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Role: {user.role}
            </p>
          </div>
        )}
      </section>

      {/* Main layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: list */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                KYC applications
              </h2>
              <p className="text-[11px] text-slate-500">
                Filter by status and select a customer to review their details.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-400">Status</label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as KycApplicationStatus | "ALL")
                }
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All</option>
              </select>
            </div>
          </div>

          {loadingList ? (
            <div className="text-xs text-slate-400">Loading applications...</div>
          ) : error ? (
            <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-700 rounded p-2">
              {error}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-xs text-slate-400">
              No KYC applications found for this filter.
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => {
                const isSelected = app.id === selectedId;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedId(app.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 flex items-center justify-between gap-3 transition
                      ${
                        isSelected
                          ? "border-blue-400/70 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
                          : "border-white/5 bg-slate-950/80 hover:border-blue-400/40 hover:bg-slate-900"
                      }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-50 truncate">
                        {app.userFullName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {app.userEmail} • NIC {app.nicNumber}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {app.city} • {app.employmentStatus} • Income:{" "}
                        {Number(app.monthlyIncome).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{" "}
                        LKR
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          statusBadgeClasses(app.status),
                        ].join(" ")}
                      >
                        {app.status}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Submitted{" "}
                        {new Date(app.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: details & actions */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-50 mb-2">
            Application details
          </h2>

          {loadingDetail ? (
            <p className="text-xs text-slate-400">Loading details...</p>
          ) : detailError ? (
            <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-700 rounded p-2 mb-2">
              {detailError}
            </div>
          ) : !selectedApp ? (
            <p className="text-xs text-slate-400">
              Select a KYC application from the list to view full details and
              take action.
            </p>
          ) : (
            <>
              <div className="space-y-3 text-xs text-slate-200 mb-4">
                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">
                    Customer
                  </p>
                  <p className="font-medium text-slate-50">
                    {selectedApp.userFullName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedApp.userEmail}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      NIC / National ID
                    </p>
                    <p className="font-medium">{selectedApp.nicNumber}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      City
                    </p>
                    <p className="font-medium">{selectedApp.city}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">
                    Address
                  </p>
                  <p className="font-medium">
                    {selectedApp.addressLine1}
                    {selectedApp.addressLine2
                      ? `, ${selectedApp.addressLine2}`
                      : ""}
                    , {selectedApp.city}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Employment status
                    </p>
                    <p className="font-medium">
                      {selectedApp.employmentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Monthly income (LKR)
                    </p>
                    <p className="font-medium">
                      {Number(
                        selectedApp.monthlyIncome
                      ).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Employer
                    </p>
                    <p className="font-medium">
                      {selectedApp.employerName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Job title
                    </p>
                    <p className="font-medium">
                      {selectedApp.jobTitle || "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">
                    Source of funds
                  </p>
                  <p className="font-medium">{selectedApp.sourceOfFunds}</p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">
                    Application status
                  </p>
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      statusBadgeClasses(selectedApp.status),
                    ].join(" ")}
                  >
                    {selectedApp.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                  <div>
                    <p className="mb-0.5">Submitted</p>
                    <p>
                      {new Date(
                        selectedApp.createdAt
                      ).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5">Last updated</p>
                    <p>
                      {new Date(
                        selectedApp.updatedAt
                      ).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {decisionMsg && (
                <div className="mb-2 text-[11px] text-slate-200 bg-slate-900 border border-slate-600 rounded p-2">
                  {decisionMsg}
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-white/5 flex flex-col gap-2">
                <p className="text-[10px] text-slate-500">
                  Approving will set this customer&apos;s KYC status to{" "}
                  <span className="font-medium text-emerald-300">VERIFIED</span>.
                  Rejecting will set it to{" "}
                  <span className="font-medium text-rose-300">REJECTED</span> and
                  block them from opening accounts.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      decisionLoading ||
                      selectedApp.status === "APPROVED" ||
                      selectedApp.status === "REJECTED"
                    }
                    onClick={() => handleDecision("APPROVE")}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-3 py-1.5 text-[11px] font-medium text-white transition"
                  >
                    {decisionLoading ? "Saving..." : "Approve KYC"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      decisionLoading ||
                      selectedApp.status === "APPROVED" ||
                      selectedApp.status === "REJECTED"
                    }
                    onClick={() => handleDecision("REJECT")}
                    className="inline-flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 px-3 py-1.5 text-[11px] font-medium text-white transition"
                  >
                    {decisionLoading ? "Saving..." : "Reject KYC"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminKycPage;
