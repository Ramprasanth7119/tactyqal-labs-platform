import "./_env";
process.env.AUTO_SEED = "false";

async function main() {
  const { closeDb, getDb } = await import("../src/lib/db/client");
  const { seedDatabase } = await import("../src/lib/blog/seed");
  await getDb();
  const r = await seedDatabase();
  console.log(`Seed complete: ${r.created} new post(s) created (${r.total} defined, existing slugs are skipped).`);
  closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
