export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MOCK_VIDEOS } from "@/lib/mock-data";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const SUPABASE_CONFIGURED = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (DEV_MODE && !SUPABASE_CONFIGURED) {
      let videos = [...MOCK_VIDEOS];
      if (search) {
        const q = search.toLowerCase();
        videos = videos.filter(
          (v) =>
            v.title.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q)
        );
      }
      return NextResponse.json({
        videos: videos.slice(offset, offset + limit),
        total: videos.length,
        mock: true,
      });
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("videos")
      .select(
        "id, title, description, creator_address, thumbnail_url, price_sui, duration_hours, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[videos] Supabase error:", error.message);
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
    }

    return NextResponse.json({ videos: data || [], total: count || 0 });
  } catch (err) {
    console.error("[videos] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
