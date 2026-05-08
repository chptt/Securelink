/**
 * Pinata IPFS client — stores and retrieves encrypted video metadata.
 *
 * Each video is stored as a JSON file on IPFS:
 * {
 *   title, description, creator_address, thumbnail_url,
 *   encrypted_url, encryption_iv, encryption_auth_tag,
 *   price_sui, duration_hours, created_at
 * }
 *
 * The IPFS CID is used as the video ID throughout the app.
 */

import { PinataSDK } from "pinata";

function getPinata() {
  const jwt = process.env.PINATA_JWT;
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  if (!jwt) throw new Error("PINATA_JWT is not set");
  if (!gateway) throw new Error("NEXT_PUBLIC_PINATA_GATEWAY is not set");
  return new PinataSDK({ pinataJwt: jwt, pinataGateway: gateway });
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
  const result = await pinata.upload.public
    .file(file)
    .name(data.title)
    .keyvalues({
      type: "cipherview_video",
      creator: data.creator_address,
      created_at: data.created_at,
    });
  return result.cid;
}

/**
 * Fetch video metadata JSON from IPFS by CID.
 */
export async function getVideoMetadata(cid: string): Promise<VideoMetadata> {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  if (!gateway) throw new Error("NEXT_PUBLIC_PINATA_GATEWAY is not set");
  const url = `https://${gateway}/ipfs/${cid}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Failed to fetch metadata for CID: ${cid}`);
  const data = await res.json();
  return { ...data, id: cid };
}

/**
 * List all CipherView videos from Pinata.
 * Filtered by keyvalue type="cipherview_video".
 */
export async function listVideos(opts?: {
  limit?: number;
}): Promise<{ videos: PublicVideoMetadata[] }> {
  const pinata = getPinata();

  const files = await pinata.files.public
    .list()
    .keyvalues({ type: "cipherview_video" })
    .limit(opts?.limit ?? 20)
    .order("DESC");

  const videos = await Promise.all(
    files.files.map(async (file) => {
      try {
        const meta = await getVideoMetadata(file.cid);
        const { encrypted_url, encryption_iv, encryption_auth_tag, ...pub } = meta;
        return pub;
      } catch {
        return null;
      }
    })
  ).then((arr) => arr.filter(Boolean) as PublicVideoMetadata[]);

  return { videos };
}

/**
 * List videos uploaded by a specific creator address.
 */
export async function listVideosByCreator(
  creatorAddress: string
): Promise<PublicVideoMetadata[]> {
  const pinata = getPinata();

  const files = await pinata.files.public
    .list()
    .keyvalues({ type: "cipherview_video", creator: creatorAddress })
    .limit(50)
    .order("DESC");

  const videos = await Promise.all(
    files.files.map(async (file) => {
      try {
        const meta = await getVideoMetadata(file.cid);
        const { encrypted_url, encryption_iv, encryption_auth_tag, ...pub } = meta;
        return pub;
      } catch {
        return null;
      }
    })
  ).then((arr) => arr.filter(Boolean) as PublicVideoMetadata[]);

  return videos;
}
