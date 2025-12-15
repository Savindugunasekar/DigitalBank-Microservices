import "dotenv/config";
import { createServer } from "./server";
import { startNotificationConsumer } from "./rabbit/notificationConsumer";

const PORT = process.env.PORT || 4005; // choose a free port

async function main() {
  const app = createServer();

  app.listen(PORT, () => {
    console.log(`Notification service listening on port ${PORT}`);
  });

  startNotificationConsumer().catch((err) => {
    console.error("Failed to start RabbitMQ consumer:", err);
  });
}

main().catch((err) => {
  console.error("Failed to start notification service", err);
  process.exit(1);
});
