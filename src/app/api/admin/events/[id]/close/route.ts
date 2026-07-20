import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { closeEvent } from "@/lib/closeEvent";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const result = await closeEvent(params.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to close event." },
      { status: 500 }
    );
  }
}
