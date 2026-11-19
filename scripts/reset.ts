import "./_env";
import fs from "node:fs";
import path from "node:path";


async function main() {
  process.env.AUTO_SEED = "false";
  const url = process.env.DATABASE_URL || "file:./data/blog.db";
  if (!url.startsWith("file:")) {
    console.error("db:reset only works on a local SQLite file. Refusing to wipe a remote database.");
    process.exit(1);
  }
  const file = path.resolve(url.slice(5).replace(/^\/\//, ""));
  try {
      for (const f of [file, `${file}-wal`, `${file}-shm`, `${file}-journal`]) fs.rmSync(f, { force: true });
    } catch (e) {
      console.error(`Could not delete ${file}: ${(e as Error).message}
Stop any running dev server (it holds the file open on Windows) and retry.`);
      process.exit(1);
    }
  console.log(`Deleted ${file}`);

  const { closeDb, getDb } = await import("../src/lib/db/client");
  const { seedDatabase } = await import("../src/lib/blog/seed");
  await getDb();
  const r = await seedDatabase();
  console.log(`Recreated schema and seeded ${r.created} posts.`);
  closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
