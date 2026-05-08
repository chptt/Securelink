import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getVideoMetadata } from "@/lib/pinata";

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
    const { txDigest, expiresAt } = body;

    // Verify the video exists on IPFS
    const meta = await getVideoMetadata(videoCid);
    if (!meta) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Purchase is recorded on-chain via Sui VideoAccessPass NFT.
    // The client already executed the Sui transaction and passes back
    // the txDigest and computed expiresAt from the blockchain result.
    // We just validate and echo back the expiry.
    if (!expiresAt) {
      // Compute expiry from video duration as fallback
      const computedExpiry = new Date(
        Date.now() + meta.duration_hours * 60 * 60 * 1000
      ).toISOString();
      return NextResponse.json({ success: true, expiresAt: computedExpiry });
    }

    return NextResponse.json({ success: true, expiresAt, txDigest });
  } catch (err) {
    console.error("[buy] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
