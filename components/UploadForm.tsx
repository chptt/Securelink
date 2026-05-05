"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload, Link as LinkIcon, DollarSign, Clock, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { extractYouTubeId, getThumbnailMedium, isValidYouTubeUrl } from "@/lib/youtube";

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
  const [preview, setPreview] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");

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

    setLoading(true);
    try {
      const res = await fetch("/api/videos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast({
        title: "Video Uploaded!",
        description: "Your video has been encrypted and listed.",
        variant: "cyan" as never,
      });

      router.push(`/video/${data.videoId}`);
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            Encrypting & Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Encrypt & List Video
          </>
        )}
      </Button>
    </form>
  );
}
