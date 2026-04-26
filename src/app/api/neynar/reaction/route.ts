import { NextRequest, NextResponse } from "next/server";
import { neynar } from "@/lib/neynar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signerUuid, reactionType, target } = body;

    if (!signerUuid || !reactionType || !target) {
      return NextResponse.json(
        { error: "signerUuid, reactionType, and target are required" },
        { status: 400 }
      );
    }

    const res = await neynar.publishReaction({
      signerUuid,
      reactionType: reactionType as "like" | "recast",
      target,
    });

    return NextResponse.json(res);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Reaction publish error:", error?.message ?? err);
    return NextResponse.json(
      { error: error?.message ?? "Failed to publish reaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { signerUuid, reactionType, target } = body;

    if (!signerUuid || !reactionType || !target) {
      return NextResponse.json(
        { error: "signerUuid, reactionType, and target are required" },
        { status: 400 }
      );
    }

    const res = await neynar.deleteReaction({
      signerUuid,
      reactionType: reactionType as "like" | "recast",
      target,
    });

    return NextResponse.json(res);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Reaction delete error:", error?.message ?? err);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete reaction" },
      { status: 500 }
    );
  }
}
