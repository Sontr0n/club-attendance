import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const strike = await prisma.strike.findUnique({ where: { id: params.id } });
  if (!strike) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.strike.delete({ where: { id: params.id } });
    // Renumber remaining strikes for this member so the warning/board labels stay correct.
    const remaining = await tx.strike.findMany({
      where: { memberId: strike.memberId },
      orderBy: { issuedAt: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.strike.update({
        where: { id: remaining[i].id },
        data: { number: i + 1 },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
