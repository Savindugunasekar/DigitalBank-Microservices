// src/eventBus.ts
import amqplib, { Channel, ChannelModel } from "amqplib";
import crypto from "crypto";
import { RABBITMQ_URL } from "./config";

const EXCHANGE_NAME = "bank.domain";

type DomainEvent<T> = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  data: T;
};

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  connection = await amqplib.connect(RABBITMQ_URL);

  connection.on("error", (err) => {
    console.error("[RabbitMQ] connection error:", err);
  });

  connection.on("close", () => {
    console.error("[RabbitMQ] connection closed");
    connection = null;
    channel = null;
  });

  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

  return channel;
}

export async function publishDomainEvent<T>(
  eventType: string,
  payload: T
): Promise<void> {
  try {
    const ch = await getChannel();

    const event: DomainEvent<T> = {
      eventId:
        (crypto.randomUUID && crypto.randomUUID()) ||
        crypto.randomBytes(16).toString("hex"),
      eventType,
      occurredAt: new Date().toISOString(),
      data: payload,
    };

    const body = Buffer.from(JSON.stringify(event));

    ch.publish(EXCHANGE_NAME, eventType, body, {
      persistent: true,
      contentType: "application/json",
    });
  } catch (err) {
    // never break core flow because MQ is down
    console.error("Failed to publish domain event:", err);
  }
}
