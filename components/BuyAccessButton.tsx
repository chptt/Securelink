"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingCart, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { TransactionModal } from "./TransactionModal";
import { executeBuyAccess } from "@/lib/sui";
import { formatSui } from "@/lib/utils";

interface BuyAccessButtonProps {
  videoId: string;
  priceSui: number;
  creatorAddress: string;
  durationHours: number;
  onSuccess?: (expiresAt: string) => void;
}

export function BuyAccessButton({
  videoId,
  priceSui,
  creatorAddress,
  durationHours,
  onSuccess,
}: BuyAccessButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const address = (session?.user as { address?: string })?.address;

  const handleBuy = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setShowModal(true);

    try {
      // Step 1: Execute Sui transaction
      const txResult = await executeBuyAccess({
        videoId,
        priceInSui: priceSui,
        buyerAddress: address || "",
        creatorAddress,
      });

      setTxDigest(txResult.txDigest);

      // Step 2: Record purchase in backend
      const res = await fetch(`/api/videos/${videoId}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txDigest: txResult.txDigest }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record purchase");
      }

      toast({
        title: "Access Purchased!",
        description: `You now have ${durationHours}h access to this video.`,
        variant: "cyan" as never,
      });

      onSuccess?.(data.expiresAt);
    } catch (err) {
      console.error("[buy] Error:", err);
      toast({
        title: "Purchase Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleBuy}
        disabled={loading}
        size="lg"
        className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border-0 shadow-lg shadow-cyan-500/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Buy Access · {formatSui(priceSui)}
          </>
        )}
      </Button>

      <TransactionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        txDigest={txDigest}
        loading={loading}
        priceSui={priceSui}
        durationHours={durationHours}
        onWatch={() => {
          setShowModal(false);
          router.push(`/watch/${videoId}`);
        }}
      />
    </>
  );
}
