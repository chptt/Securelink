"use client";

import { CheckCircle, XCircle, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTimeRemaining } from "@/lib/utils";

interface AccessBadgeProps {
  status: "active" | "expired" | "locked" | "none";
  remainingSeconds?: number;
}

export function AccessBadge({ status, remainingSeconds }: AccessBadgeProps) {
  if (status === "active") {
    return (
      <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Access Active
        {remainingSeconds !== undefined && (
          <span className="ml-1 opacity-80">
            · {formatTimeRemaining(remainingSeconds)}
          </span>
        )}
      </Badge>
    );
  }

  if (status === "expired") {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Access Expired
      </Badge>
    );
  }

  if (status === "locked") {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Lock className="w-3 h-3" />
        Locked
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
      <Clock className="w-3 h-3" />
      Not Purchased
    </Badge>
  );
}
