"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ expiresAt, onExpire, className }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const secs = Math.max(0, Math.floor(diff / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, remaining]);

  const isUrgent = remaining < 300; // < 5 minutes
  const isExpired = remaining <= 0;

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-red-400 ${className}`}>
        <AlertTriangle className="w-4 h-4" />
        <span className="font-mono text-sm font-semibold">Access Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${isUrgent ? "text-red-400 timer-urgent" : "text-cyan-400"} ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono text-sm font-semibold">
        {formatTimeRemaining(remaining)} remaining
      </span>
    </div>
  );
}
