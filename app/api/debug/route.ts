export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listVideos } from "@/lib/pinata";

export async function GET() {
  const jwt = process.env.PINATA_JWT;
  const hasJwt = !!jwt;
  const jwtPreview = jwt ? jwt.slice(0, 20) + "..." : "NOT SET";

  // Test raw Pinata API
  let pinataStatus = "not tested";
  let fileCount = 0;
  let rawFiles: string[] = [];
  let listVideosResult: string[] = [];
  let listVideosError = "";

  if (jwt) {
    try {
      const res = await fetch(
        "https://api.pinata.cloud/v3/files/public?limit=20",
        { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" }
      );
      const data = await res.json();
      pinataStatus = `HTTP ${res.status}`;
      fileCount = data.data?.files?.length ?? 0;
      rawFiles = (data.data?.files || []).map((f: { name: string; keyvalues: Record<string, string> }) =>
        `${f.name} | type:${f.keyvalues?.type || "none"} | title:${f.keyvalues?.title || "none"}`
      );
    } catch (e) {
      pinataStatus = `Error: ${e instanceof Error ? e.message : "unknown"}`;
    }

    // Test listVideos function
    try {
      const { videos } = await listVideos({ limit: 20 });
      listVideosResult = videos.map((v) => `${v.title} | ${v.id.slice(0, 16)}`);
    } catch (e) {
      listVideosError = e instanceof Error ? e.message : "unknown";
    }
  }

  return NextResponse.json({
    hasJwt,
    jwtPreview,
    pinataStatus,
    fileCount,
    rawFiles,
    listVideosCount: listVideosResult.length,
    listVideosResult,
    listVideosError,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE,
    },
  });
}
