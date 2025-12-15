export const PORT = Number(process.env.PORT ?? 4003);

export const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";

export const ACCOUNT_SERVICE_URL =
  process.env.ACCOUNT_SERVICE_URL ?? "http://localhost:4002";

export const FRAUD_SERVICE_URL =
  process.env.FRAUD_SERVICE_URL ?? "http://localhost:4004";

export const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:4005";

export const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
