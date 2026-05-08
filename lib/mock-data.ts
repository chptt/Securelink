/**
 * Mock data for dev mode — used when Supabase is not configured
 */

import type { PublicVideo } from "./supabase";

export const MOCK_VIDEOS: PublicVideo[] = [];

export type MockPurchaseMap = Record<string, { expires_at: string; status: string }>;

// In-memory mock purchase store (resets on server restart in dev)
export const mockPurchases: MockPurchaseMap = {};

// Mock embed URLs for dev mode (these are encrypted in real mode)
export const MOCK_EMBED_URLS: Record<string, string> = {};
