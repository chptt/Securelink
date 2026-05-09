/**
 * Purchase store — persists video access purchases via Pinata keyvalues.
 * Uses keyvalues only (no IPFS fetch needed for lookup).
 */

export interface Purchase {
  videoCid: string;
  buyerAddress: string;
  expiresAt: string;
  txDigest: string;
  purchasedAt: string;
}

const PINATA_API = "https://api.pinata.cloud/v3/files/public";
const PINATA_UPLOAD = "https://uploads.pinata.cloud/v3/files/public";

function getJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not set");
  return jwt;
}

/**
 * Store a purchase record in Pinata.
 * All data stored in keyvalues for fast lookup — no IPFS fetch needed.
 */
export async function storePurchase(purchase: Omit<Purchase, "purchasedAt">): Promise<void> {
  const jwt = getJwt();
  const purchasedAt = new Date().toISOString();

  const payload = JSON.stringify({
    videoCid: purchase.videoCid,
    buyerAddress: purchase.buyerAddress,
    expiresAt: purchase.expiresAt,
    txDigest: purchase.txDigest,
    purchasedAt,
  });

  const blob = new Blob([payload], { type: "application/json" });
  const file = new File([blob], "purchase.json", { type: "application/json" });

  const form = new FormData();
  form.append("file", file);
  form.append("name", `purchase-${purchase.videoCid.slice(0, 8)}-${purchase.buyerAddress.slice(0, 8)}`);
  // keyvalues must be a JSON string in the multipart field
  form.append("keyvalues", JSON.stringify({
    type: "securelink_purchase",
    video_cid: purchase.videoCid,
    buyer: purchase.buyerAddress,
    expires_at: purchase.expiresAt,
  }));

  const res = await fetch(PINATA_UPLOAD, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[purchases] storePurchase failed:", res.status, text);
    throw new Error(`Failed to store purchase: ${res.status}`);
  }
}

/**
 * Get the most recent purchase for a video+buyer.
 * Reads from Pinata keyvalues — no IPFS fetch.
 */
export async function getPurchase(
  videoCid: string,
  buyerAddress: string
): Promise<Purchase | null> {
  const jwt = getJwt();

  const res = await fetch(`${PINATA_API}?limit=100&order=DESC`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  const files: Array<{ keyvalues?: Record<string, string>; created_at: string }> =
    data.data?.files || [];

  const match = files.find(
    (f) =>
      f.keyvalues?.type === "securelink_purchase" &&
      f.keyvalues?.video_cid === videoCid &&
      f.keyvalues?.buyer === buyerAddress
  );

  if (!match) return null;

  return {
    videoCid,
    buyerAddress,
    expiresAt: match.keyvalues!.expires_at,
    txDigest: "on-chain",
    purchasedAt: match.created_at,
  };
}

/**
 * Get all purchases for a buyer (for dashboard).
 */
export async function getPurchasesByBuyer(
  buyerAddress: string
): Promise<Purchase[]> {
  const jwt = getJwt();

  const res = await fetch(`${PINATA_API}?limit=100&order=DESC`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  const files: Array<{ keyvalues?: Record<string, string>; created_at: string }> =
    data.data?.files || [];

  return files
    .filter(
      (f) =>
        f.keyvalues?.type === "securelink_purchase" &&
        f.keyvalues?.buyer === buyerAddress
    )
    .map((f) => ({
      videoCid: f.keyvalues!.video_cid,
      buyerAddress,
      expiresAt: f.keyvalues!.expires_at,
      txDigest: "on-chain",
      purchasedAt: f.created_at,
    }));
}
