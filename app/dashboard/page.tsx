"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, ShoppingBag, ArrowUpRight, Play, Clock, Coins, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DashboardStats } from "@/components/DashboardStats";
import { EmptyState } from "@/components/EmptyState";
import { AccessBadge } from "@/components/AccessBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSui, formatDate, truncateAddress, isExpired, secondsUntil } from "@/lib/utils";
import { getTxExplorerUrl } from "@/lib/sui";

interface DashboardData {
  uploaded: any[];
  purchased: any[];
  earnings: number;
  transactions: any[];
  mock?: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const address = (session?.user as { address?: string })?.address;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "loading" || !address) return;
    fetch(`/api/dashboard/${address}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, address, router]);

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen"><Navbar />
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-20 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-screen"><Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">Dashboard</span></h1>
          <p className="text-muted-foreground text-sm font-mono">{address ? truncateAddress(address) : ""}</p>
          {data?.mock && <Badge variant="warning" className="mt-2">Dev Mode</Badge>}
        </motion.div>

        <DashboardStats
          uploadedCount={data?.uploaded?.length ?? 0}
          purchasedCount={data?.purchased?.length ?? 0}
          earnings={data?.earnings ?? 0}
          transactionCount={data?.transactions?.length ?? 0}
        />

        <div className="mt-10">
          <Tabs defaultValue="uploaded">
            <TabsList className="bg-muted/50 mb-6">
              <TabsTrigger value="uploaded">Uploaded ({data?.uploaded?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="purchased">Purchased ({data?.purchased?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="transactions">Transactions ({data?.transactions?.length ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="uploaded">
              {!data?.uploaded?.length ? (
                <EmptyState icon={Upload} title="No uploads yet" description="Upload your first video to start earning." actionLabel="Upload Video" actionHref="/upload" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.uploaded.map((v: any) => (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Link href={`/video/${v.id}`}>
                        <div className="glass glass-hover rounded-2xl overflow-hidden border border-white/5 group">
                          <div className="relative aspect-video bg-muted">
                            <Image src={v.thumbnail_url} alt={v.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                          </div>
                          <div className="p-4 space-y-2">
                            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-cyan-400 transition-colors">{v.title}</h3>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-cyan-400" />{formatSui(v.price_sui)}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{v.duration_hours}h</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDate(v.created_at)}</p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchased">
              {!data?.purchased?.length ? (
                <EmptyState icon={ShoppingBag} title="No purchases yet" description="Browse and buy access to premium videos." actionLabel="Explore Videos" actionHref="/explore" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.purchased.map((p: any) => {
                    const active = !isExpired(p.expiresAt || p.expires_at);
                    const expiresAt = p.expiresAt || p.expires_at;
                    return (
                      <motion.div key={p.objectId || p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="glass rounded-2xl overflow-hidden border border-white/5">
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                                {p.videoId ? `${p.videoId.slice(0, 16)}...` : "Unknown video"}
                              </p>
                              <AccessBadge status={active ? "active" : "expired"} remainingSeconds={active ? secondsUntil(expiresAt) : undefined} />
                            </div>
                            <p className="text-xs text-muted-foreground">Expires: {expiresAt ? formatDate(expiresAt) : "—"}</p>
                            {active && p.videoId && (
                              <Link href={`/watch/${p.videoId}`}>
                                <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400 text-sm hover:from-cyan-500/30 hover:to-violet-500/30 transition-all">
                                  <Play className="w-4 h-4" />Watch Now
                                </button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions">
              {!data?.transactions?.length ? (
                <EmptyState icon={ArrowUpRight} title="No transactions yet" description="Your on-chain transactions will appear here." />
              ) : (
                <div className="space-y-3">
                  {data.transactions.map((tx: any) => (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="glass rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.creator_address === address ? "bg-green-500/10 border border-green-500/20" : "bg-cyan-500/10 border border-cyan-500/20"}`}>
                          <ArrowUpRight className={`w-4 h-4 ${tx.creator_address === address ? "text-green-400" : "text-cyan-400"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.creator_address === address ? "Earned" : "Spent"} {formatSui(tx.amount_sui)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      {tx.tx_digest && (
                        <a href={getTxExplorerUrl(tx.tx_digest)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono">
                          {tx.tx_digest.slice(0, 8)}...<ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </main>
  );
}