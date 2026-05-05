/**
 * CRITICAL SECURITY ENDPOINT
 * This is the ONLY place where decryption occurs.
 * 
 * Rules:
 * - Verify user is authenticated
 * - Verify purchase exists and is not expired
 * - Decrypt embed URL
 * - Return embed URL ONLY in this response
 * - NEVER log the decrypted URL
 * - NEVER store the decrypted URL
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { decryptText } from "@/lib/crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MOCK_VIDEOS, MOCK_EMBED_URLS, mockPurchases } from "@/lib/mock-data";
import { secondsUntil } from "@/lib/utils";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const SUPABASE_CONFIGURED = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Step 1: Verify authentication
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: videoId } = params;

    if (DEV_MODE && !SUPABASE_CONFIGURED) {
      // Mock mode
      const video = MOCK_VIDEOS.find((v) => v.id === videoId);
      if (!video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      const purchaseKey = `${user.address}:${videoId}`;
      const purchase = mockPurchases[purchaseKey];

      if (!purchase) {
        return NextResponse.json({ error: "No active purchase found" }, { status: 403 });
      }

      if (new Date(purchase.expires_at) < new Date()) {
        return NextResponse.json({ error: "Access has expired" }, { status: 403 });
      }

      const embedUrl = MOCK_EMBED_URLS[videoId];
      if (!embedUrl) {
        return NextResponse.json({ error: "Video not available" }, { status: 404 });
      }

      const remaining = secondsUntil(purchase.expires_at);

      // Return embed URL — this is the ONLY place it's exposed
      return NextResponse.json({
        embedUrl,
        expiresAt: purchase.expires_at,
        remainingSeconds: remaining,
        mock: true,
      });
    }

    const supabase = getSupabaseAdmin();

    // Step 2: Verify purchase exists and is active
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("id, expires_at, status")
      .eq("video_id", videoId)
      .eq("buyer_address", user.address)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: "No active purchase found. Please purchase access first." },
        { status: 403 }
      );
    }

    // Step 3: Fetch encrypted video data
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("encrypted_url, encryption_iv, encryption_auth_tag")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Step 4: DECRYPT — only happens here
    let embedUrl: string;
    try {
      embedUrl = decryptText(
        video.encrypted_url,
        video.encryption_iv,
        video.encryption_auth_tag
      );
    } catch {
      console.error("[play] Decryption failed for video:", videoId);
      return NextResponse.json({ error: "Failed to decrypt video" }, { status: 500 });
    }

    const remaining = secondsUntil(purchase.expires_at);

    // Step 5: Return embed URL — NEVER log it
    return NextResponse.json({
      embedUrl,
      expiresAt: purchase.expires_at,
      remainingSeconds: remaining,
    });
  } catch (err) {
    console.error("[play] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
