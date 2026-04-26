import { NextRequest, NextResponse } from "next/server";
import { neynar } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  try {
    const fid = req.nextUrl.searchParams.get("fid");
    const viewerFid = req.nextUrl.searchParams.get("viewerFid");

    if (!fid) {
      return NextResponse.json({ error: "fid is required" }, { status: 400 });
    }

    const res = await neynar.fetchBulkUsers({
      fids: [Number(fid)],
      viewerFid: viewerFid ? Number(viewerFid) : undefined,
    });

    const user = res.users?.[0] ?? null;

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("User API error:", error?.message ?? err);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch user" },
      { status: 500 }
    );
  }
}
