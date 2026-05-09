import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
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
    const { txDigest, durationHours: clientDuration } = body;

    // Use duration from client request (passed from video metadata already loaded on page)
    // Fall back to IPFS fetch only if not provided
    let durationHours = clientDuration ? parseInt(clientDuration) : 24;
    if (!clientDuration) {
      try {
        const { getVideoMetadata } = await import("@/lib/pinata");
        const meta = await getVideoMetadata(videoCid);
        durationHours = meta.duration_hours;
      } catch {
        // use default
      }
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
