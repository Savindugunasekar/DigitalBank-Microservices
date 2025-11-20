import "dotenv/config";
import { createServer } from "./server";

const PORT = process.env.PORT || 4005; // choose a free port

async function main() {
  const app = createServer();

  app.listen(PORT, () => {
    console.log(`Notification service listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start notification service", err);
  process.exit(1);
});
