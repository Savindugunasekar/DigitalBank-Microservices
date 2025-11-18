import "dotenv/config";
import { createServer } from "./server";

const PORT = process.env.PORT || 4001;

async function main() {
  const app = createServer();

  app.listen(PORT, () => {
    console.log(`Auth service listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start auth service", err);
  process.exit(1);
});
