"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Coins, User, ArrowLeft, Play, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LockedPlayer } from "@/components/LockedPlayer";
import { BuyAccessButton } from "@/components/BuyAccessButton";
import { AccessBadge } from "@/components/AccessBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSui, formatDate, truncateAddress, isExpired, secondsUntil } from "@/lib/utils";
import { getAddressExplorerUrl } from "@/lib/sui";
import type { PublicVideoMetadata } from "@/lib/pinata";

interface PurchaseInfo {
  expires_at: string;
  status: string;
}

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [video, setVideo] = useState<PublicVideoMetadata | null>(null);
  const [purchase, setPurchase] = useState<PurchaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const address = (session?.user as { address?: string })?.address;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/videos/${params.id}`);
        if (!res.ok) {
          router.push("/explore");
          return;
        }
        const data = await res.json();
        setVideo(data.video);

        // Check purchase status
        if (address) {
          const purchaseRes = await fetch(`/api/videos/${params.id}/purchase-status?address=${address}`);
          if (purchaseRes.ok) {
            const purchaseData = await purchaseRes.json();
            if (purchaseData.purchase) setPurchase(purchaseData.purchase);
          }
        }
      } catch (err) {
        console.error("Failed to fetch video:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, address, router]);

  const hasActivePurchase = purchase && !isExpired(purchase.expires_at);
  const hasExpiredPurchase = purchase && isExpired(purchase.expires_at);

  const accessStatus = hasActivePurchase
    ? "active"
    : hasExpiredPurchase
    ? "expired"
    : "locked";

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 space-y-6">
          <Skeleton className="aspect-video rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    );
  }

  if (!video) return null;

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Back */}
        <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player / Locked */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <LockedPlayer thumbnailUrl={video.thumbnail_url} title={video.title} />
            </motion.div>

            {/* Title + meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold">{video.title}</h1>
                <AccessBadge
                  status={accessStatus}
                  remainingSeconds={hasActivePurchase ? secondsUntil(purchase!.expires_at) : undefined}
                />
              </div>

              <p className="text-muted-foreground">{video.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <a
                    href={getAddressExplorerUrl(video.creator_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                  >
                    {truncateAddress(video.creator_address)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {video.duration_hours}h access
                </div>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">{formatSui(video.price_sui)}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Listed {formatDate(video.created_at)}
              </p>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
              <h3 className="font-semibold">Access Details</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-cyan-400 font-semibold">{formatSui(video.price_sui)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{video.duration_hours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-violet-400">Sui Testnet</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                {hasActivePurchase ? (
                  <Link href={`/watch/${video.id}`}>
                    <Button size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white border-0">
                      <Play className="w-5 h-5 mr-2" />
                      Watch Now
                    </Button>
                  </Link>
                ) : hasExpiredPurchase ? (
                  <div className="space-y-3">
                    <p className="text-xs text-red-400 text-center">Your access has expired</p>
                    <BuyAccessButton
                      videoId={video.id}
                      priceSui={video.price_sui}
                      creatorAddress={video.creator_address}
                      durationHours={video.duration_hours}
                      onSuccess={(expiresAt) => setPurchase({ expires_at: expiresAt, status: "active" })}
                    />
                  </div>
                ) : (
                  <BuyAccessButton
                    videoId={video.id}
                    priceSui={video.price_sui}
                    creatorAddress={video.creator_address}
                    durationHours={video.duration_hours}
                    onSuccess={(expiresAt) => setPurchase({ expires_at: expiresAt, status: "active" })}
                  />
                )}
              </div>
            </div>

            {/* Security note */}
            <div className="glass rounded-xl p-4 border border-cyan-500/10 text-xs text-muted-foreground space-y-1">
              <p className="text-cyan-400 font-medium">🔒 Encrypted Content</p>
              <p>This video URL is encrypted with AES-256-GCM. Decryption only occurs during playback after purchase verification.</p>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
