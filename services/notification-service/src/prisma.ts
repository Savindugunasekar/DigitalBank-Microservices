import {
  PrismaClient,
  NotificationType,
} from "../generated/notification-client";

const prisma = new PrismaClient();

export default prisma;
export { NotificationType };
