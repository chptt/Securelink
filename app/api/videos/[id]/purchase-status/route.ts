import { NextRequest, NextResponse } from "next/server";
import { getUserAccessPass } from "@/lib/sui";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) return NextResponse.json({ purchase: null });

    const { id: videoCid } = params;

    // Query Sui blockchain for a valid VideoAccessPass NFT
    const pass = await getUserAccessPass(address, videoCid);
    if (!pass) return NextResponse.json({ purchase: null });

    return NextResponse.json({
      purchase: {
        expires_at: pass.expiresAt,
        status: pass.isValid ? "active" : "expired",
      },
    });
  } catch (err) {
    console.error("[purchase-status] Error:", err);
    return NextResponse.json({ purchase: null });
  }
}
