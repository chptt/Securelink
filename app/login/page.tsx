"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Chrome, Loader2, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/explore");
    }
  }, [status, router]);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "OAuthCallback" || err === "OAuthSignin") {
      setError("Google sign-in failed. Please try again.");
    } else if (err === "Configuration") {
      setError("OAuth not configured correctly. Check environment variables.");
    } else if (err) {
      setError(`Sign-in error: ${err}`);
    }
  }, [searchParams]);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/explore" });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="relative flex items-center justify-center min-h-screen px-4">
        {/* Background effects */}
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          <div className="glass rounded-2xl border border-white/10 p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <Shield className="w-10 h-10 text-cyan-400" />
              </motion.div>
              <h1 className="text-2xl font-bold gradient-text">Welcome to CipherView</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Sign in with Google to access encrypted video content
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Google Sign In */}
            <Button
              onClick={handleGoogle}
              disabled={loading}
              size="lg"
              className="w-full bg-white text-gray-900 hover:bg-gray-100 border-0 font-medium h-12 text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin text-gray-600" />
              ) : (
                <Chrome className="w-5 h-5 mr-3" />
              )}
              {loading ? "Signing in..." : "Continue with Google"}
            </Button>

            {/* Features */}
            <div className="mt-8 space-y-3">
              {[
                { icon: Lock, text: "AES-256-GCM encrypted content" },
                { icon: Shield, text: "Sui blockchain access control" },
                { icon: Chrome, text: "zkLogin — no wallet needed" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3 h-3 text-cyan-400" />
                  </div>
                  {text}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
              By signing in, you agree to use this platform responsibly.
              <br />
              Your Google account derives a unique Sui address via zkLogin.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
