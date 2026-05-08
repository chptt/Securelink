/**
 * Sui blockchain integration helpers
 */

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "";
const REGISTRY_OBJECT_ID = process.env.NEXT_PUBLIC_REGISTRY_OBJECT_ID || "";

export const SUI_EXPLORER_BASE =
  SUI_NETWORK === "mainnet"
    ? "https://suiexplorer.com"
    : `https://suiexplorer.com/?network=${SUI_NETWORK}`;

export function getTxExplorerUrl(digest: string): string {
  return `${SUI_EXPLORER_BASE}/txblock/${digest}`;
}

export function getAddressExplorerUrl(address: string): string {
  return `${SUI_EXPLORER_BASE}/address/${address}`;
}

export interface BuyAccessParams {
  videoId: string;
  priceInSui: number;
  buyerAddress: string;
  creatorAddress: string;
}

export interface BuyAccessResult {
  txDigest: string;
  success: boolean;
  expiresAt?: string;
  mock?: boolean;
}

export interface AccessPass {
  objectId: string;
  videoId: string;
  expiresAt: string; // ISO string
  isValid: boolean;
}

function mockTxDigest(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Executes a buy_access transaction on Sui.
 * In dev mode, returns a mock transaction digest.
 */
export async function executeBuyAccess(
  params: BuyAccessParams,
  signAndExecute?: (tx: unknown) => Promise<{ digest: string }>
): Promise<BuyAccessResult> {
  if (DEV_MODE || !PACKAGE_ID || !signAndExecute) {
    await new Promise((r) => setTimeout(r, 1500));
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return { txDigest: mockTxDigest(), success: true, expiresAt, mock: true };
  }

  try {
    const { Transaction } = await import("@mysten/sui/transactions");
    const tx = new Transaction();
    const priceInMist = BigInt(Math.floor(params.priceInSui * 1_000_000_000));
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);
    tx.moveCall({
      target: `${PACKAGE_ID}::cipherview::buy_access`,
      arguments: [
        tx.object(REGISTRY_OBJECT_ID),
        tx.pure.string(params.videoId),
        coin,
        tx.object("0x6"), // Sui clock
      ],
    });
    const result = await signAndExecute(tx);
    return { txDigest: result.digest, success: true };
  } catch (error) {
    console.error("[sui] buy_access transaction failed:", error);
    throw error;
  }
}

/**
 * Query Sui for a user's VideoAccessPass for a specific video.
 * Returns the pass with expiry info, or null if not found.
 */
export async function getUserAccessPass(
  address: string,
  videoCid: string
): Promise<AccessPass | null> {
  if (DEV_MODE || !PACKAGE_ID) return null;

  try {
    const { SuiClient, getFullnodeUrl } = await import("@mysten/sui/client");
    const client = new SuiClient({
      url: getFullnodeUrl(SUI_NETWORK as "testnet" | "mainnet" | "devnet"),
    });

    // Fetch all VideoAccessPass objects owned by this address
    const objects = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::cipherview::VideoAccessPass`,
      },
      options: { showContent: true },
    });

    const now = Date.now();

    for (const obj of objects.data) {
      const content = obj.data?.content;
      if (content?.dataType !== "moveObject") continue;

      const fields = content.fields as Record<string, unknown>;
      const objVideoId = fields.video_id as string;
      const expiresAtMs = Number(fields.expires_at_ms);

      if (objVideoId === videoCid) {
        const expiresAt = new Date(expiresAtMs).toISOString();
        return {
          objectId: obj.data?.objectId ?? "",
          videoId: videoCid,
          expiresAt,
          isValid: expiresAtMs > now,
        };
      }
    }

    return null;
  } catch (err) {
    console.error("[sui] getUserAccessPass error:", err);
    return null;
  }
}

/**
 * Get all VideoAccessPass objects owned by an address (for dashboard).
 */
export async function getUserAccessPasses(address: string): Promise<AccessPass[]> {
  if (DEV_MODE || !PACKAGE_ID) return [];

  try {
    const { SuiClient, getFullnodeUrl } = await import("@mysten/sui/client");
    const client = new SuiClient({
      url: getFullnodeUrl(SUI_NETWORK as "testnet" | "mainnet" | "devnet"),
    });

    const objects = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::cipherview::VideoAccessPass`,
      },
      options: { showContent: true },
    });

    const now = Date.now();
    const passes: AccessPass[] = [];

    for (const obj of objects.data) {
      const content = obj.data?.content;
      if (content?.dataType !== "moveObject") continue;
      const fields = content.fields as Record<string, unknown>;
      const expiresAtMs = Number(fields.expires_at_ms);
      passes.push({
        objectId: obj.data?.objectId ?? "",
        videoId: fields.video_id as string,
        expiresAt: new Date(expiresAtMs).toISOString(),
        isValid: expiresAtMs > now,
      });
    }

    return passes;
  } catch (err) {
    console.error("[sui] getUserAccessPasses error:", err);
    return [];
  }
}

export interface RegisterVideoParams {
  videoCid: string;
  priceInSui: number;
  durationHours: number;
  creatorAddress: string;
}

/**
 * Registers a video in the Sui VideoRegistry (server-side, uses admin keypair).
 * Called after uploading metadata to IPFS.
 * In dev mode or when PACKAGE_ID is not set, this is a no-op.
 */
export async function registerVideoOnChain(params: RegisterVideoParams): Promise<void> {
  if (DEV_MODE || !PACKAGE_ID || !REGISTRY_OBJECT_ID) {
    console.log("[sui] registerVideoOnChain skipped — dev mode or no package ID");
    return;
  }

  try {
    const { SuiClient, getFullnodeUrl } = await import("@mysten/sui/client");
    const { Transaction } = await import("@mysten/sui/transactions");
    const { Ed25519Keypair } = await import("@mysten/sui/keypairs/ed25519");

    const adminKey = process.env.SUI_ADMIN_PRIVATE_KEY;
    if (!adminKey) {
      console.warn("[sui] SUI_ADMIN_PRIVATE_KEY not set — skipping on-chain registration");
      return;
    }

    const keypair = Ed25519Keypair.fromSecretKey(adminKey);
    const client = new SuiClient({
      url: getFullnodeUrl(SUI_NETWORK as "testnet" | "mainnet" | "devnet"),
    });

    const priceInMist = BigInt(Math.floor(params.priceInSui * 1_000_000_000));
    const durationMs = BigInt(params.durationHours * 60 * 60 * 1000);

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::cipherview::create_video`,
      arguments: [
        tx.object(REGISTRY_OBJECT_ID),
        tx.pure.string(params.videoCid),
        tx.pure.u64(priceInMist),
        tx.pure.u64(durationMs),
      ],
    });

    await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
  } catch (err) {
    console.error("[sui] registerVideoOnChain error:", err);
    throw err;
  }
}

export { DEV_MODE, SUI_NETWORK, PACKAGE_ID, REGISTRY_OBJECT_ID };
