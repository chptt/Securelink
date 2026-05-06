"use client";

/**
 * SecureVideoPlayer — renders the decrypted embed URL in an iframe.
 *
 * SECURITY RULES:
 * - Receives embedUrl ONLY as a prop (never from localStorage or global state)
 * - Does NOT log embedUrl to console
 * - Clears state on unmount
 * - Does NOT expose embedUrl to any other component
 * - Hides related videos and YouTube branding
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

  // Add YouTube params to hide related videos — keep original domain to avoid Error 153
  const getSecureEmbedUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);

      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        // Keep youtube.com — switching to youtube-nocookie.com causes Error 153
        // when video owners restrict third-party embeds
        urlObj.searchParams.set("rel", "0");           // No related videos at end
        urlObj.searchParams.set("modestbranding", "1"); // Minimal YouTube branding
        urlObj.searchParams.set("showinfo", "0");       // Hide title bar
        urlObj.searchParams.set("iv_load_policy", "3"); // No annotations
        urlObj.searchParams.set("playsinline", "1");    // Inline on mobile
        urlObj.searchParams.set("cc_load_policy", "0"); // No captions by default
      }

      return urlObj.toString();
    } catch {
      return url;
    }
  };

  const secureUrl = getSecureEmbedUrl(embedUrl);

  // Block right-click on the player wrapper
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="flex items-center justify-between glass rounded-xl px-4 py-3 border border-white/5">
        <span className="text-sm text-muted-foreground">Access expires in:</span>
        <CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />
      </div>

      {/* Player */}
      <div
        className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl shadow-cyan-500/10"
        onContextMenu={handleContextMenu}
      >
        <iframe
          ref={iframeRef}
          src={secureUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Secure Video Player"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        🔒 Secure playback — access expires at {new Date(expiresAt).toLocaleString()}
      </p>
    </div>
  );
}
