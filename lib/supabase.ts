import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Public client (for client-side use)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Admin client (server-side only — bypasses RLS)
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase admin credentials not configured");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// Types matching the DB schema
export interface Video {
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

export interface Purchase {
  id: string;
  video_id: string;
  buyer_address: string;
  purchased_at: string;
  expires_at: string;
  status: "active" | "expired";
}

export interface Transaction {
  id: string;
  video_id: string;
  buyer_address: string;
  creator_address: string;
  tx_digest: string;
  amount_sui: number;
  created_at: string;
}

// Public video metadata (never includes encrypted fields)
export type PublicVideo = Omit<Video, "encrypted_url" | "encryption_iv" | "encryption_auth_tag">;
