export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { listVideos } from "@/lib/pinata";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search")?.toLowerCase() || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    const { videos } = await listVideos({ limit });

    const filtered = search
      ? videos.filter(
          (v) =>
            v.title.toLowerCase().includes(search) ||
            v.description.toLowerCase().includes(search)
        )
      : videos;

    return NextResponse.json({
      videos: filtered,
      total: filtered.length,
    });
  } catch (err) {
    console.error("[videos] Error:", err);
    return NextResponse.json({ videos: [], total: 0 });
  }
}
