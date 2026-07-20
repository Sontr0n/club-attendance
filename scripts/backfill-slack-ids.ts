/**
 * Backfills Member.slackUserId with real Slack member IDs (U…) by looking
 * each member up by email. Run with:
 *   npx tsx --env-file=.env scripts/backfill-slack-ids.ts
 *
 * Read-only against Slack; only writes to your own database.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { WebClient } from "@slack/web-api";

async function main() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || token.startsWith("xoxb-...")) {
    console.error("SLACK_BOT_TOKEN is not set in .env — aborting.");
    process.exit(1);
  }

  const slack = new WebClient(token);
  const auth = await slack.auth.test().catch((e) => {
    console.error("Slack token is invalid:", e?.data?.error ?? e.message);
    process.exit(1);
  });
  console.log(`Authenticated as bot "${auth!.user}" in workspace "${auth!.team}"\n`);

  const libsql = createClient({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });

  const members = await prisma.member.findMany({ orderBy: { name: "asc" } });
  let updated = 0;
  const misses: string[] = [];

  for (const m of members) {
    // Skip anything that already looks like a real Slack ID (U/W + uppercase alphanumerics)
    if (m.slackUserId && /^[UW][A-Z0-9]{6,}$/.test(m.slackUserId)) {
      console.log(`  ✓ ${m.name} already has ID ${m.slackUserId}`);
      continue;
    }
    try {
      const res = await slack.users.lookupByEmail({ email: m.email });
      const id = res.user?.id;
      if (id) {
        await prisma.member.update({ where: { id: m.id }, data: { slackUserId: id } });
        console.log(`  ✓ ${m.name} → ${id}`);
        updated++;
      } else {
        misses.push(`${m.name} <${m.email}> — no user in response`);
      }
    } catch (e: any) {
      misses.push(`${m.name} <${m.email}> — ${e?.data?.error ?? e.message}`);
    }
  }

  console.log(`\nUpdated ${updated} member(s).`);
  if (misses.length) {
    console.log(`\nCould not resolve ${misses.length} member(s):`);
    for (const line of misses) console.log(`  ✗ ${line}`);
    console.log(
      "\nThese members are not in the Slack workspace under that email.\n" +
        "Fix by inviting them to Slack with that email, or paste their member ID\n" +
        "manually in the admin UI (Slack profile → ⋯ → Copy member ID)."
    );
  }

  await prisma.$disconnect();
}

main();
