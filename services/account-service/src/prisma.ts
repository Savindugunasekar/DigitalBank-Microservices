import { PrismaClient, AccountStatus } from "../generated/account-client";

const prisma = new PrismaClient();

export default prisma;
export { AccountStatus };
