"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { TransactionModal } from "./TransactionModal";
import { formatSui } from "@/lib/utils";
import { useSignAndExecuteTransaction, useCurrentAccount, ConnectModal } from "@mysten/dapp-kit";

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "";
const REGISTRY_OBJECT_ID = process.env.NEXT_PUBLIC_REGISTRY_OBJECT_ID || "";

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
  const [showConnectModal, setShowConnectModal] = useState(false);

  const walletAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const handleBuy = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    // If no wallet connected, prompt to connect
    if (!walletAccount) {
      setShowConnectModal(true);
      return;
    }

    setLoading(true);
    setShowModal(true);

    try {
      let digest = "";

      if (PACKAGE_ID && REGISTRY_OBJECT_ID) {
        // Use @mysten/sui Transaction — cast to avoid version mismatch type error
        const { Transaction } = await import("@mysten/sui/transactions");
        const tx = new Transaction();
        const priceInMist = BigInt(Math.floor(priceSui * 1_000_000_000));
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);
        tx.moveCall({
          target: `${PACKAGE_ID}::cipherview::buy_access`,
          arguments: [
            tx.object(REGISTRY_OBJECT_ID),
            tx.pure.string(videoId),
            coin,
            tx.object("0x6"),
          ],
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await signAndExecute({ transaction: tx as any });
        digest = result.digest;
      } else {
        // Dev mode — no contract deployed, simulate
        await new Promise((r) => setTimeout(r, 1000));
        digest = "dev-" + Math.random().toString(36).slice(2);
      }

      setTxDigest(digest);

      // Record purchase in backend
      const res = await fetch(`/api/videos/${videoId}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txDigest: digest, durationHours }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record purchase");

      toast({
        title: "Access Purchased!",
        description: `You now have ${durationHours}h access to this video.`,
        variant: "cyan" as never,
      });

      onSuccess?.(data.expiresAt);
    } catch (err) {
      console.error("[buy] Error:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Purchase Failed",
        description: msg,
        variant: "destructive",
      });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ConnectModal
        trigger={<span />}
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
      />

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
        ) : !walletAccount ? (
          <>
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet · {formatSui(priceSui)}
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
