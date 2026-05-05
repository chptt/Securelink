"use client";

/**
 * SecureVideoPlayer — renders the decrypted embed URL in an iframe.
 *
 * SECURITY RULES:
 * - Receives embedUrl ONLY as a prop (never from localStorage or global state)
 * - Does NOT log embedUrl to console
 * - Clears state on unmount
 * - Does NOT expose embedUrl to any other component
 */

import { useEffect, useRef } from "react";
import { CountdownTimer } from "./CountdownTimer";

interface SecureVideoPlayerProps {
  embedUrl: string;
  expiresAt: string;
  onExpire?: () => void;
}

export function SecureVideoPlayer({ embedUrl, expiresAt, onExpire }: SecureVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Clear iframe src on unmount to prevent lingering access
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="flex items-center justify-between glass rounded-xl px-4 py-3 border border-white/5">
        <span className="text-sm text-muted-foreground">Access expires in:</span>
        <CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />
      </div>

      {/* Player */}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl shadow-cyan-500/10">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Secure Video Player"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        🔒 Secure playback — access expires at {new Date(expiresAt).toLocaleString()}
      </p>
    </div>
  );
}
