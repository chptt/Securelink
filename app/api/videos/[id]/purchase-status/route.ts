import { NextRequest, NextResponse } from "next/server";
import { getPurchase } from "@/lib/purchases";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) return NextResponse.json({ purchase: null });

    const { id: videoCid } = params;
    const purchase = await getPurchase(videoCid, address);

    if (!purchase) return NextResponse.json({ purchase: null });

    const isExpired = new Date(purchase.expiresAt) < new Date();
    return NextResponse.json({
      purchase: {
        expires_at: purchase.expiresAt,
        status: isExpired ? "expired" : "active",
      },
    });
  } catch (err) {
    console.error("[purchase-status] Error:", err);
    return NextResponse.json({ purchase: null });
  }
}
