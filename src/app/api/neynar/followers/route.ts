import { NextRequest, NextResponse } from "next/server";
import { neynar } from "@/lib/neynar";

export async function GET(req: NextRequest) {
    try {
        const fid = req.nextUrl.searchParams.get("fid");
        const viewerFid = req.nextUrl.searchParams.get("viewerFid");
        const limit = req.nextUrl.searchParams.get("limit") || "100";
        const cursor = req.nextUrl.searchParams.get("cursor");

        if (!fid) {
            return NextResponse.json({ error: "fid is required" }, { status: 400 });
        }

        const res = await neynar.fetchUserFollowers({
            fid: Number(fid),
            viewerFid: viewerFid ? Number(viewerFid) : undefined,
            limit: Number(limit),
            cursor: cursor || undefined,
        });

        return NextResponse.json(res);
    } catch (err: unknown) {
        const error = err as Error;
        console.error("Followers API error:", error?.message ?? err);
        return NextResponse.json(
            { error: error?.message ?? "Failed to fetch followers" },
            { status: 500 }
        );
    }
}
