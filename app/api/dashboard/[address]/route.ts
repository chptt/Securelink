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

    // Fetch in parallel: videos uploaded by this creator + access passes owned
    const [uploaded, passes] = await Promise.all([
      listVideosByCreator(address),
      getUserAccessPasses(address),
    ]);

    // Earnings = sum of price_sui for all uploaded videos that have been purchased
    // (approximation — exact earnings would require indexing on-chain events)
    const earnings = uploaded.reduce((sum, v) => sum + (v.price_sui || 0), 0);

    return NextResponse.json({
      uploaded,
      purchased: passes,
      earnings,
      transactions: [], // On-chain tx history can be fetched from Sui explorer
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
