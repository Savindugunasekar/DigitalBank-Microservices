// auth-service/src/internalUserRoutes.ts
import { Router } from "express";
import prisma from "./prisma";

const router = Router();

router.get("/internal/users/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        kycStatus: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (err) {
    console.error("Internal user lookup error:", err);
    return res.status(500).json({ message: "Internal error" });
  }
});

export default router;
