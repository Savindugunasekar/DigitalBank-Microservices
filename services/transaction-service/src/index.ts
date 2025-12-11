import "dotenv/config";
import { createServer } from "./server";
import {  startRecurringPaymentsScheduler} from "./recurringPaymentsRoutes";


const PORT = process.env.PORT || 4003;

async function main() {
  const app = createServer();

  app.listen(PORT, () => {
    console.log(`Transaction service listening on port ${PORT}`);
    startRecurringPaymentsScheduler();
  });
}

main().catch((err) => {
  console.error("Failed to start transaction service", err);
  process.exit(1);
});
