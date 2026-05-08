export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { listVideosByCreator } from "@/lib/pinata";
import { getPurchasesByBuyer } from "@/lib/purchases";
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
    const [uploaded, purchases] = await Promise.allSettled([
      listVideosByCreator(address),
      getPurchasesByBuyer(address),
    ]);

    if (uploaded.status === "rejected") {
      console.error("[dashboard] listVideosByCreator failed:", uploaded.reason);
    }
    if (purchases.status === "rejected") {
      console.error("[dashboard] getPurchasesByBuyer failed:", purchases.reason);
    }

    const uploadedVideos = uploaded.status === "fulfilled" ? uploaded.value : [];
    const purchasedList = purchases.status === "fulfilled" ? purchases.value : [];
    const earnings = uploadedVideos.reduce((sum, v) => sum + (v.price_sui || 0), 0);

    return NextResponse.json({
      uploaded: uploadedVideos,
      purchased: purchasedList,
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
