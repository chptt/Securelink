"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Chrome, User, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const HAS_GOOGLE = !!(process.env.NEXT_PUBLIC_APP_URL); // proxy check

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState("dev@cipherview.local");
  const [devName, setDevName] = useState("Dev User");
  const [error, setError] = useState("");

  if (session) {
    router.push("/explore");
    return null;
  }

  const handleGoogle = async () => {
    setLoading("google");
    setError("");
    try {
      await signIn("google", { callbackUrl: "/explore" });
    } catch {
      setError("Google sign-in failed. Check your OAuth configuration.");
      setLoading(null);
    }
  };

  const handleDevLogin = async () => {
    setLoading("dev");
    setError("");
    try {
      const result = await signIn("dev-login", {
        email: devEmail,
        name: devName,
        redirect: false,
      });
      if (result?.ok) {
        router.push("/explore");
      } else {
        setError("Dev login failed. Make sure NEXT_PUBLIC_DEV_MODE=true");
      }
    } catch {
      setError("Dev login failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="relative flex items-center justify-center min-h-screen px-4">
        {/* Background */}
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <div className="glass rounded-2xl border border-white/10 p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Welcome to CipherView</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Sign in to access encrypted video content
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Google OAuth */}
              <Button
                onClick={handleGoogle}
                disabled={!!loading}
                size="lg"
                className="w-full bg-white text-gray-900 hover:bg-gray-100 border-0 font-medium"
              >
                {loading === "google" ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Chrome className="w-5 h-5 mr-2" />
                )}
                Continue with Google (zkLogin)
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Dev Login */}
              <div className="glass rounded-xl p-4 border border-yellow-500/20 space-y-3">
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Dev Mode Login (no blockchain required)
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="devEmail" className="text-xs">Email</Label>
                    <Input
                      id="devEmail"
                      type="email"
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                      className="h-8 text-sm bg-muted/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="devName" className="text-xs">Name</Label>
                    <Input
                      id="devName"
                      value={devName}
                      onChange={(e) => setDevName(e.target.value)}
                      className="h-8 text-sm bg-muted/50"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleDevLogin}
                  disabled={!!loading}
                  size="sm"
                  variant="outline"
                  className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  {loading === "dev" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <User className="w-4 h-4 mr-2" />
                  )}
                  Dev Login
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              By signing in, you agree to use this platform responsibly.
              <br />
              zkLogin derives your Sui address from your Google account.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
