import { NextRequest, NextResponse } from "next/server";
import { neynar } from "@/lib/neynar";

export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const q = sp.get("q");

        if (!q) {
            return NextResponse.json({ error: "q is required" }, { status: 400 });
        }

        const res = await neynar.searchUser({
            q,
        });

        return NextResponse.json({ users: res.result.users });
    } catch (err: unknown) {
        const error = err as Error;
        console.error("User Search API error:", error?.message ?? err);
        return NextResponse.json(
            { error: error?.message ?? "Failed to search users" },
            { status: 500 }
        );
    }
}
