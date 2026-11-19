import "./_env";
import fs from "node:fs";
import { parseArgs } from "node:util";

process.env.AUTO_SEED = "false";

const { values } = parseArgs({
  options: {
    file: { type: "string" },
    url: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (values.help || (!values.file && !values.url)) {
  console.log(`Import posts from WordPress into the Tactyqal blog database (idempotent by slug).

  npm run import:wordpress -- --file export.xml          WXR export (Tools > Export in wp-admin)
  npm run import:wordpress -- --url https://site/wp-json  WP REST API
  Add --dry-run to preview without writing.`);
  process.exit(values.help ? 0 : 1);
}

async function main() {
  const { closeDb, getDb } = await import("../src/lib/db/client");
  const { fetchWpRestPosts, importPosts, parseWxr } = await import("../src/lib/blog/import-wordpress");

  const items = values.file
    ? parseWxr(fs.readFileSync(values.file, "utf8"))
    : await fetchWpRestPosts(values.url!);

  console.log(`Found ${items.length} post(s) to import.`);
  await getDb();
  const r = await importPosts(items, { dryRun: values["dry-run"], log: (m) => console.log("  " + m) });
  console.log(`${values["dry-run"] ? "[dry run] " : ""}created ${r.created}, updated ${r.updated}, unchanged ${r.skipped}, failed ${r.failed.length}`);
  for (const f of r.failed) console.error(`  FAILED ${f.slug}: ${f.error}`);
  closeDb();
  process.exit(r.failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
