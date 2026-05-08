export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const jwt = process.env.PINATA_JWT;
  const hasJwt = !!jwt;
  const jwtPreview = jwt ? jwt.slice(0, 20) + "..." : "NOT SET";

  // Test Pinata API directly
  let pinataStatus = "not tested";
  let fileCount = 0;
  let files: string[] = [];

  if (jwt) {
    try {
      const res = await fetch(
        "https://api.pinata.cloud/v3/files/public?limit=20",
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      const data = await res.json();
      pinataStatus = `HTTP ${res.status}`;
      fileCount = data.data?.files?.length ?? 0;
      files = (data.data?.files || []).map((f: { name: string; keyvalues: Record<string, string> }) =>
        `${f.name} | type:${f.keyvalues?.type || "none"} | title:${f.keyvalues?.title || "none"}`
      );
    } catch (e) {
      pinataStatus = `Error: ${e instanceof Error ? e.message : "unknown"}`;
    }
  }

  return NextResponse.json({
    hasJwt,
    jwtPreview,
    pinataStatus,
    fileCount,
    files,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE,
    },
  });
}
