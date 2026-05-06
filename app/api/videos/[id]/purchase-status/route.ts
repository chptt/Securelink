import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MOCK_VIDEOS, mockPurchases } from "@/lib/mock-data";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const SUPABASE_CONFIGURED = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get("address");
    if (!address) return NextResponse.json({ purchase: null });
    const { id: videoId } = params;
    if (DEV_MODE && !SUPABASE_CONFIGURED) {
      const key = `${address}:${videoId}`;
      const purchase = mockPurchases[key] || null;
      return NextResponse.json({ purchase });
    }
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("purchases")
      .select("id, expires_at, status, purchased_at")
      .eq("video_id", videoId)
      .eq("buyer_address", address)
      .order("purchased_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ purchase: data || null });
  } catch {
    return NextResponse.json({ purchase: null });
  }
}