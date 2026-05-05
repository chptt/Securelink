import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MOCK_VIDEOS, mockPurchases } from "@/lib/mock-data";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const SUPABASE_CONFIGURED = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: videoId } = params;
    const body = await req.json();
    const { txDigest } = body;

    if (DEV_MODE && !SUPABASE_CONFIGURED) {
      // Mock mode
      const video = MOCK_VIDEOS.find((v) => v.id === videoId);
      if (!video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      const expiresAt = new Date(
        Date.now() + video.duration_hours * 60 * 60 * 1000
      ).toISOString();

      const purchaseKey = `${user.address}:${videoId}`;
      mockPurchases[purchaseKey] = {
        expires_at: expiresAt,
        status: "active",
      };

      return NextResponse.json({
        success: true,
        expiresAt,
        mock: true,
      });
    }

    const supabase = getSupabaseAdmin();

    // Get video to determine duration
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("id, duration_hours, price_sui, creator_address")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check for existing active purchase
    const { data: existing } = await supabase
      .from("purchases")
      .select("id, expires_at")
      .eq("video_id", videoId)
      .eq("buyer_address", user.address)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        expiresAt: existing.expires_at,
        alreadyOwned: true,
      });
    }

    const expiresAt = new Date(
      Date.now() + video.duration_hours * 60 * 60 * 1000
    ).toISOString();

    // Record purchase
    const { error: purchaseError } = await supabase.from("purchases").insert({
      video_id: videoId,
      buyer_address: user.address,
      expires_at: expiresAt,
      status: "active",
    });

    if (purchaseError) {
      console.error("[buy] Purchase insert error:", purchaseError.message);
      return NextResponse.json({ error: "Failed to record purchase" }, { status: 500 });
    }

    // Record transaction
    if (txDigest) {
      await supabase.from("transactions").insert({
        video_id: videoId,
        buyer_address: user.address,
        creator_address: video.creator_address,
        tx_digest: txDigest,
        amount_sui: video.price_sui,
      });
    }

    return NextResponse.json({ success: true, expiresAt });
  } catch (err) {
    console.error("[buy] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
