"use client";

import { motion } from "framer-motion";
import { CheckCircle, Loader2, ExternalLink, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTxExplorerUrl } from "@/lib/sui";
import { formatSui } from "@/lib/utils";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  txDigest: string | null;
  loading: boolean;
  priceSui: number;
  durationHours: number;
  onWatch: () => void;
}

export function TransactionModal({
  open,
  onClose,
  txDigest,
  loading,
  priceSui,
  durationHours,
  onWatch,
}: TransactionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">
            {loading ? "Processing Transaction" : "Access Granted!"}
          </DialogTitle>
          <DialogDescription>
            {loading ? "Submitting your purchase to the Sui blockchain." : "Your video access has been confirmed on-chain."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 text-center space-y-6">
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto"
            >
              <Loader2 className="w-16 h-16 text-cyan-400" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            </motion.div>
          )}

          {loading ? (
            <div>
              <p className="text-sm text-muted-foreground">
                Submitting transaction to Sui Testnet...
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Please wait while your purchase is confirmed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                You now have <span className="text-cyan-400 font-semibold">{durationHours}h</span> access
              </p>
              <div className="glass rounded-xl p-4 border border-white/5 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount paid</span>
                  <span className="text-cyan-400 font-semibold">{formatSui(priceSui)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Access duration</span>
                  <span>{durationHours} hours</span>
                </div>
                {txDigest && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Tx digest</span>
                    <a
                      href={getTxExplorerUrl(txDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                    >
                      {txDigest.slice(0, 8)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!loading && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={onWatch} className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-600 text-white border-0">
              <Play className="w-4 h-4 mr-2" />
              Watch Now
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
