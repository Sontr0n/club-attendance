import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });

async function main() {
  console.log("Seeding…");

  const members = [
    { name: "Alex Rivera", email: "alex@example.com" },
    { name: "Brianna Chen", email: "brianna@example.com" },
    { name: "Carlos Martinez", email: "carlos@example.com" },
    { name: "Dana Kim", email: "dana@example.com" },
    { name: "Evan Patel", email: "evan@example.com" },
  ];

  for (const m of members) {
    await prisma.member.upsert({
      where: { email: m.email },
      update: {},
      create: m,
    });
  }
  console.log(`  ${members.length} members ready.`);

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  inThreeDays.setHours(19, 0, 0, 0);
  const inThreeDaysEnd = new Date(inThreeDays.getTime() + 60 * 60 * 1000);

  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  inTwoWeeks.setHours(20, 0, 0, 0);
  const inTwoWeeksEnd = new Date(inTwoWeeks.getTime() + 3 * 60 * 60 * 1000);

  await prisma.event.upsert({
    where: { id: "seed-meeting-1" },
    update: { startsAt: inThreeDays, endsAt: inThreeDaysEnd },
    create: {
      id: "seed-meeting-1",
      title: "General Meeting — Week 6",
      type: "MEETING",
      startsAt: inThreeDays,
      endsAt: inThreeDaysEnd,
      secretPassword: "bright-river-42",
    },
  });

  await prisma.event.upsert({
    where: { id: "seed-social-1" },
    update: { startsAt: inTwoWeeks, endsAt: inTwoWeeksEnd },
    create: {
      id: "seed-social-1",
      title: "Bowling Night",
      type: "SOCIAL",
      startsAt: inTwoWeeks,
      endsAt: inTwoWeeksEnd,
    },
  });

  console.log("  2 events ready.");
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
