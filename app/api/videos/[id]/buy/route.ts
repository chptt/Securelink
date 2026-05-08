import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getVideoMetadata } from "@/lib/pinata";
import { storePurchase } from "@/lib/purchases";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: videoCid } = params;
    const body = await req.json();
    const { txDigest } = body;

    // Fetch video metadata to get duration
    let durationHours = 24;
    try {
      const meta = await getVideoMetadata(videoCid);
      durationHours = meta.duration_hours;
    } catch {
      // use default duration if IPFS fetch fails
    }

    const expiresAt = new Date(
      Date.now() + durationHours * 60 * 60 * 1000
    ).toISOString();

    // Store purchase record server-side
    await storePurchase({
      videoCid,
      buyerAddress: user.address,
      expiresAt,
      txDigest: txDigest || "mock",
    });

    return NextResponse.json({ success: true, expiresAt });
  } catch (err) {
    console.error("[buy] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
