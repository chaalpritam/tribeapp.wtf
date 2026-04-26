import { NextRequest, NextResponse } from "next/server";
import { neynar } from "@/lib/neynar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signerUuid, text, embeds, channelId, parent } = body;

    if (!signerUuid || !text) {
      return NextResponse.json(
        { error: "signerUuid and text are required" },
        { status: 400 }
      );
    }

    const res = await neynar.publishCast({
      signerUuid,
      text,
      embeds: embeds ?? undefined,
      channelId: channelId ?? undefined,
      parent: parent ?? undefined,
    });

    return NextResponse.json(res);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Cast publish error:", error?.message ?? err);
    return NextResponse.json(
      { error: error?.message ?? "Failed to publish cast" },
      { status: 500 }
    );
  }
}
