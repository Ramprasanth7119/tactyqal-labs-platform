import "./_env";
import { closeDb, getDb } from "../src/lib/db/client";
import { env } from "../src/lib/env";

async function main() {

  process.env.AUTO_SEED = "false";
  await getDb(); // opening the database applies pending migrations
  console.log(`Migrations applied to ${env.databaseUrl}`);
  closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
