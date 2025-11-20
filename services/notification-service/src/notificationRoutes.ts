import { Router } from "express";
import prisma, { NotificationType } from "./prisma";
import { AuthedRequest, authMiddleware } from "./authMiddleware";

const router = Router();

// ----------------------------------------------
// POST /notifications
// Internal endpoint: create a notification
// ----------------------------------------------
router.post(
  "/notifications",
  async (req, res) => {
    try {
      const { userId, type, title, message } = req.body as {
        userId?: string;
        type?: string;
        title?: string;
        message?: string;
      };

      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          message: "userId, type, title and message are required",
        });
      }

      if (!Object.values(NotificationType).includes(type as NotificationType)) {
        return res.status(400).json({
          message: `Invalid notification type. Must be one of: ${Object.values(
            NotificationType
          ).join(", ")}`,
        });
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type: type as NotificationType,
          title,
          message,
        },
      });

      return res.status(201).json({ notification });
    } catch (err) {
      console.error("Create notification error:", err);
      return res
        .status(500)
        .json({ message: "Internal server error creating notification" });
    }
  }
);

// ----------------------------------------------
// GET /notifications/me
// Get recent notifications for current user
// ----------------------------------------------
router.get(
  "/notifications/me",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return res.json({ notifications });
    } catch (err) {
      console.error("Get my notifications error:", err);
      return res
        .status(500)
        .json({ message: "Internal server error fetching notifications" });
    }
  }
);

export default router;
