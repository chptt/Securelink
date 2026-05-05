"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";
import { Button } from "@/components/ui/button";

interface PlayResponse {
  embedUrl: string;
  expiresAt: string;
  remainingSeconds: number;
  mock?: boolean;
}

export default function WatchPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [playData, setPlayData] = useState<PlayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "loading") return;
    requestPlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const requestPlay = async () => {
    setLoading(true);
    setError("");
    setExpired(false);
    try {
      const res = await fetch(`/api/videos/${params.id}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Access denied"); return; }
      // embedUrl passed directly to SecureVideoPlayer — never stored elsewhere
      setPlayData(data);
    } catch {
      setError("Failed to load video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = () => { setExpired(true); setPlayData(null); };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <Link href={`/video/${params.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />Back to Details
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-10 h-10 text-cyan-400" />
            </motion.div>
            <p className="text-muted-foreground text-sm">Verifying access and decrypting...</p>
          </div>
        )}

        {!loading && error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/video/${params.id}`}><Button variant="cyber">Purchase Access</Button></Link>
              <Button variant="outline" onClick={requestPlay}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
            </div>
          </motion.div>
        )}

        {!loading && expired && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Access Expired</h2>
              <p className="text-muted-foreground text-sm">Your viewing window has ended.</p>
            </div>
            <Link href={`/video/${params.id}`}>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white border-0">Renew Access</Button>
            </Link>
          </motion.div>
        )}

        {!loading && !error && !expired && playData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <SecureVideoPlayer embedUrl={playData.embedUrl} expiresAt={playData.expiresAt} onExpire={handleExpire} />
            {playData.mock && (
              <p className="text-xs text-yellow-400/60 text-center mt-3">Dev mode — mock video playing</p>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}