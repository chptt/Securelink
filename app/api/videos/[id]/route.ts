import { NextRequest, NextResponse } from "next/server";
import { getVideoMetadata } from "@/lib/pinata";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meta = await getVideoMetadata(params.id);
    // Never return encrypted fields to the client
    const { encrypted_url, encryption_iv, encryption_auth_tag, ...pub } = meta;
    return NextResponse.json({ video: pub });
  } catch (err) {
    console.error("[video/id] Error:", err);
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
}
