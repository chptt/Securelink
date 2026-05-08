import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { encryptText } from "@/lib/crypto";
import { extractYouTubeId, getEmbedUrl, getThumbnailMedium, isValidYouTubeUrl } from "@/lib/youtube";
import { uploadVideoMetadata } from "@/lib/pinata";

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

    // Encrypt the embed URL — never store plaintext
    const { encryptedUrl, iv, authTag } = encryptText(embedUrl);

    // Upload metadata JSON to IPFS via Pinata
    // The returned CID becomes the video ID
    const cid = await uploadVideoMetadata({
      title: title.trim(),
      description: description?.trim() || "",
      creator_address: user.address,
      thumbnail_url: thumbnailUrl,
      encrypted_url: encryptedUrl,
      encryption_iv: iv,
      encryption_auth_tag: authTag,
      price_sui: parseFloat(priceSui),
      duration_hours: parseInt(durationHours),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, videoId: cid });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
