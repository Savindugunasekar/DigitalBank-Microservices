import amqplib, { Channel, ChannelModel, ConsumeMessage } from "amqplib";
import prisma from "../prisma";
import { RABBITMQ_URL } from "../config";

const EXCHANGE_NAME = "bank.domain";
const QUEUE_NAME = "notifications.transaction";

// routing keys we care about
const ROUTING_KEYS = [
  "transaction.executed",
  "transaction.flagged",
  "transaction.rejected",
] as const;

type RoutingKey = (typeof ROUTING_KEYS)[number];

type DomainEvent<T> = {
  eventId: string;
  eventType: string; // usually same as routing key
  occurredAt: string;
  data: T;
};

type TransactionExecutedPayload = {
  userId: string;
  transactionId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
  reference?: string | null;
};

type TransactionFlaggedPayload = {
  userId: string;
  transactionId: string;
  amount: number;
  currency?: string;
  reasons?: string[]; // if you ever include them
  reason?: string | null; // legacy single reason
  toAccountId?: string;
};

type TransactionRejectedPayload = {
  userId: string;
  transactionId: string;
  amount: number;
  currency?: string;
  toAccountId?: string;
  reference?: string | null;
  reason?: string | null;
};

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

function isRoutingKey(x: string): x is RoutingKey {
  return (ROUTING_KEYS as readonly string[]).includes(x);
}

async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  connection = await amqplib.connect(RABBITMQ_URL);

  connection.on("error", (err) => {
    console.error("[RabbitMQ] connection error:", err);
  });

  connection.on("close", () => {
    console.error("[RabbitMQ] connection closed. Consumer will stop.");
    channel = null;
    connection = null;
  });

  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, key);
  }

  // process a few at a time
  await channel.prefetch(10);

  return channel;
}

function safeJsonParse<T>(msg: ConsumeMessage): T | null {
  try {
    return JSON.parse(msg.content.toString("utf8")) as T;
  } catch (e) {
    console.error("[RabbitMQ] Invalid JSON:", e);
    return null;
  }
}

async function handleEvent(routingKey: RoutingKey, raw: any) {
  // optional: if your producer includes eventType, you can use that too
  // but routingKey is the source of truth here

  if (routingKey === "transaction.executed") {
    const evt = raw as DomainEvent<TransactionExecutedPayload>;
    const p = evt.data;

    await prisma.notification.create({
      data: {
        userId: p.userId,
        type: "TRANSACTION",
        title: "Transfer successful",
        message: `You sent ${p.currency ?? "LKR"} ${Number(p.amount).toFixed(
          2
        )} to account ${p.toAccountId}.`,
      },
    });

    return;
  }

  if (routingKey === "transaction.flagged") {
    const evt = raw as DomainEvent<TransactionFlaggedPayload>;
    const p = evt.data;

    const reason =
      p.reason ??
      (Array.isArray(p.reasons) && p.reasons.length > 0
        ? p.reasons.join(", ")
        : null);

    await prisma.notification.create({
      data: {
        userId: p.userId,
        type: "FRAUD_ALERT",
        title: "Transaction flagged for review",
        message: `A transaction of ${p.currency ?? "LKR"} ${Number(
          p.amount
        ).toFixed(2)} was flagged for manual review.${
          reason ? ` Reason: ${reason}` : ""
        }`,
      },
    });

    return;
  }

  if (routingKey === "transaction.rejected") {
    const evt = raw as DomainEvent<TransactionRejectedPayload>;
    const p = evt.data;

    await prisma.notification.create({
      data: {
        userId: p.userId,
        type: "FRAUD_ALERT",
        title: "Transaction rejected",
        message: `A transaction of ${p.currency ?? "LKR"} ${Number(
          p.amount
        ).toFixed(2)} was rejected after review.${
          p.reason ? ` Reason: ${p.reason}` : ""
        }`,
      },
    });

    return;
  }
}

export async function startNotificationConsumer() {
  const ch = await getChannel();

  console.log(
    `[RabbitMQ] Notification consumer started. queue=${QUEUE_NAME}, keys=${ROUTING_KEYS.join(
      ", "
    )}`
  );

  await ch.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const rkRaw = String(msg.fields.routingKey || "");
      if (!isRoutingKey(rkRaw)) {
        // not our event -> drop
        ch.ack(msg);
        return;
      }

      const parsed = safeJsonParse<any>(msg);
      if (!parsed) {
        // bad message -> drop (ack so it doesn't poison the queue)
        ch.ack(msg);
        return;
      }

      try {
        // If you add eventId uniqueness later, this is where you’d dedupe:
        // await prisma.processedEvent.create({ data: { eventId: parsed.eventId } })

        await handleEvent(rkRaw, parsed);

        ch.ack(msg);
      } catch (err) {
        console.error("[RabbitMQ] Failed to handle message:", err);
        // for now: do NOT requeue (avoids infinite loops)
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}
