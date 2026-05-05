import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { encryptText } from "@/lib/crypto";
import { extractYouTubeId, getEmbedUrl, getThumbnailMedium, isValidYouTubeUrl } from "@/lib/youtube";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MOCK_VIDEOS, MOCK_EMBED_URLS } from "@/lib/mock-data";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const SUPABASE_CONFIGURED = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, youtubeUrl, priceSui, durationHours } = body;

    // Validate inputs
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!youtubeUrl || !isValidYouTubeUrl(youtubeUrl)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }
    if (!priceSui || priceSui <= 0) {
      return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
    }
    if (!durationHours || durationHours <= 0) {
      return NextResponse.json({ error: "Duration must be greater than 0" }, { status: 400 });
    }

    // Extract YouTube ID and build embed URL
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Could not extract YouTube video ID" }, { status: 400 });
    }

    const embedUrl = getEmbedUrl(videoId);
    const thumbnailUrl = getThumbnailMedium(videoId);

    // ENCRYPT the embed URL — never store plaintext
    const { encryptedUrl, iv, authTag } = encryptText(embedUrl);

    const videoData = {
      title: title.trim(),
      description: description?.trim() || "",
      creator_address: user.address,
      thumbnail_url: thumbnailUrl,
      encrypted_url: encryptedUrl,
      encryption_iv: iv,
      encryption_auth_tag: authTag,
      price_sui: parseFloat(priceSui),
      duration_hours: parseInt(durationHours),
    };

    if (DEV_MODE && !SUPABASE_CONFIGURED) {
      // Mock mode — store in memory
      const mockId = `mock-${Date.now()}`;
      const mockVideo = {
        id: mockId,
        ...videoData,
        created_at: new Date().toISOString(),
      };
      MOCK_VIDEOS.unshift({
        id: mockId,
        title: videoData.title,
        description: videoData.description,
        creator_address: videoData.creator_address,
        thumbnail_url: videoData.thumbnail_url,
        price_sui: videoData.price_sui,
        duration_hours: videoData.duration_hours,
        created_at: mockVideo.created_at,
      });
      MOCK_EMBED_URLS[mockId] = embedUrl;

      return NextResponse.json({
        success: true,
        videoId: mockId,
        mock: true,
      });
    }

    // Real Supabase insert
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("videos")
      .insert(videoData)
      .select("id")
      .single();

    if (error) {
      console.error("[upload] Supabase error:", error.message);
      return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
    }

    return NextResponse.json({ success: true, videoId: data.id });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
