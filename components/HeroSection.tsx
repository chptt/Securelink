"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Lock, Zap, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Lock,
    title: "AES-256-GCM Encryption",
    description: "Video URLs encrypted at rest. Decryption only at playback time.",
    color: "cyan",
  },
  {
    icon: Shield,
    title: "Sui Blockchain Access",
    description: "Purchase access via Sui Testnet. Ownership verified on-chain.",
    color: "violet",
  },
  {
    icon: Zap,
    title: "zkLogin Authentication",
    description: "Sign in with Google. Get a Sui address. No wallet needed.",
    color: "cyan",
  },
];

const steps = [
  { step: "01", title: "Connect", desc: "Sign in with Google via zkLogin" },
  { step: "02", title: "Explore", desc: "Browse encrypted video content" },
  { step: "03", title: "Purchase", desc: "Buy time-limited access with SUI" },
  { step: "04", title: "Watch", desc: "Stream securely inside the platform" },
];

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 text-cyan-400 text-sm mb-8"
          >
            <Shield className="w-4 h-4" />
            Powered by Sui Testnet + zkLogin
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Encrypted Video</span>
            <br />
            <span className="gradient-text glow-text-cyan">Access Marketplace</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Creators upload. Buyers purchase time-limited access. Videos stay encrypted
            until the moment of playback — secured by blockchain and AES-256-GCM.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/explore">
              <Button size="xl" className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold hover:from-cyan-400 hover:to-cyan-300 shadow-lg shadow-cyan-500/25 group">
                <Play className="w-5 h-5 mr-2" />
                Explore Videos
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="xl" variant="cyber">
                <Lock className="w-5 h-5 mr-2" />
                Upload & Earn
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { label: "Encrypted", value: "AES-256" },
            { label: "Network", value: "Sui" },
            { label: "Auth", value: "zkLogin" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center glass rounded-xl p-4 border border-white/5">
              <div className="text-xl font-bold gradient-text">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            Built for <span className="gradient-text">Security</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every layer of the stack is designed to protect content and verify access.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass glass-hover rounded-2xl p-6 border border-white/5"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                feature.color === "cyan"
                  ? "bg-cyan-500/10 border border-cyan-500/20"
                  : "bg-violet-500/10 border border-violet-500/20"
              }`}>
                <feature.icon className={`w-6 h-6 ${
                  feature.color === "cyan" ? "text-cyan-400" : "text-violet-400"
                }`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl glass border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold gradient-text">{step.step}</span>
              </div>
              <h3 className="font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
