import { useState } from "react";
import type { FormEvent } from "react";
import { submitKycApplication, type KycApplicationPayload } from "../api";
import { useAuth } from "../auth";
import { useNavigate } from "react-router-dom";


const initialForm: KycApplicationPayload = {
    nicNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    employmentStatus: "",
    employerName: "",
    jobTitle: "",
    monthlyIncome: "",
    sourceOfFunds: "",
};

export function KycFormPage() {
    const [form, setForm] = useState<KycApplicationPayload>(initialForm);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { token, user, refreshUser } = useAuth();
    const navigate = useNavigate();


    const kycStatus = user?.kycStatus ?? "PENDING";

    const kycLabel =
        kycStatus === "VERIFIED"
            ? "KYC Verified"
            : kycStatus === "REJECTED"
                ? "KYC Rejected"
                : "KYC Pending";

    const kycBadgeClasses =
        kycStatus === "VERIFIED"
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/60"
            : kycStatus === "REJECTED"
                ? "bg-rose-500/10 text-rose-300 border-rose-400/60"
                : "bg-amber-500/10 text-amber-200 border-amber-400/60";

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg(null);

        setErrorMsg(null);

        if (!token) {
            setLoading(false);
            setErrorMsg("You must be logged in to submit KYC.");
            return;
        }

        try {
            await submitKycApplication(token, form);
            setSuccessMsg(
                "Your KYC details have been submitted. We will review and update your status."
            );
            setForm(initialForm);
            await refreshUser();
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        } catch (err: any) {
            console.error("KYC submission failed", err);
            const backendMsg =
                err?.response?.data?.message ||
                "Something went wrong. Please try again.";
            setErrorMsg(backendMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Header / hero */}
            <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 px-4 py-4 sm:px-6 sm:py-5 shadow-inner shadow-slate-900/70">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                    KYC & Compliance
                </p>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
                    Verify your identity
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                    We&apos;re required to collect a few details to keep your account
                    secure and comply with banking regulations. This helps us protect you
                    from fraud and unauthorized access.
                </p>

                {user && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="text-slate-400">Current KYC status:</span>
                        <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${kycBadgeClasses}`}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {kycLabel}
                        </span>
                        {kycStatus === "VERIFIED" && (
                            <span className="text-emerald-300">
                                • You&apos;re fully verified.
                            </span>
                        )}
                        {kycStatus === "PENDING" && (
                            <span className="text-amber-200">
                                • Complete the form below to speed up approval.
                            </span>
                        )}
                    </div>
                )}
            </section>

            {/* Form card */}
            <section className="rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-4 sm:px-6 sm:py-5 shadow-inner shadow-slate-900/70">
                {successMsg && (
                    <div className="mb-4 text-[11px] sm:text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-700 rounded-lg px-3 py-2">
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="mb-4 text-[11px] sm:text-xs text-rose-300 bg-rose-950/40 border border-rose-700 rounded-lg px-3 py-2">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Identity section */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-50 mb-1.5">
                            Personal information
                        </h2>
                        <p className="text-[11px] text-slate-500 mb-3">
                            Make sure these details match your official documents.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* NIC */}
                            <div className="sm:col-span-2">
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="nicNumber"
                                >
                                    NIC / National ID Number
                                </label>
                                <input
                                    id="nicNumber"
                                    name="nicNumber"
                                    value={form.nicNumber}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 200012345678"
                                    required
                                />
                            </div>

                            {/* Address line 1 */}
                            <div className="sm:col-span-2">
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="addressLine1"
                                >
                                    Address Line 1
                                </label>
                                <input
                                    id="addressLine1"
                                    name="addressLine1"
                                    value={form.addressLine1}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="House number, street"
                                    required
                                />
                            </div>

                            {/* Address line 2 */}
                            <div className="sm:col-span-2">
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="addressLine2"
                                >
                                    Address Line 2 (optional)
                                </label>
                                <input
                                    id="addressLine2"
                                    name="addressLine2"
                                    value={form.addressLine2}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Apartment, floor, or landmark"
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="city"
                                >
                                    City
                                </label>
                                <input
                                    id="city"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. Colombo"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employment & income */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-50 mb-1.5">
                            Employment & income
                        </h2>
                        <p className="text-[11px] text-slate-500 mb-3">
                            These details help us understand your typical transaction patterns.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Employment status */}
                            <div>
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="employmentStatus"
                                >
                                    Employment status
                                </label>
                                <select
                                    id="employmentStatus"
                                    name="employmentStatus"
                                    value={form.employmentStatus}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select...</option>
                                    <option value="EMPLOYED">Employed</option>
                                    <option value="SELF_EMPLOYED">Self-employed</option>
                                    <option value="STUDENT">Student</option>
                                    <option value="UNEMPLOYED">Unemployed</option>
                                    <option value="RETIRED">Retired</option>
                                </select>
                            </div>

                            {/* Monthly income */}
                            <div>
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="monthlyIncome"
                                >
                                    Monthly income (LKR)
                                </label>
                                <input
                                    id="monthlyIncome"
                                    name="monthlyIncome"
                                    type="number"
                                    min={0}
                                    value={form.monthlyIncome}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 150000"
                                    required
                                />
                            </div>

                            {/* Employer name */}
                            <div>
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="employerName"
                                >
                                    Employer name (if applicable)
                                </label>
                                <input
                                    id="employerName"
                                    name="employerName"
                                    value={form.employerName}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Company or business name"
                                />
                            </div>

                            {/* Job title */}
                            <div>
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="jobTitle"
                                >
                                    Job title (if applicable)
                                </label>
                                <input
                                    id="jobTitle"
                                    name="jobTitle"
                                    value={form.jobTitle}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>

                            {/* Source of funds */}
                            <div className="sm:col-span-2">
                                <label
                                    className="block text-[11px] font-medium text-slate-300 mb-1"
                                    htmlFor="sourceOfFunds"
                                >
                                    Main source of funds
                                </label>
                                <select
                                    id="sourceOfFunds"
                                    name="sourceOfFunds"
                                    value={form.sourceOfFunds}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select...</option>
                                    <option value="SALARY">Salary</option>
                                    <option value="BUSINESS">Business income</option>
                                    <option value="INVESTMENTS">Investments</option>
                                    <option value="FAMILY">Family support</option>
                                    <option value="OTHER">Other</option>
                                </select>
                                <p className="mt-1 text-[10px] text-slate-500">
                                    This helps us distinguish between normal and unusual
                                    transactions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-1 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <p className="text-[10px] text-slate-500 max-w-sm">
                            By submitting these details you confirm that the information is
                            accurate and you are the lawful owner of the funds used in this
                            account.
                        </p>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2 text-xs font-medium text-white transition"
                        >
                            {loading ? "Submitting..." : "Submit KYC details"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
