import { NextRequest, NextResponse } from "next/server";
import { neynar } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const feedType = sp.get("feedType") ?? "filter";
    const filterType = sp.get("filterType") ?? undefined;
    const channelId = sp.get("channelId") ?? undefined;
    const fid = sp.get("fid") ? Number(sp.get("fid")) : undefined;
    const cursor = sp.get("cursor") ?? undefined;
    const limit = sp.get("limit") ? Number(sp.get("limit")) : 25;
    const viewerFid = sp.get("viewerFid") ? Number(sp.get("viewerFid")) : undefined;

    const res = await neynar.fetchFeed({
      feedType: feedType as never,
      filterType: filterType as never,
      channelId,
      fid,
      fids: filterType === "fids" && fid ? [fid] : undefined,
      cursor,
      limit,
      viewerFid,
    });

    return NextResponse.json(res);
  } catch (err) {
    const error = err as Error;
    console.error("Feed API error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
