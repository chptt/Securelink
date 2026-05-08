/**
 * Mock data — kept for type compatibility, no actual mock videos.
 */

import type { PublicVideoMetadata } from "./pinata";

export const MOCK_VIDEOS: PublicVideoMetadata[] = [];

export type MockPurchaseMap = Record<string, { expires_at: string; status: string }>;

export const mockPurchases: MockPurchaseMap = {};

export const MOCK_EMBED_URLS: Record<string, string> = {};
