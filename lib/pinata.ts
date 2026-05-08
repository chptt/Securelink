/**
 * Pinata IPFS client — stores and retrieves encrypted video metadata.
 *
 * ARCHITECTURE:
 * - Public metadata (title, description, price, thumbnail, creator, duration)
 *   is stored BOTH in Pinata keyvalues AND in the IPFS JSON.
 *   This lets us list videos instantly from Pinata without fetching IPFS.
 *
 * - Sensitive data (encrypted_url, encryption_iv, encryption_auth_tag)
 *   is stored ONLY in the IPFS JSON, fetched only at playback time.
 *
 * The IPFS CID is used as the video ID throughout the app.
 */

import { PinataSDK } from "pinata";

function getPinata() {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not set");
  return new PinataSDK({ pinataJwt: jwt, pinataGateway: "ipfs.io" });
}

export interface VideoMetadata {
  id: string; // IPFS CID
  title: string;
  description: string;
  creator_address: string;
  thumbnail_url: string;
  encrypted_url: string;
  encryption_iv: string;
  encryption_auth_tag: string;
  price_sui: number;
  duration_hours: number;
  created_at: string;
}

export type PublicVideoMetadata = Omit<
  VideoMetadata,
  "encrypted_url" | "encryption_iv" | "encryption_auth_tag"
>;

/**
 * Upload video metadata JSON to IPFS via Pinata.
 * Public fields are also stored as keyvalues for fast listing.
 * Returns the IPFS CID which becomes the video ID.
 */
export async function uploadVideoMetadata(
  data: Omit<VideoMetadata, "id">
): Promise<string> {
  const pinata = getPinata();
  const file = new File(
    [JSON.stringify(data)],
    "metadata.json",
    { type: "application/json" }
  );

  // Store public metadata in keyvalues so listing never needs IPFS fetch
  const result = await pinata.upload.public
    .file(file)
    .name(data.title)
    .keyvalues({
      type: "cipherview_video",
      creator: data.creator_address,
      created_at: data.created_at,
      title: data.title,
      description: data.description.slice(0, 200), // keyvalues have size limits
      thumbnail_url: data.thumbnail_url,
      price_sui: String(data.price_sui),
      duration_hours: String(data.duration_hours),
    });

  return result.cid;
}

/**
 * Build PublicVideoMetadata from a Pinata file entry (no IPFS fetch needed).
 */
function fileToPublicVideo(file: {
  cid: string;
  keyvalues: Record<string, string>;
}): PublicVideoMetadata | null {
  const kv = file.keyvalues;
  if (!kv.title || !kv.creator) return null;
  return {
    id: file.cid,
    title: kv.title,
    description: kv.description || "",
    creator_address: kv.creator,
    thumbnail_url: kv.thumbnail_url || "",
    price_sui: parseFloat(kv.price_sui || "0"),
    duration_hours: parseInt(kv.duration_hours || "24"),
    created_at: kv.created_at || new Date().toISOString(),
  };
}

/**
 * Fetch full video metadata JSON from IPFS by CID (used only at playback).
 */
export async function getVideoMetadata(cid: string): Promise<VideoMetadata> {
  // Try multiple gateways in order
  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
  ];

  for (const url of gateways) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        return { ...data, id: cid };
      }
    } catch {
      // try next gateway
    }
  }

  throw new Error(`Failed to fetch metadata for CID: ${cid}`);
}

/**
 * List all SecureLink videos — reads from Pinata keyvalues, NO IPFS fetch.
 * Fast and reliable for the explore page.
 */
export async function listVideos(opts?: {
  limit?: number;
}): Promise<{ videos: PublicVideoMetadata[] }> {
  const pinata = getPinata();

  const result = await pinata.files.public
    .list()
    .keyvalues({ type: "cipherview_video" })
    .limit(opts?.limit ?? 20)
    .order("DESC");

  const videos = result.files
    .map((file) => fileToPublicVideo(file as { cid: string; keyvalues: Record<string, string> }))
    .filter(Boolean) as PublicVideoMetadata[];

  return { videos };
}

/**
 * List videos by creator — reads from Pinata keyvalues, NO IPFS fetch.
 */
export async function listVideosByCreator(
  creatorAddress: string
): Promise<PublicVideoMetadata[]> {
  const pinata = getPinata();

  const result = await pinata.files.public
    .list()
    .keyvalues({ type: "cipherview_video", creator: creatorAddress })
    .limit(50)
    .order("DESC");

  return result.files
    .map((file) => fileToPublicVideo(file as { cid: string; keyvalues: Record<string, string> }))
    .filter(Boolean) as PublicVideoMetadata[];
}
