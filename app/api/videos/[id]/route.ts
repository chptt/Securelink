import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MOCK_VIDEOS } from "@/lib/mock-data";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const SUPABASE_CONFIGURED = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (DEV_MODE && !SUPABASE_CONFIGURED) {
      const video = MOCK_VIDEOS.find((v) => v.id === id);
      if (!video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }
      return NextResponse.json({ video, mock: true });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("videos")
      // SECURITY: never select encrypted fields in this route
      .select(
        "id, title, description, creator_address, thumbnail_url, price_sui, duration_hours, created_at"
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ video: data });
  } catch (err) {
    console.error("[video/id] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
