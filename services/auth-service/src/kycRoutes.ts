import { Router } from "express";
import prisma from "./prisma";
import { authMiddleware, AuthedRequest, requireRole } from "./authMiddleware";

const router = Router();

/**
 * POST /kyc/applications
 * Create / submit a KYC application for the current user.
 */
router.post(
  "/kyc/applications",
  authMiddleware,
  requireRole(["CUSTOMER"]),
  async (req: AuthedRequest, res) => {
    try {
      const userId = req.user!.userId;

      const {
        nicNumber,
        addressLine1,
        addressLine2,
        city,
        employmentStatus,
        employerName,
        jobTitle,
        monthlyIncome,
        sourceOfFunds,
      } = req.body || {};

      // Basic validation
      if (
        !nicNumber ||
        !addressLine1 ||
        !city ||
        !employmentStatus ||
        !monthlyIncome ||
        !sourceOfFunds
      ) {
        return res.status(400).json({
          message: "Missing required fields in KYC application.",
        });
      }

      // Check if there is already a KYC application in progress
      const existing = await prisma.kycApplication.findFirst({
        where: {
          userId,
          status: {
            in: ["SUBMITTED", "UNDER_REVIEW"],
          },
        },
      });

      if (existing) {
        return res.status(400).json({
          message:
            "You already have a KYC application under review. Please wait for a decision before submitting another.",
        });
      }

      // If user was REJECTED earlier and is resubmitting, set them back to PENDING
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "PENDING" },
      });

      const application = await prisma.kycApplication.create({
        data: {
          userId,
          nicNumber,
          addressLine1,
          addressLine2,
          city,
          employmentStatus,
          employerName,
          jobTitle,
          monthlyIncome: String(monthlyIncome),
          sourceOfFunds,
          status: "SUBMITTED",
        },
      });

      return res.status(201).json({
        message: "KYC application submitted successfully.",
        applicationId: application.id,
      });
    } catch (err: any) {
      console.error("Create KYC application error:", err);
      return res
        .status(500)
        .json({ message: "Internal server error while submitting KYC." });
    }
  }
);

export default router;
