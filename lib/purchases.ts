/**
 * Purchase store — persists video access purchases via Pinata keyvalues.
 * Uses keyvalues only (no IPFS fetch needed for lookup).
 */

import { PinataSDK } from "pinata";

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

function getPinata() {
  return new PinataSDK({ pinataJwt: getJwt(), pinataGateway: "ipfs.io" });
}

/**
 * Store a purchase record in Pinata using the SDK.
 * All data stored in keyvalues for fast lookup — no IPFS fetch needed.
 */
export async function storePurchase(purchase: Omit<Purchase, "purchasedAt">): Promise<void> {
  const pinata = getPinata();
  const purchasedAt = new Date().toISOString();

  const file = new File(
    [JSON.stringify({ ...purchase, purchasedAt })],
    "purchase.json",
    { type: "application/json" }
  );

  await pinata.upload.public
    .file(file)
    .name(`purchase-${purchase.videoCid.slice(0, 8)}-${purchase.buyerAddress.slice(0, 8)}`)
    .keyvalues({
      type: "securelink_purchase",
      video_cid: purchase.videoCid,
      buyer: purchase.buyerAddress,
      expires_at: purchase.expiresAt,
    });
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
