"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Shield } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Upload Video</h1>
              <p className="text-sm text-muted-foreground">
                Your YouTube URL will be encrypted before storage
              </p>
            </div>
          </div>

          {/* Security info */}
          <div className="glass rounded-xl p-4 border border-violet-500/10 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="text-violet-400 font-medium">How encryption works</p>
                <p className="text-muted-foreground text-xs">
                  1. You provide a YouTube URL<br />
                  2. We extract the video ID and build an embed URL<br />
                  3. The embed URL is encrypted with AES-256-GCM<br />
                  4. Only the encrypted data is stored — never the raw URL<br />
                  5. Decryption only happens when a buyer watches the video
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/5 p-6"
        >
          <UploadForm />
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
