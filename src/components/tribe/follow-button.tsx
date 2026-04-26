"use client";

import { Loader2 } from "lucide-react";
import { useFollow } from "@/hooks/use-follow";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetProfileId: string | null;
  className?: string;
}

export function FollowButton({ targetProfileId, className }: FollowButtonProps) {
  const { isAuthenticated, profile } = useAuth();
  const { isFollowing, isLoading, toggleFollow } = useFollow(targetProfileId);

  // Don't show for own profile or when not authenticated
  if (!isAuthenticated || !targetProfileId || profile?.id === targetProfileId) {
    return null;
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFollow();
      }}
      disabled={isLoading}
      className={cn(
        "rounded-lg px-3 py-1 text-xs font-bold transition-colors",
        isFollowing
          ? "bg-muted text-foreground hover:bg-red-50 hover:text-red-500"
          : "bg-foreground text-background hover:opacity-90",
        isLoading && "opacity-50",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isFollowing ? (
        "Following"
      ) : (
        "Follow"
      )}
    </button>
  );
}
