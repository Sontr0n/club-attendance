import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { syncCalendarEvents } from "@/lib/calendar";

export async function POST() {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const result = await syncCalendarEvents();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
