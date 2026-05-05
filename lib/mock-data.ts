/**
 * Mock data for dev mode — used when Supabase is not configured
 */

import type { PublicVideo } from "./supabase";

export const MOCK_VIDEOS: PublicVideo[] = [
  {
    id: "mock-1",
    title: "Introduction to Sui Blockchain",
    description: "A comprehensive guide to building on Sui — covering Move language, objects, and transactions.",
    creator_address: "0xabc1000000000000000000000000000000000000000000000000000000000001",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    price_sui: 0.5,
    duration_hours: 24,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "mock-2",
    title: "zkLogin Deep Dive",
    description: "Learn how zkLogin enables Web2-style authentication on Sui using zero-knowledge proofs.",
    creator_address: "0xabc2000000000000000000000000000000000000000000000000000000000002",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    price_sui: 1.0,
    duration_hours: 48,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "mock-3",
    title: "DeFi on Sui: Advanced Patterns",
    description: "Explore advanced DeFi patterns including AMMs, lending protocols, and yield strategies on Sui.",
    creator_address: "0xabc3000000000000000000000000000000000000000000000000000000000003",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    price_sui: 2.0,
    duration_hours: 72,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "mock-4",
    title: "NFT Marketplace Development",
    description: "Build a full NFT marketplace on Sui from scratch — minting, listing, and trading.",
    creator_address: "0xabc1000000000000000000000000000000000000000000000000000000000001",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    price_sui: 1.5,
    duration_hours: 24,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "mock-5",
    title: "Move Language Masterclass",
    description: "Master the Move programming language — types, abilities, generics, and security patterns.",
    creator_address: "0xabc4000000000000000000000000000000000000000000000000000000000004",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    price_sui: 3.0,
    duration_hours: 168,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "mock-6",
    title: "Web3 Frontend with Sui SDK",
    description: "Connect your React app to Sui — wallets, transactions, and real-time state.",
    creator_address: "0xabc2000000000000000000000000000000000000000000000000000000000002",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    price_sui: 0.75,
    duration_hours: 24,
    created_at: new Date().toISOString(),
  },
];

export type MockPurchaseMap = Record<string, { expires_at: string; status: string }>;

// In-memory mock purchase store (resets on server restart in dev)
export const mockPurchases: MockPurchaseMap = {};

// Mock embed URLs for dev mode (these are encrypted in real mode)
export const MOCK_EMBED_URLS: Record<string, string> = {
  "mock-1": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
  "mock-2": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
  "mock-3": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
  "mock-4": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
  "mock-5": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
  "mock-6": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
};
