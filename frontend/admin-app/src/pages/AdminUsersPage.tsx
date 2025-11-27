import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import type { User, Role, KycStatus } from "../types";
import {
  getAdminUsers,
  updateUserRole,
  updateUserKycStatus,
  adminCreateUser,
} from "../api";

function AdminUsersPage() {
  const { token } = useAuth();

  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<Role>("CUSTOMER");
  const [createKycStatus, setCreateKycStatus] = useState<KycStatus>("PENDING");
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Fetch users
  async function loadUsers() {
    if (!token) return;
    try {
      setUsersLoading(true);
      setUsersError(null);
      const data = await getAdminUsers(token);
      setAdminUsers(data.users);
    } catch (err: any) {
      console.error("Failed to load users", err);
      const msg =
        err?.response?.data?.message || err?.message || "Failed to load users.";
      setUsersError(msg);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [token]);

  // Create user
  async function handleCreateUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setCreateUserError(null);

    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      setCreateUserError("Please fill in name, email and password.");
      return;
    }

    if (createPassword.length < 6) {
      setCreateUserError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setCreateUserLoading(true);
      const newUser = await adminCreateUser(
        {
          fullName: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
          kycStatus: createKycStatus,
        },
        token
      );

      setAdminUsers((prev) => [newUser, ...prev]);

      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("CUSTOMER");
      setCreateKycStatus("PENDING");
      setShowCreateUser(false);
    } catch (err: any) {
      console.error("Admin create user failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create user.";
      setCreateUserError(msg);
    } finally {
      setCreateUserLoading(false);
    }
  }

  // Update role
  async function handleChangeUserRole(userId: string, role: Role) {
    if (!token) return;
    try {
      const updated = await updateUserRole(userId, role, token);
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err: any) {
      console.error("Update user role failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user role.";
      setUsersError(msg);
    }
  }

  // Update KYC
  async function handleChangeUserKyc(userId: string, status: KycStatus) {
    if (!token) return;
    try {
      const updated = await updateUserKycStatus(userId, status, token);
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err: any) {
      console.error("Update user KYC failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user KYC status.";
      setUsersError(msg);
    }
  }

  // Small stats for summary header
  const totalUsers = adminUsers.length;
  const verifiedCount = adminUsers.filter(
    (u) => (u.kycStatus as KycStatus) === "VERIFIED"
  ).length;
  const pendingCount = adminUsers.filter(
    (u) => (u.kycStatus as KycStatus) === "PENDING" || !u.kycStatus
  ).length;
  const rejectedCount = adminUsers.filter(
    (u) => (u.kycStatus as KycStatus) === "REJECTED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero / summary */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950/85 via-slate-900/85 to-slate-950/85 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
            Users &amp; KYC
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Customer directory &amp; identity status
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Manage user roles, verify KYC status and create admin or risk
            accounts directly from this panel.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs sm:w-[280px]">
          <div className="rounded-xl bg-slate-950/70 border border-white/10 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
            <p className="text-[10px] text-slate-400 mb-0.5">Total users</p>
            <p className="text-lg font-semibold text-slate-50">
              {totalUsers}
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/70 border border-emerald-400/40 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
            <p className="text-[10px] text-slate-400 mb-0.5">Verified KYC</p>
            <p className="text-lg font-semibold text-emerald-300">
              {verifiedCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/70 border border-amber-400/40 px-3 py-2 text-right shadow-inner shadow-slate-900/60">
            <p className="text-[10px] text-slate-400 mb-0.5">Pending</p>
            <p className="text-lg font-semibold text-amber-300">
              {pendingCount}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Rejected: {rejectedCount}
            </p>
          </div>
        </div>
      </section>

      {/* Create user + table */}
      <section className="space-y-4">
        {/* Create user glass card */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Create user
              </h2>
              <p className="text-[11px] text-slate-500">
                Quickly create new customer, admin or risk officer accounts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateUser((v) => !v)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-blue-400/70 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20 transition"
            >
              {showCreateUser ? "Hide form" : "New user"}
            </button>
          </div>

          {showCreateUser && (
            <form
              onSubmit={handleCreateUserSubmit}
              className="border border-white/10 rounded-xl p-3 sm:p-4 bg-slate-950/80 space-y-3"
            >
              {createUserError && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2">
                  {createUserError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="jane@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300">
                    Role
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as Role)}
                    className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="RISK_OFFICER">RISK_OFFICER</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2 sm:max-w-xs">
                  <label className="block text-[11px] text-slate-300">
                    KYC status
                  </label>
                  <select
                    value={createKycStatus}
                    onChange={(e) =>
                      setCreateKycStatus(e.target.value as KycStatus)
                    }
                    className="w-full rounded-md bg-slate-950 border border-slate-600 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="px-3 py-1.5 rounded-md text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="px-3 py-1.5 rounded-md text-[11px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                >
                  {createUserLoading ? "Creating…" : "Create user"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Users table */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                All users
              </h2>
              <p className="text-[11px] text-slate-500">
                Adjust roles and KYC status directly from the grid.
              </p>
            </div>
          </div>

          {usersError && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 rounded p-2 mb-3">
              {usersError}
            </div>
          )}

          {usersLoading && (
            <div className="text-xs text-slate-300">Loading users…</div>
          )}

          {!usersLoading && adminUsers.length === 0 && !usersError && (
            <div className="text-xs text-slate-300">
              No users found in the system.
            </div>
          )}

          {!usersLoading && adminUsers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-white/10 rounded-xl overflow-hidden">
                <thead className="bg-slate-950/90">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      User ID
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      Role
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      KYC
                    </th>
                    <th className="px-3 py-2 text-left border-b border-white/10">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => {
                    const kyc = (u.kycStatus as KycStatus) || "PENDING";

                    const kycClass =
                      kyc === "VERIFIED"
                        ? "bg-emerald-900/40 text-emerald-300 border-emerald-600"
                        : kyc === "REJECTED"
                        ? "bg-rose-900/40 text-rose-300 border-rose-600"
                        : "bg-amber-900/40 text-amber-300 border-amber-600";

                    return (
                      <tr
                        key={u.id}
                        className="odd:bg-slate-950/70 even:bg-slate-900/60"
                      >
                        <td className="px-3 py-2 border-b border-white/5">
                          <span className="font-mono text-[11px]">
                            {u.id.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="px-3 py-2 border-b border-white/5">
                          {u.fullName}
                        </td>
                        <td className="px-3 py-2 border-b border-white/5">
                          {u.email}
                        </td>
                        <td className="px-3 py-2 border-b border-white/5">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              void handleChangeUserRole(
                                u.id,
                                e.target.value as Role
                              )
                            }
                            className="bg-slate-950 border border-slate-600 rounded px-2 py-1 text-[11px]"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="RISK_OFFICER">
                              RISK_OFFICER
                            </option>
                          </select>
                        </td>
                        <td className="px-3 py-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] uppercase ${kycClass}`}
                            >
                              {kyc}
                            </span>
                            {kyc === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-600 hover:bg-emerald-500"
                                  onClick={() =>
                                    void handleChangeUserKyc(u.id, "VERIFIED")
                                  }
                                >
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  className="px-2 py-0.5 rounded-md text-[10px] bg-rose-600 hover:bg-rose-500"
                                  onClick={() =>
                                    void handleChangeUserKyc(u.id, "REJECTED")
                                  }
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 border-b border-white/5">
                          <span className="text-[11px] text-slate-300">
                            {(u as any).createdAt
                              ? new Date(
                                  (u as any).createdAt
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminUsersPage;
