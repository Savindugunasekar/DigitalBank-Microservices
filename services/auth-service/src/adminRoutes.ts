import { Router } from "express";
import prisma from "./prisma";
import { authMiddleware, requireRole, AuthedRequest } from "./authMiddleware";
import bcrypt from "bcryptjs";

const router = Router();

/**
 * GET /admin/users
 * List all users (ADMIN only)
 */
router.get(
  "/admin/users",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (_req: AuthedRequest, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ users });
    } catch (err) {
      console.error("Get admin users error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/admin/users",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res) => {
    try {
      const {
        fullName,
        email,
        password,
        role,
        kycStatus,
      }: {
        fullName?: string;
        email?: string;
        password?: string;
        role?: string;
        kycStatus?: string;
      } = req.body;

      if (!fullName || !email || !password) {
        return res.status(400).json({
          message: "fullName, email and password are required",
        });
      }

      const allowedRoles = ["CUSTOMER", "ADMIN", "RISK_OFFICER"];
      const finalRole = role && allowedRoles.includes(role) ? role : "CUSTOMER";

      const allowedKyc = ["PENDING", "VERIFIED", "REJECTED"];
      const finalKyc =
        kycStatus && allowedKyc.includes(kycStatus) ? kycStatus : "PENDING";

      // hash password
      const hashed = bcrypt.hashSync(password, 10);

      const user = await prisma.user.create({
        data: {
          fullName,
          email,
          password: hashed,
          role: finalRole as any,
          kycStatus: finalKyc as any,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json({ user });
    } catch (err: any) {
      console.error("Admin create user error:", err);

      // Prisma unique constraint on email
      if (err.code === "P2002") {
        return res.status(409).json({ message: "Email already in use" });
      }

      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /admin/users/:id/role
 * Change user role (ADMIN only)
 */
router.patch(
  "/admin/users/:id/role",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body as { role?: string };

      if (!role) {
        return res.status(400).json({ message: "role is required" });
      }

      const allowed = ["CUSTOMER", "ADMIN", "RISK_OFFICER"];
      if (!allowed.includes(role)) {
        return res.status(400).json({ message: "Invalid role value" });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role: role as any },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ user });
    } catch (err: any) {
      console.error("Change user role error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /admin/kyc/pending
 * List users with PENDING KYC
 */
router.get(
  "/admin/kyc/pending",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (_req: AuthedRequest, res) => {
    try {
      const pending = await prisma.user.findMany({
        where: { kycStatus: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
        },
      });

      return res.json({ users: pending });
    } catch (err) {
      console.error("Get pending KYC users error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /admin/kyc/:id/verify
 * Set kycStatus = VERIFIED
 */
router.patch(
  "/admin/kyc/:id/verify",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: { id },
        data: { kycStatus: "VERIFIED" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ user });
    } catch (err: any) {
      console.error("Verify KYC error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /admin/kyc/:id/reject
 * Set kycStatus = REJECTED
 */
router.patch(
  "/admin/kyc/:id/reject",
  authMiddleware,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: { id },
        data: { kycStatus: "REJECTED" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({ user });
    } catch (err: any) {
      console.error("Reject KYC error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET /admin/kyc/applications?status=SUBMITTED
router.get(
  "/admin/kyc/applications",
  authMiddleware,
  requireRole(["ADMIN", "RISK_OFFICER"]),
  async (req: AuthedRequest, res) => {
    try {
      const status = req.query.status as
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "REJECTED"
        | undefined;

      const where = status ? { status } : {};

      const applications = await prisma.kycApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              kycStatus: true,
            },
          },
        },
        take: 100,
      });

      const payload = applications.map((app) => ({
        id: app.id,
        userId: app.userId,
        userEmail: app.user.email,
        userFullName: app.user.fullName,
        userKycStatus: app.user.kycStatus,
        nicNumber: app.nicNumber,
        city: app.city,
        employmentStatus: app.employmentStatus,
        monthlyIncome: app.monthlyIncome,
        sourceOfFunds: app.sourceOfFunds,
        status: app.status,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      }));

      return res.json({ applications: payload });
    } catch (err) {
      console.error("List KYC applications error:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch KYC applications." });
    }
  }
);

// GET /admin/kyc/applications/:id
router.get(
  "/admin/kyc/applications/:id",
  authMiddleware,
  requireRole(["ADMIN", "RISK_OFFICER"]),
  async (req: AuthedRequest, res) => {
    try {
      const appId = req.params.id;

      const app = await prisma.kycApplication.findUnique({
        where: { id: appId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              kycStatus: true,
            },
          },
        },
      });

      if (!app) {
        return res.status(404).json({ message: "KYC application not found." });
      }

      return res.json({
        application: {
          id: app.id,
          userId: app.userId,
          userEmail: app.user.email,
          userFullName: app.user.fullName,
          userKycStatus: app.user.kycStatus,
          nicNumber: app.nicNumber,
          addressLine1: app.addressLine1,
          addressLine2: app.addressLine2,
          city: app.city,
          employmentStatus: app.employmentStatus,
          employerName: app.employerName,
          jobTitle: app.jobTitle,
          monthlyIncome: app.monthlyIncome,
          sourceOfFunds: app.sourceOfFunds,
          status: app.status,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        },
      });
    } catch (err) {
      console.error("Get KYC application error:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch KYC application." });
    }
  }
);

// POST /admin/kyc/applications/:id/decision
router.post(
  "/admin/kyc/applications/:id/decision",
  authMiddleware,
  requireRole(["ADMIN", "RISK_OFFICER"]),
  async (req: AuthedRequest, res) => {
    try {
      const appId = req.params.id;
      const { decision } = req.body as { decision?: "APPROVE" | "REJECT" };

      if (!decision || !["APPROVE", "REJECT"].includes(decision)) {
        return res.status(400).json({ message: "Invalid decision." });
      }

      const app = await prisma.kycApplication.findUnique({
        where: { id: appId },
      });

      if (!app) {
        return res.status(404).json({ message: "KYC application not found." });
      }

      if (app.status === "APPROVED" || app.status === "REJECTED") {
        return res.status(400).json({
          message: "This KYC application has already been decided.",
        });
      }

      const newAppStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
      const newUserStatus = decision === "APPROVE" ? "VERIFIED" : "REJECTED";

      const [updatedApp, updatedUser] = await Promise.all([
        prisma.kycApplication.update({
          where: { id: appId },
          data: {
            status: newAppStatus,
          },
        }),
        prisma.user.update({
          where: { id: app.userId },
          data: { kycStatus: newUserStatus },
        }),
      ]);

      return res.json({
        message: `KYC application ${decision === "APPROVE" ? "approved" : "rejected"}.`,
        application: updatedApp,
        user: {
          id: updatedUser.id,
          kycStatus: updatedUser.kycStatus,
        },
      });
    } catch (err) {
      console.error("Decide KYC application error:", err);
      return res
        .status(500)
        .json({ message: "Failed to decide on KYC application." });
    }
  }
);

export default router;


