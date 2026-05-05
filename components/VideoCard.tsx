
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Lock, Clock, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatSui, truncateAddress } from "@/lib/utils";
import type { PublicVideo } from "@/lib/supabase";

interface VideoCardProps {
  video: PublicVideo;
  hasPurchase?: boolean;
  isExpired?: boolean;
}

export function VideoCard({ video, hasPurchase, isExpired }: VideoCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/video/${video.id}`}>
        <div className="glass glass-hover rounded-2xl overflow-hidden border border-white/5 group cursor-pointer">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
            {/* Lock overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-3 right-3">
              {hasPurchase && !isExpired ? (
                <Badge variant="success" className="text-xs">
                  Active
                </Badge>
              ) : isExpired ? (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              ) : (
                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
              )}
            </div>
            <div className="absolute bottom-3 left-3">
              <div className="flex items-center gap-1 text-xs text-white/80 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                <Clock className="w-3 h-3" />
                {video.duration_hours}h access
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-cyan-400 transition-colors">
              {video.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {video.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-cyan-400 font-semibold text-sm">
                <Coins className="w-4 h-4" />
                {formatSui(video.price_sui)}
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {truncateAddress(video.creator_address)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5">
      <div className="aspect-video shimmer bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer bg-muted rounded w-3/4" />
        <div className="h-3 shimmer bg-muted rounded w-full" />
        <div className="h-3 shimmer bg-muted rounded w-2/3" />
        <div className="flex justify-between">
          <div className="h-4 shimmer bg-muted rounded w-16" />
          <div className="h-3 shimmer bg-muted rounded w-20" />
        </div>
      </div>
    </div>
  );
}
