"use client";

import Image from "next/image";
import { Lock, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface LockedPlayerProps {
  thumbnailUrl: string;
  title: string;
}

export function LockedPlayer({ thumbnailUrl, title }: LockedPlayerProps) {
  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
      {/* Blurred thumbnail */}
      <div className="locked-blur absolute inset-0">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Lock icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm border border-cyan-500/30 flex items-center justify-center"
        >
          <Lock className="w-10 h-10 text-cyan-400" />
        </motion.div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Content Locked</p>
          <p className="text-white/60 text-sm mt-1">Purchase access to watch this video</p>
        </div>
        <div className="flex items-center gap-2 text-cyan-400 text-sm">
          <ShoppingCart className="w-4 h-4" />
          <span>Buy access below</span>
        </div>
      </div>
    </div>
  );
}
