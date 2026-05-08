export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { listVideosByCreator } from "@/lib/pinata";
import { getUserAccessPasses } from "@/lib/sui";

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address) {
      return NextResponse.json({ uploaded: [], purchased: [], earnings: 0, transactions: [] });
    }

    // Run both in parallel, handle each failure independently
    const [uploadedResult, passesResult] = await Promise.allSettled([
      listVideosByCreator(address),
      getUserAccessPasses(address),
    ]);

    const uploaded = uploadedResult.status === "fulfilled" ? uploadedResult.value : [];
    const passes = passesResult.status === "fulfilled" ? passesResult.value : [];

    if (uploadedResult.status === "rejected") {
      console.error("[dashboard] listVideosByCreator failed:", uploadedResult.reason);
    }
    if (passesResult.status === "rejected") {
      console.error("[dashboard] getUserAccessPasses failed:", passesResult.reason);
    }

    const earnings = uploaded.reduce((sum, v) => sum + (v.price_sui || 0), 0);

    return NextResponse.json({
      uploaded,
      purchased: passes,
      earnings,
      transactions: [],
    });
  } catch (err) {
    console.error("[dashboard] Error:", err);
    return NextResponse.json({
      uploaded: [],
      purchased: [],
      earnings: 0,
      transactions: [],
    });
  }
}
