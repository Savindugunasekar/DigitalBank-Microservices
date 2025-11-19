import "dotenv/config";
import { createServer } from "./server";

const PORT = process.env.PORT || 4004;

async function main() {
  const app = createServer();

  app.listen(PORT, () => {
    console.log(`Fraud service listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start fraud service", err);
  process.exit(1);
});
