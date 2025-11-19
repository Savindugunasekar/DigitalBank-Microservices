import { PrismaClient, Role, KycStatus } from "../generated/auth-client";

const prisma = new PrismaClient();

export default prisma;
export { Role, KycStatus };
