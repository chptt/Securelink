/**
 * CRITICAL SECURITY ENDPOINT
 * This is the ONLY place where decryption occurs.
 *
 * Rules:
 * - Verify user is authenticated
 * - Verify purchase exists and is not expired
 * - Fetch encrypted metadata from IPFS
 * - Decrypt embed URL server-side
 * - Return embed URL ONLY in this response
 * - NEVER log the decrypted URL
 * - NEVER store the decrypted URL
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { decryptText } from "@/lib/crypto";
import { getVideoMetadata } from "@/lib/pinata";
import { getPurchase } from "@/lib/purchases";
import { secondsUntil } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Step 1: Verify authentication
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: videoCid } = params;

    // Step 2: Verify purchase exists and is not expired
    const purchase = await getPurchase(videoCid, user.address);
    if (!purchase) {
      return NextResponse.json(
        { error: "No active purchase found. Please purchase access first." },
        { status: 403 }
      );
    }

    if (new Date(purchase.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Your access has expired. Please purchase again." },
        { status: 403 }
      );
    }

    // Step 3: Fetch encrypted metadata from IPFS
    const meta = await getVideoMetadata(videoCid);
    if (!meta) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Step 4: DECRYPT — only happens here, never logged
    let embedUrl: string;
    try {
      embedUrl = decryptText(
        meta.encrypted_url,
        meta.encryption_iv,
        meta.encryption_auth_tag
      );
    } catch {
      console.error("[play] Decryption failed for video:", videoCid);
      return NextResponse.json({ error: "Failed to decrypt video" }, { status: 500 });
    }

    const remaining = secondsUntil(purchase.expiresAt);

    // Step 5: Return embed URL — NEVER log it
    return NextResponse.json({
      embedUrl,
      expiresAt: purchase.expiresAt,
      remainingSeconds: remaining,
    });
  } catch (err) {
    console.error("[play] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
