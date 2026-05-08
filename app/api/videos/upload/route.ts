import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { encryptText } from "@/lib/crypto";
import { extractYouTubeId, getEmbedUrl, getThumbnailMedium, isValidYouTubeUrl } from "@/lib/youtube";
import { uploadVideoMetadata } from "@/lib/pinata";
import { registerVideoOnChain } from "@/lib/sui";

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

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Could not extract YouTube video ID" }, { status: 400 });
    }

    const embedUrl = getEmbedUrl(videoId);
    const thumbnailUrl = getThumbnailMedium(videoId);

    // Step 1: Encrypt the embed URL — never store plaintext
    const { encryptedUrl, iv, authTag } = encryptText(embedUrl);

    // Step 2: Upload encrypted metadata JSON to IPFS via Pinata
    let cid: string;
    try {
      cid = await uploadVideoMetadata({
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
    } catch (pinataErr) {
      console.error("[upload] Pinata upload failed:", pinataErr);
      return NextResponse.json(
        { error: `Failed to store video metadata: ${pinataErr instanceof Error ? pinataErr.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    // Step 3: Register video on Sui blockchain (server-side, no wallet needed)
    // This creates the VideoEntry in the registry so buyers can purchase access
    try {
      await registerVideoOnChain({
        videoCid: cid,
        priceInSui: parseFloat(priceSui),
        durationHours: parseInt(durationHours),
        creatorAddress: user.address,
      });
    } catch (suiErr) {
      // Non-fatal: video is on IPFS, Sui registration can be retried
      console.error("[upload] Sui registration failed (non-fatal):", suiErr);
    }

    return NextResponse.json({ success: true, videoId: cid });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
