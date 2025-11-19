import "dotenv/config";
import { createServer } from "./server";

const PORT = process.env.PORT || 4002;

async function main() {
  const app = createServer();

  app.listen(PORT, () => {
    console.log(`Account service listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start account service", err);
  process.exit(1);
});
