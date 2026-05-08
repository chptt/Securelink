/**
 * Purchase store — persists video access purchases.
 *
 * Uses Pinata to store purchase records as JSON files on IPFS,
 * with keyvalues for fast lookup. This works across serverless
 * function instances unlike in-memory storage.
 */

export interface Purchase {
  videoCid: string;
  buyerAddress: string;
  expiresAt: string;
  txDigest: string;
  purchasedAt: string;
}

const PINATA_API = "https://api.pinata.cloud/v3/files/public";

function getJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not set");
  return jwt;
}

/**
 * Store a purchase record in Pinata.
 */
export async function storePurchase(purchase: Omit<Purchase, "purchasedAt">): Promise<void> {
  const jwt = getJwt();
  const data: Purchase = { ...purchase, purchasedAt: new Date().toISOString() };

  const file = new File(
    [JSON.stringify(data)],
    "purchase.json",
    { type: "application/json" }
  );

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", `purchase-${purchase.videoCid.slice(0, 8)}-${purchase.buyerAddress.slice(0, 8)}`);
  formData.append("keyvalues", JSON.stringify({
    type: "securelink_purchase",
    video_cid: purchase.videoCid,
    buyer: purchase.buyerAddress,
    expires_at: purchase.expiresAt,
  }));

  const res = await fetch("https://uploads.pinata.cloud/v3/files/public", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to store purchase: ${err}`);
  }
}

/**
 * Get the most recent active purchase for a video+buyer combination.
 */
export async function getPurchase(
  videoCid: string,
  buyerAddress: string
): Promise<Purchase | null> {
  const jwt = getJwt();

  // Query Pinata for purchase records matching this video+buyer
  const res = await fetch(
    `${PINATA_API}?limit=10&order=DESC`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const files = data.data?.files || [];

  // Find matching purchase
  const match = files.find((f: { keyvalues?: Record<string, string> }) =>
    f.keyvalues?.type === "securelink_purchase" &&
    f.keyvalues?.video_cid === videoCid &&
    f.keyvalues?.buyer === buyerAddress
  );

  if (!match) return null;

  // Fetch the actual purchase data from IPFS
  try {
    const ipfsRes = await fetch(`https://ipfs.io/ipfs/${match.cid}`, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!ipfsRes.ok) return null;
    return await ipfsRes.json();
  } catch {
    // If IPFS fetch fails, use keyvalues as fallback
    return {
      videoCid,
      buyerAddress,
      expiresAt: match.keyvalues.expires_at,
      txDigest: "unknown",
      purchasedAt: match.created_at,
    };
  }
}

/**
 * Get all purchases for a buyer address (for dashboard).
 */
export async function getPurchasesByBuyer(
  buyerAddress: string
): Promise<Purchase[]> {
  const jwt = getJwt();

  const res = await fetch(
    `${PINATA_API}?limit=50&order=DESC`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const files = data.data?.files || [];

  return files
    .filter((f: { keyvalues?: Record<string, string> }) =>
      f.keyvalues?.type === "securelink_purchase" &&
      f.keyvalues?.buyer === buyerAddress
    )
    .map((f: { cid: string; keyvalues: Record<string, string>; created_at: string }) => ({
      videoCid: f.keyvalues.video_cid,
      buyerAddress,
      expiresAt: f.keyvalues.expires_at,
      txDigest: "on-chain",
      purchasedAt: f.created_at,
    }));
}
