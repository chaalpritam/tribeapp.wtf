"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";

export interface CommentData {
  id: string;
  profileId: string;
  contentId: string;
  text: string;
  created_at: string;
  profile?: {
    id: string;
    username: string;
    bio?: string;
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

export function useComments(contentId: string | null): UseCommentsReturn {
  const { profile, isAuthenticated } = useAuth();
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
      // TODO: implement comment fetching
      setComments([]);
      setTotal(0);
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

      const newComment: CommentData = {
        id: `comment-${Date.now()}`,
        profileId: profile.id,
        contentId,
        text: text.trim(),
        created_at: String(Date.now()),
        profile: {
          id: profile.id,
          username: profile.username,
          bio: profile.bio,
          image: profile.image,
        },
      };
      setComments((prev) => [...prev, newComment]);
      setTotal((t) => t + 1);
    },
    [contentId, isAuthenticated, profile]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((t) => Math.max(0, t - 1));
    },
    []
  );

  const fetchReplies = useCallback(
    async (_commentId: string) => {
      // TODO: implement reply fetching
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
          fetchReplies(commentId);
        }
        return next;
      });
    },
    [fetchReplies]
  );

  const addReply = useCallback(
    async (commentId: string, text: string) => {
      if (!contentId || !isAuthenticated || !profile?.id || !text.trim()) return;

      const newReply: CommentData = {
        id: `reply-${Date.now()}`,
        profileId: profile.id,
        contentId,
        text: text.trim(),
        created_at: String(Date.now()),
        profile: {
          id: profile.id,
          username: profile.username,
          bio: profile.bio,
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
    [contentId, isAuthenticated, profile]
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
    fetchReplies,
    addReply,
    replyingTo,
    setReplyingTo,
  };
}
