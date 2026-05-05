import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MOCK_VIDEOS, mockPurchases } from "@/lib/mock-data";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const SUPABASE_CONFIGURED = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow users to view their own dashboard
    if (user.address.toLowerCase() !== params.address.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (DEV_MODE && !SUPABASE_CONFIGURED) {
      // Mock dashboard data
      const uploaded = MOCK_VIDEOS.filter(
        (v) => v.creator_address === user.address
      );

      const purchased = Object.entries(mockPurchases)
        .filter(([key]) => key.startsWith(user.address))
        .map(([key, purchase]) => {
          const videoId = key.split(":")[1];
          const video = MOCK_VIDEOS.find((v) => v.id === videoId);
          return video
            ? {
                video,
                expires_at: purchase.expires_at,
                status: new Date(purchase.expires_at) > new Date() ? "active" : "expired",
              }
            : null;
        })
        .filter(Boolean);

      return NextResponse.json({
        uploaded,
        purchased,
        earnings: uploaded.reduce((sum, v) => sum + v.price_sui * 0, 0), // mock 0 earnings
        transactions: [],
        mock: true,
      });
    }

    const supabase = getSupabaseAdmin();

    // Uploaded videos — public fields only
    const { data: uploaded } = await supabase
      .from("videos")
      .select("id, title, description, thumbnail_url, price_sui, duration_hours, created_at")
      .eq("creator_address", user.address)
      .order("created_at", { ascending: false });

    // Purchased videos with video metadata
    const { data: purchases } = await supabase
      .from("purchases")
      .select(
        `id, expires_at, status, purchased_at,
         videos:video_id (id, title, thumbnail_url, price_sui, duration_hours)`
      )
      .eq("buyer_address", user.address)
      .order("purchased_at", { ascending: false });

    // Transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, video_id, tx_digest, amount_sui, created_at, buyer_address, creator_address")
      .or(`buyer_address.eq.${user.address},creator_address.eq.${user.address}`)
      .order("created_at", { ascending: false })
      .limit(20);

    // Calculate earnings
    const { data: earningsData } = await supabase
      .from("transactions")
      .select("amount_sui")
      .eq("creator_address", user.address);

    const earnings = (earningsData || []).reduce(
      (sum, t) => sum + (t.amount_sui || 0),
      0
    );

    return NextResponse.json({
      uploaded: uploaded || [],
      purchased: purchases || [],
      earnings,
      transactions: transactions || [],
    });
  } catch (err) {
    console.error("[dashboard] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
