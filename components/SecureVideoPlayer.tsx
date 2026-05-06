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
 * - Prevents easy URL extraction via DevTools
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

  // Enhance YouTube embed URL to hide related videos and controls
  const getSecureEmbedUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      
      // For YouTube embeds, add parameters to hide related videos
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        // Use privacy-enhanced mode
        urlObj.hostname = 'www.youtube-nocookie.com';
        
        // Add parameters to hide related videos and branding
        urlObj.searchParams.set('rel', '0'); // Hide related videos at the end
        urlObj.searchParams.set('modestbranding', '1'); // Hide YouTube logo
        urlObj.searchParams.set('showinfo', '0'); // Hide video info
        urlObj.searchParams.set('controls', '1'); // Show controls but minimal
        urlObj.searchParams.set('fs', '1'); // Allow fullscreen
        urlObj.searchParams.set('iv_load_policy', '3'); // Hide annotations
        urlObj.searchParams.set('disablekb', '0'); // Keep keyboard controls for UX
        urlObj.searchParams.set('playsinline', '1'); // Play inline on mobile
        urlObj.searchParams.set('cc_load_policy', '0'); // Don't show captions by default
        urlObj.searchParams.set('autohide', '1'); // Auto-hide controls
      }
      
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return original
      return url;
    }
  };

  const secureUrl = getSecureEmbedUrl(embedUrl);

  // Prevent DevTools inspection (basic deterrent)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
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
      <div 
        className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl shadow-cyan-500/10"
        onContextMenu={(e) => e.preventDefault()}
      >
        <iframe
          ref={iframeRef}
          src={secureUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title="Secure Video Player"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          referrerPolicy="no-referrer"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        🔒 Secure playback — access expires at {new Date(expiresAt).toLocaleString()}
      </p>
    </div>
  );
}
