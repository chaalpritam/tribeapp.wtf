import { NextRequest, NextResponse } from "next/server";
import { neynar } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q");
    const cursor = sp.get("cursor") ?? undefined;
    const limit = sp.get("limit") ? Number(sp.get("limit")) : 25;

    if (!q) {
      return NextResponse.json({ error: "q is required" }, { status: 400 });
    }

    const res = await neynar.searchCasts({
      q,
      limit,
      cursor,
    });

    return NextResponse.json(res);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Search API error:", error?.message ?? err);
    return NextResponse.json(
      { error: error?.message ?? "Failed to search casts" },
      { status: 500 }
    );
  }
}
