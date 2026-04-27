"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Loader2,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tweet } from "@/types";
import type { CommentData } from "@/hooks/use-comments";
import { cn, formatNumber } from "@/lib/utils";
import { useTribeStore } from "@/store/use-tribe-store";
import { useLike } from "@/hooks/use-like";
import { useShare } from "@/hooks/use-share";
import { useAuth } from "@/hooks/use-auth";
import { useComments } from "@/hooks/use-comments";
import { useTribeBookmark } from "@/hooks/use-tribe-bookmark";
import { useOnchainTipsForTarget } from "@/hooks/use-onchain-tips";
import { TipButton } from "./tip-button";
import { TippersRow } from "./tippers-row";

function tidFromUserId(id: string): number | null {
  const match = id.match(/^tid-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

interface TweetCardProps {
  tweet: Tweet;
}

function CommentItem({
  comment,
  isOwn,
  onDelete,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  isAuthenticated,
  isReply,
}: {
  comment: CommentData;
  isOwn: boolean;
  onDelete: (id: string) => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: (commentId: string) => void;
  isAuthenticated: boolean;
  isReply?: boolean;
}) {
  const hasReplies =
    (comment.replyCount && comment.replyCount > 0) ||
    (comment.replies && comment.replies.length > 0);

  return (
    <div>
      <div className="flex gap-2.5">
        <div
          className={cn(
            "flex-none rounded-full bg-[#f0f0f0] flex items-center justify-center font-bold text-[#666]",
            isReply ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[11px]"
          )}
        >
          {(comment.profile?.username || comment.profileId)
            .charAt(0)
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-bold",
                isReply ? "text-[11px]" : "text-[12px]"
              )}
            >
              {comment.profile?.username || comment.profileId}
            </span>
            <span
              className={cn(
                "text-muted-foreground",
                isReply ? "text-[9px]" : "text-[10px]"
              )}
            >
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p
            className={cn(
              "leading-snug text-black/80",
              isReply ? "text-[12px]" : "text-[13px]"
            )}
          >
            {comment.text}
          </p>

          {!isReply && (
            <div className="flex items-center gap-3 mt-1">
              {hasReplies && (
                <span className="text-[11px] text-muted-foreground">
                  {comment.replyCount || comment.replies?.length || 0}{" "}
                  {(comment.replyCount || comment.replies?.length || 0) === 1
                    ? "reply"
                    : "replies"}
                </span>
              )}
            </div>
          )}
        </div>
        {isOwn && (
          <button
            onClick={() => onDelete(comment.id)}
            className="flex-none p-1 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && !isReply && (
        <div className="ml-9 mt-2 space-y-2 border-l-2 border-[#f0f0f0] pl-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isOwn={false}
              onDelete={onDelete}
              replyText=""
              onReplyTextChange={() => { }}
              onReplySubmit={() => { }}
              isAuthenticated={isAuthenticated}
              isReply
            />
          ))}
        </div>
      )}

      {isAuthenticated && !isReply && (
        <form
          className="ml-9 mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            onReplySubmit(comment.id);
          }}
        >
          <div className="flex items-center gap-2 rounded-full bg-[#f5f5f5] px-3 py-1.5">
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="flex-none rounded-full p-1 text-indigo-500 hover:bg-indigo-50 disabled:opacity-30 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function TweetCard({ tweet }: TweetCardProps) {
  const { likeTweet, bookmarkTweet } = useTribeStore();
  const { isAuthenticated, profile } = useAuth();
  const { isLiked, likeCount, toggleLike } = useLike(
    tweet.id,
    tweet.isLiked,
    tweet.likes
  );
  const { setBookmarked, ready: bookmarkReady } = useTribeBookmark();
  const recipientTid = tidFromUserId(tweet.user.id);
  const {
    tipCount: onchainTipCount,
    totalSol: onchainTipSol,
    tippers: onchainTippers,
    refresh: refreshTipAggregate,
  } = useOnchainTipsForTarget(tweet.id);
  const { showToast: showShareToast } = useShare();
  const {
    comments,
    isLoading,
    fetchComments,
    addComment,
    deleteComment,
    addReply,
  } = useComments(null);
  const [showInput, setShowInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (showInput) {
      inputRef.current?.focus();
    }
  }, [showInput]);

  const handleLike = async () => {
    likeTweet(tweet.id);
    if (isAuthenticated) {
      await toggleLike();
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(commentText);
    setCommentText("");
  };

  const handleReplyTextChange = (commentId: string, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [commentId]: text }));
  };

  const handleReplySubmit = async (commentId: string) => {
    const text = replyTexts[commentId];
    if (!text?.trim()) return;
    await addReply(commentId, text);
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
  };

  const toggleInput = () => {
    setShowInput((prev) => !prev);
  };

  const displayCount = comments.length || tweet.comments.length;
  const isShortCaption = tweet.caption.length < 60;

  return (
    <div className="group relative bg-white rounded-[20px] sm:rounded-[32px] border border-[#f0f0f0] p-4 sm:p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.03] overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/profile"
            className="group/avatar flex items-center gap-2.5 sm:gap-3 transition-opacity hover:opacity-80"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted overflow-hidden relative border border-[#f0f0f0] group-hover/avatar:ring-2 group-hover/avatar:ring-primary/20 transition-all">
              <Image
                src={tweet.user.avatarUrl}
                alt={tweet.user.displayName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[14px] font-bold tracking-tight">
                @{tweet.user.username}
              </p>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                {tweet.timestamp}
              </p>
            </div>
          </Link>
        </div>
        <div className="rounded-full bg-[#f5f5f5] px-3 py-1 text-[11px] font-bold tracking-tight text-muted-foreground flex items-center gap-1.5 capitalize">
          {tweet.channel ? (
            <>
              {tweet.channel.imageUrl && (
                <div className="relative h-3 w-3 rounded-full overflow-hidden shrink-0 ring-1 ring-black/5">
                  <Image src={tweet.channel.imageUrl} alt={tweet.channel.name} fill className="object-cover" />
                </div>
              )}
              {tweet.channel.name}
            </>
          ) : (
            "Local"
          )}
        </div>
      </div>

      {/* Caption Content */}
      <div
        className={cn(
          "mb-3 sm:mb-5 leading-tight tracking-tight",
          isShortCaption
            ? "text-[18px] sm:text-[22px] font-bold"
            : "text-[14px] sm:text-[16px] font-medium text-black/80"
        )}
      >
        {tweet.caption}
      </div>

      {/* Integrated Image */}
      {tweet.imageUrl && (
        <div
          className="relative mb-4 sm:mb-6 overflow-hidden rounded-[16px] sm:rounded-[24px] bg-[#f5f5f5] min-h-[200px]"
          style={{
            aspectRatio: tweet.imageWidth && tweet.imageHeight
              ? `${tweet.imageWidth} / ${tweet.imageHeight}`
              : "16 / 10",
            maxHeight: "min(65vh, 600px)"
          }}
        >
          <Image
            src={tweet.imageUrl}
            alt={tweet.caption || "Tweet image"}
            fill
            className="object-cover transition-transform group-hover:scale-[1.02] duration-700"
            sizes="(max-width: 768px) 100vw, 600px"
            priority={false}
          />
        </div>
      )}

      {/* Recent on-chain tippers */}
      <TippersRow tipCount={onchainTipCount} tippers={onchainTippers} />

      {/* Interactions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-90",
              isLiked
                ? "bg-red-50 text-red-500"
                : "hover:bg-[#f5f5f5] text-[#666]"
            )}
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
            <span className="text-[13px] font-bold">
              {formatNumber(likeCount)}
            </span>
          </button>

          <button
            onClick={toggleInput}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-90",
              showInput
                ? "bg-indigo-50 text-indigo-500"
                : "hover:bg-[#f5f5f5] text-[#666]"
            )}
          >
            <MessageCircle
              className={cn("h-5 w-5", showInput && "fill-current")}
            />
            <span className="text-[13px] font-bold">
              {formatNumber(displayCount)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {recipientTid !== null && (
            <TipButton
              recipientTid={recipientTid}
              targetHash={tweet.id}
              tipCount={onchainTipCount}
              totalSol={onchainTipSol}
              onTipped={refreshTipAggregate}
            />
          )}
          <button
            onClick={async () => {
              const wasSaved = !!tweet.isSaved;
              bookmarkTweet(tweet.id);
              if (bookmarkReady) {
                try {
                  await setBookmarked(tweet.id, !wasSaved);
                } catch {
                  bookmarkTweet(tweet.id);
                }
              }
            }}
            className={cn(
              "p-2 rounded-full transition-all active:scale-90",
              tweet.isSaved
                ? "bg-black text-white"
                : "hover:bg-[#f5f5f5] text-[#666]"
            )}
          >
            <Bookmark
              className={cn("h-5 w-5", tweet.isSaved && "fill-current")}
            />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {(isLoading || comments.length > 0) && (
        <div className="mt-4 border-t border-[#f0f0f0] pt-4">
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            {isLoading && comments.length === 0
              ? "Loading comments..."
              : `${displayCount} Comment${displayCount !== 1 ? "s" : ""}`}
          </p>

          {isLoading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isOwn={profile?.id === comment.profileId}
                  onDelete={deleteComment}
                  replyText={replyTexts[comment.id] || ""}
                  onReplyTextChange={(text) => handleReplyTextChange(comment.id, text)}
                  onReplySubmit={handleReplySubmit}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comment Input */}
      <AnimatePresence>
        {showInput && isAuthenticated && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCommentSubmit}
              className="mt-3 flex items-center gap-2 rounded-full bg-[#f5f5f5] px-4 py-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isLoading}
                className="flex-none rounded-full p-1.5 text-indigo-500 hover:bg-indigo-50 disabled:opacity-30 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share toast */}
      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          Link copied!
        </div>
      )}
    </div>
  );
}
