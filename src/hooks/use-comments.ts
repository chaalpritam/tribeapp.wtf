"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import { useTribePublish } from "./use-tribe-publish";
import { fetchReplies, resolveMediaUrl, type TribeTweet } from "@/lib/tribe/api";

export interface CommentData {
  id: string;
  profileId: string;
  contentId: string;
  text: string;
  created_at: string;
  profile?: {
    id: string;
    username: string;
    image?: string;
  };
  replies?: CommentData[];
  replyCount?: number;
}

interface UseCommentsReturn {
  comments: CommentData[];
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchComments: () => Promise<void>;
  addComment: (text: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  expandedReplies: Set<string>;
  toggleReplies: (commentId: string) => void;
  fetchReplies: (commentId: string) => Promise<void>;
  addReply: (commentId: string, text: string) => Promise<void>;
  replyingTo: string | null;
  setReplyingTo: (commentId: string | null) => void;
}

function tweetToComment(t: TribeTweet, parentHash: string): CommentData {
  const tidStr = String(t.tid);
  const username =
    t.user?.username ?? t.username ?? `tid:${tidStr}`;
  const image =
    resolveMediaUrl(t.user?.pfpUrl ?? t.pfp_url ?? null) ?? undefined;
  return {
    id: t.hash,
    profileId: `tid-${tidStr}`,
    contentId: parentHash,
    text: t.text,
    created_at: String(t.timestamp * 1000),
    profile: {
      id: `tid-${tidStr}`,
      username,
      image,
    },
  };
}

export function useComments(contentId: string | null): UseCommentsReturn {
  const { profile, isAuthenticated } = useAuth();
  const { publish } = useTribePublish();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!contentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchReplies(contentId);
      const list = (res.replies ?? []).map((t) =>
        tweetToComment(t, contentId)
      );
      setComments(list);
      setTotal(res.count ?? list.length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load comments"
      );
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  const addComment = useCallback(
    async (text: string) => {
      if (!contentId || !isAuthenticated || !profile?.id || !text.trim())
        return;

      const trimmed = text.trim();
      const { hash } = await publish(trimmed, { parentHash: contentId });

      const newComment: CommentData = {
        id: hash,
        profileId: profile.id,
        contentId,
        text: trimmed,
        created_at: String(Date.now()),
        profile: {
          id: profile.id,
          username: profile.username,
          image: profile.image,
        },
      };
      setComments((prev) => [...prev, newComment]);
      setTotal((t) => t + 1);
    },
    [contentId, isAuthenticated, profile, publish]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((t) => Math.max(0, t - 1));
    },
    []
  );

  const fetchRepliesFor = useCallback(
    async (commentId: string) => {
      try {
        const res = await fetchReplies(commentId);
        const list = (res.replies ?? []).map((t) =>
          tweetToComment(t, commentId)
        );
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  replies: list,
                  replyCount: res.count ?? list.length,
                }
              : c
          )
        );
      } catch {
        // keep prior replies on transient failure
      }
    },
    []
  );

  const toggleReplies = useCallback(
    (commentId: string) => {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        if (next.has(commentId)) {
          next.delete(commentId);
        } else {
          next.add(commentId);
          fetchRepliesFor(commentId);
        }
        return next;
      });
    },
    [fetchRepliesFor]
  );

  const addReply = useCallback(
    async (commentId: string, text: string) => {
      if (!contentId || !isAuthenticated || !profile?.id || !text.trim())
        return;

      const trimmed = text.trim();
      const { hash } = await publish(trimmed, { parentHash: commentId });

      const newReply: CommentData = {
        id: hash,
        profileId: profile.id,
        contentId,
        text: trimmed,
        created_at: String(Date.now()),
        profile: {
          id: profile.id,
          username: profile.username,
          image: profile.image,
        },
      };

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: [...(c.replies || []), newReply],
                replyCount: (c.replyCount || 0) + 1,
              }
            : c
        )
      );
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.add(commentId);
        return next;
      });
      setReplyingTo(null);
    },
    [contentId, isAuthenticated, profile, publish]
  );

  return {
    comments,
    total,
    isLoading,
    error,
    fetchComments,
    addComment,
    deleteComment: removeComment,
    expandedReplies,
    toggleReplies,
    fetchReplies: fetchRepliesFor,
    addReply,
    replyingTo,
    setReplyingTo,
  };
}
