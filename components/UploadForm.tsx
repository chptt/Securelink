"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload, Link as LinkIcon, DollarSign, Clock, Loader2, CheckCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { extractYouTubeId, getThumbnailMedium, isValidYouTubeUrl } from "@/lib/youtube";
import { useSignAndExecuteTransaction, useCurrentAccount, ConnectModal } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "";
const REGISTRY_OBJECT_ID = process.env.NEXT_PUBLIC_REGISTRY_OBJECT_ID || "";

export function UploadForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    priceSui: "0.5",
    durationHours: "24",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "encrypting" | "uploading" | "registering" | "done">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");
  const [showConnectModal, setShowConnectModal] = useState(false);

  const walletAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const handleUrlChange = (url: string) => {
    setForm((f) => ({ ...f, youtubeUrl: url }));
    setUrlError("");
    if (url && !isValidYouTubeUrl(url)) {
      setUrlError("Please enter a valid YouTube URL");
      setPreview(null);
      return;
    }
    if (url && isValidYouTubeUrl(url)) {
      const id = extractYouTubeId(url);
      if (id) setPreview(getThumbnailMedium(id));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidYouTubeUrl(form.youtubeUrl)) {
      setUrlError("Please enter a valid YouTube URL");
      return;
    }

    // Require wallet connection for on-chain registration
    if (!walletAccount && PACKAGE_ID) {
      setShowConnectModal(true);
      return;
    }

    setLoading(true);
    setStep("encrypting");

    try {
      // Step 1: Encrypt & upload to IPFS via Pinata
      setStep("uploading");
      const res = await fetch("/api/videos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const videoCid = data.videoId;

      // Step 2: Register video on Sui blockchain via connected wallet
      if (PACKAGE_ID && REGISTRY_OBJECT_ID && walletAccount) {
        setStep("registering");
        try {
          const tx = new Transaction();
          const priceInMist = BigInt(Math.floor(parseFloat(form.priceSui) * 1_000_000_000));
          const durationMs = BigInt(parseInt(form.durationHours) * 60 * 60 * 1000);

          tx.moveCall({
            target: `${PACKAGE_ID}::cipherview::create_video`,
            arguments: [
              tx.object(REGISTRY_OBJECT_ID),
              tx.pure.string(videoCid),
              tx.pure.u64(priceInMist),
              tx.pure.u64(durationMs),
            ],
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await signAndExecute({ transaction: tx as any });
        } catch (suiErr) {
          console.error("[upload] On-chain registration failed:", suiErr);
          // Non-fatal — video is on IPFS, can be registered later
          toast({
            title: "Warning",
            description: "Video uploaded but on-chain registration failed. Buyers may not be able to purchase yet.",
            variant: "destructive",
          });
        }
      }

      setStep("done");
      toast({
        title: "Video Uploaded!",
        description: "Your video has been encrypted, stored on IPFS, and registered on Sui.",
        variant: "cyan" as never,
      });

      router.push(`/video/${videoCid}`);
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const stepLabel = {
    idle: "Encrypt & List Video",
    encrypting: "Encrypting...",
    uploading: "Uploading to IPFS...",
    registering: "Registering on Sui...",
    done: "Done!",
  }[step];

  return (
    <>
      <ConnectModal
        trigger={<span />}
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wallet status */}
        {PACKAGE_ID && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-xs border ${
            walletAccount
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          }`}>
            <Wallet className="w-4 h-4 flex-shrink-0" />
            {walletAccount
              ? `Wallet connected: ${walletAccount.address.slice(0, 10)}...`
              : "Connect your Slush wallet to register the video on-chain"}
            {!walletAccount && (
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="ml-auto underline"
              >
                Connect
              </button>
            )}
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Video Title *</Label>
          <Input
            id="title"
            placeholder="Enter a compelling title..."
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="bg-muted/50"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            placeholder="Describe what viewers will learn..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        {/* YouTube URL */}
        <div className="space-y-2">
          <Label htmlFor="youtubeUrl">YouTube URL *</Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="youtubeUrl"
              placeholder="https://youtube.com/watch?v=..."
              value={form.youtubeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              required
              className={`pl-10 bg-muted/50 ${urlError ? "border-red-500" : ""}`}
            />
          </div>
          {urlError && <p className="text-xs text-red-400">{urlError}</p>}
          <p className="text-xs text-muted-foreground">
            The URL will be encrypted before storage. Raw link is never shown.
          </p>
        </div>

        {/* Thumbnail Preview */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl overflow-hidden border border-white/10"
          >
            <div className="relative aspect-video">
              <Image src={preview} alt="Thumbnail preview" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-white/80 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Thumbnail detected
              </div>
            </div>
          </motion.div>
        )}

        {/* Price + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (SUI) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.50"
                value={form.priceSui}
                onChange={(e) => setForm((f) => ({ ...f, priceSui: e.target.value }))}
                required
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Access Duration (hours) *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="duration"
                type="number"
                min="1"
                max="8760"
                placeholder="24"
                value={form.durationHours}
                onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value }))}
                required
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="glass rounded-xl p-4 border border-cyan-500/10 text-xs text-muted-foreground space-y-1">
          <p className="text-cyan-400 font-medium">🔒 Security Notice</p>
          <p>Your YouTube URL will be encrypted with AES-256-GCM before storage.</p>
          <p>The raw URL is never stored or logged. Decryption only occurs at playback time.</p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {stepLabel}
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Encrypt & List Video
            </>
          )}
        </Button>
      </form>
    </>
  );
}
