/**
 * zkLogin helpers for Sui
 * Supports Google OAuth → Sui address derivation
 * Falls back to dev mode when Google credentials are not configured
 */

export const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export interface ZkLoginSession {
  address: string;
  email?: string;
  name?: string;
  image?: string;
  provider: "google" | "dev";
}

/**
 * Derives a deterministic mock Sui address from an email (dev mode only)
 */
export function devAddressFromEmail(email: string): string {
  // Simple deterministic mock — NOT cryptographically secure
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `0x${hex.repeat(8).slice(0, 64)}`;
}

/**
 * Returns a dev session for testing without Google OAuth
 */
export function getDevSession(): ZkLoginSession {
  return {
    address: "0xdev0000000000000000000000000000000000000000000000000000000000001",
    email: "dev@cipherview.local",
    name: "Dev User",
    provider: "dev",
  };
}

/**
 * Formats a Sui address for display (truncated)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validates a Sui address format
 */
export function isValidSuiAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(address);
}
