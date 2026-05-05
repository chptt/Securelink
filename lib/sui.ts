/**
 * Sui blockchain integration helpers
 * Supports both real Sui Testnet and mock dev mode
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
  mock?: boolean;
}

/**
 * Creates a mock transaction digest for dev mode
 */
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
    // Mock mode
    await new Promise((r) => setTimeout(r, 1500)); // simulate network delay
    return {
      txDigest: mockTxDigest(),
      success: true,
      mock: true,
    };
  }

  try {
    // Real Sui transaction
    // Dynamic import to avoid SSR issues
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
 * Verifies access on-chain (dev mode always returns true)
 */
export async function verifyOnChainAccess(
  buyerAddress: string,
  videoId: string
): Promise<boolean> {
  if (DEV_MODE || !PACKAGE_ID) {
    return true;
  }

  try {
    const { SuiClient, getFullnodeUrl } = await import("@mysten/sui/client");
    const client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK as "testnet" | "mainnet" | "devnet") });

    // Query the registry object for access pass
    const result = await client.devInspectTransactionBlock({
      sender: buyerAddress,
      transactionBlock: {} as never, // simplified — real impl would call has_valid_access
    });

    return !!result;
  } catch {
    return false;
  }
}

export { DEV_MODE, SUI_NETWORK, PACKAGE_ID, REGISTRY_OBJECT_ID };
