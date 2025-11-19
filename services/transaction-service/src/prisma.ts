import { PrismaClient, TransactionStatus } from "../generated/transaction-client";

const prisma = new PrismaClient();

export default prisma;
export { TransactionStatus };
