import { PrismaClient, AccountStatus, AccountType } from "../generated/account-client";

const prisma = new PrismaClient();

export default prisma;
export { AccountStatus, AccountType };
