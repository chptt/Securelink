/**
 * Pinata IPFS client — stores and retrieves encrypted video metadata.
 *
 * Public metadata is stored in Pinata keyvalues for instant listing.
 * Encrypted data is stored in IPFS JSON, fetched only at playback.
 */

import { PinataSDK } from "pinata";

const PINATA_API = "https://api.pinata.cloud/v3/files/public";

function getJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not set");
  return jwt;
}

function getPinata() {
  return new PinataSDK({ pinataJwt: getJwt(), pinataGateway: "ipfs.io" });
}

export interface VideoMetadata {
  id: string;
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

interface PinataFile {
  id: string;
  name: string;
  cid: string;
  keyvalues: Record<string, string>;
  created_at: string;
}

/**
 * Upload video metadata JSON to IPFS via Pinata.
 * Public fields stored as keyvalues for fast listing without IPFS fetch.
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

  const result = await pinata.upload.public
    .file(file)
    .name(data.title)
    .keyvalues({
      type: "cipherview_video",
      creator: data.creator_address,
      created_at: data.created_at,
      title: data.title,
      description: data.description.slice(0, 200),
      thumbnail_url: data.thumbnail_url,
      price_sui: String(data.price_sui),
      duration_hours: String(data.duration_hours),
    });

  return result.cid;
}

/**
 * Build PublicVideoMetadata from a Pinata file entry.
 */
function fileToPublicVideo(file: PinataFile): PublicVideoMetadata | null {
  const kv = file.keyvalues || {};
  if (kv.type !== "cipherview_video" || !kv.title) return null;
  return {
    id: file.cid,
    title: kv.title,
    description: kv.description || "",
    creator_address: kv.creator || "",
    thumbnail_url: kv.thumbnail_url || "",
    price_sui: parseFloat(kv.price_sui || "0"),
    duration_hours: parseInt(kv.duration_hours || "24"),
    created_at: kv.created_at || file.created_at,
  };
}

/**
 * Fetch all files from Pinata REST API directly (bypasses SDK filter issues).
 */
async function fetchAllVideoFiles(creatorFilter?: string): Promise<PinataFile[]> {
  const jwt = getJwt();
  const allFiles: PinataFile[] = [];
  let pageToken: string | null = null;

  // Fetch up to 3 pages (60 files max)
  for (let i = 0; i < 3; i++) {
    const url = new URL(PINATA_API);
    url.searchParams.set("limit", "20");
    url.searchParams.set("order", "DESC");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${jwt}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) break;
    const data = await res.json();
    const files: PinataFile[] = data.data?.files || [];

    // Filter client-side — more reliable than SDK keyvalue filter
    const videoFiles = files.filter((f) => {
      if (f.keyvalues?.type !== "cipherview_video") return false;
      if (!f.keyvalues?.title) return false;
      if (creatorFilter && f.keyvalues?.creator !== creatorFilter) return false;
      return true;
    });

    allFiles.push(...videoFiles);
    pageToken = data.data?.next_page_token || null;
    if (!pageToken || files.length < 20) break;
  }

  return allFiles;
}

/**
 * Fetch full video metadata JSON from IPFS by CID (used only at playback).
 */
export async function getVideoMetadata(cid: string): Promise<VideoMetadata> {
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
 * List all SecureLink videos — reads from Pinata REST API directly.
 */
export async function listVideos(opts?: {
  limit?: number;
}): Promise<{ videos: PublicVideoMetadata[] }> {
  const jwt = getJwt();

  const res = await fetch(
    `https://api.pinata.cloud/v3/files/public?limit=100&order=DESC`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`Pinata API error: ${res.status}`);
  const data = await res.json();

  const videos = (data.data?.files || [] as PinataFile[])
    .filter((f: PinataFile) =>
      f.keyvalues?.type === "cipherview_video" && f.keyvalues?.title
    )
    .map((f: PinataFile) => fileToPublicVideo(f))
    .filter(Boolean)
    .slice(0, opts?.limit ?? 20) as PublicVideoMetadata[];

  return { videos };
}

/**
 * List videos by creator — reads from Pinata REST API directly.
 */
export async function listVideosByCreator(
  creatorAddress: string
): Promise<PublicVideoMetadata[]> {
  const jwt = getJwt();

  const res = await fetch(
    `https://api.pinata.cloud/v3/files/public?limit=100&order=DESC`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`Pinata API error: ${res.status}`);
  const data = await res.json();

  return (data.data?.files || [] as PinataFile[])
    .filter((f: PinataFile) =>
      f.keyvalues?.type === "cipherview_video" &&
      f.keyvalues?.title &&
      f.keyvalues?.creator === creatorAddress
    )
    .map((f: PinataFile) => fileToPublicVideo(f))
    .filter(Boolean) as PublicVideoMetadata[];
}
