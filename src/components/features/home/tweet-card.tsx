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
  Repeat2,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tweet } from "@/types";
import type { CommentData } from "@/hooks/use-comments";
import { cn, formatNumber, formatHandle } from "@/lib/utils";
import { useTribeStore } from "@/store/use-tribe-store";
import { useLike } from "@/hooks/use-like";
import { useShare } from "@/hooks/use-share";
import { useAuth } from "@/hooks/use-auth";
import { useComments } from "@/hooks/use-comments";
import { useTribeBookmark } from "@/hooks/use-tribe-bookmark";
import { useOnchainTipsForTarget } from "@/hooks/use-onchain-tips";
import { useTribeIdentityStore } from "@/store/use-tribe-identity-store";
import { signAndRemoveTweet, signAndPublishReaction } from "@/lib/tribe";
import { TipButton } from "./tip-button";
import { TippersRow } from "./tippers-row";

function tidFromUserId(id: string): number | null {
  const match = id.match(/^tid-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/** True when the id looks like a hub protocol hash (base64, 40+ chars). */
function isProtocolHash(id: string): boolean {
  return id.length >= 40 && !id.startsWith("tweet-") && !id.startsWith("post-");
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
  const { isAuthenticated, profile, tid: myTid } = useAuth();
  const identity = useTribeIdentityStore((s) => s.identity);
  const { isLiked, likeCount, toggleLike } = useLike(
    tweet.id,
    tweet.isLiked,
    tweet.likes,
    { targetHash: isProtocolHash(tweet.id) ? tweet.id : undefined }
  );
  const { setBookmarked, ready: bookmarkReady } = useTribeBookmark();
  const recipientTid = tidFromUserId(tweet.user.id);
  const {
    tipCount: onchainTipCount,
    totalSol: onchainTipSol,
    tippers: onchainTippers,
    refresh: refreshTipAggregate,
  } = useOnchainTipsForTarget(tweet.id);
  const { share, showToast: showShareToast } = useShare();
  const {
    comments,
    isLoading,
    fetchComments,
    addComment,
    deleteComment,
    addReply,
  } = useComments(tweet.id);
  const [showInput, setShowInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Retweet / recast state
  const [isRetweeted, setIsRetweeted] = useState(tweet.isRetweeted ?? false);
  const [recastCount, setRecastCount] = useState(tweet.recasts ?? 0);

  // Delete state (own tweets only)
  const [hidden, setHidden] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const authorTid = tidFromUserId(tweet.user.id);
  const isOwn = myTid !== null && myTid === authorTid;
  const isProtocol = isProtocolHash(tweet.id);

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

  const handleRetweet = useCallback(async () => {
    if (!identity || !isProtocol) return;
    const wasRetweeted = isRetweeted;
    setIsRetweeted(!wasRetweeted);
    setRecastCount((c) => (wasRetweeted ? Math.max(0, c - 1) : c + 1));
    try {
      const secret = Uint8Array.from(atob(identity.appKeySecret), (c) => c.charCodeAt(0));
      await signAndPublishReaction(identity.tid, tweet.id, "recast", secret, wasRetweeted);
    } catch {
      setIsRetweeted(wasRetweeted);
      setRecastCount((c) => (wasRetweeted ? c + 1 : Math.max(0, c - 1)));
    }
  }, [identity, isProtocol, isRetweeted, tweet.id]);

  const handleDelete = useCallback(async () => {
    if (!identity || !isOwn || !isProtocol || deleting) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    setHidden(true);
    try {
      const secret = Uint8Array.from(atob(identity.appKeySecret), (c) => c.charCodeAt(0));
      await signAndRemoveTweet(identity.tid, tweet.id, secret);
    } catch (err) {
      console.error("Delete failed:", err);
      setHidden(false);
    } finally {
      setDeleting(false);
    }
  }, [identity, isOwn, isProtocol, deleting, tweet.id]);

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

  // Collect all media embeds (explicit imageUrl + embeds array, deduped)
  const mediaUrls = (() => {
    const seen = new Set<string>();
    const urls: string[] = [];
    if (tweet.imageUrl) { seen.add(tweet.imageUrl); urls.push(tweet.imageUrl); }
    for (const e of tweet.embeds ?? []) {
      if (e.url && !seen.has(e.url)) { seen.add(e.url); urls.push(e.url); }
    }
    return urls;
  })();

  if (hidden) return null;

  const authorProfileHref = isOwn
    ? "/profile"
    : authorTid != null
      ? `/profile?tid=${authorTid}`
      : "/profile";

  const retweeterLabel = tweet.retweetedByUsername
    ? `@${tweet.retweetedByUsername}`
    : tweet.retweetedByTid != null
      ? `TID #${tweet.retweetedByTid}`
      : null;

  return (
    <div className="group relative bg-white rounded-[20px] sm:rounded-[32px] border border-[#f0f0f0] p-4 sm:p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.03] overflow-hidden">

      {/* Retweet attribution banner */}
      {retweeterLabel && (
        <div className="flex items-center gap-1.5 mb-3 pl-1 text-[12px] font-semibold text-muted-foreground">
          <Repeat2 className="h-3.5 w-3.5 shrink-0" />
          <span>{retweeterLabel} reposted</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href={authorProfileHref}
            className="group/avatar flex items-center gap-2.5 sm:gap-3 transition-opacity hover:opacity-80"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted overflow-hidden relative border border-[#f0f0f0] group-hover/avatar:ring-2 group-hover/avatar:ring-primary/20 transition-all">
              <Image
                src={tweet.user.avatarUrl}
                alt={tweet.user.displayName}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-bold tracking-tight leading-none">
                  {tweet.user.displayName !== tweet.user.username
                    ? tweet.user.displayName
                    : formatHandle(tweet.user.username)}
                </p>
                {tweet.user.displayName !== tweet.user.username && (
                  <p className="text-[11px] font-semibold text-muted-foreground leading-none">
                    {formatHandle(tweet.user.username)}
                  </p>
                )}
                {authorTid != null && (
                  <span className="text-[10px] font-bold text-muted-foreground/60 bg-[#f5f5f5] px-1.5 py-0.5 rounded-full leading-none">
                    #{authorTid}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {tweet.timestamp}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Channel badge */}
          {tweet.channel && tweet.channel.id !== "general" && (
            <div className="rounded-full bg-[#f5f5f5] px-3 py-1 text-[11px] font-bold tracking-tight text-muted-foreground flex items-center gap-1.5 capitalize">
              {tweet.channel.name}
            </div>
          )}
          {/* Delete own tweet */}
          {isOwn && isProtocol && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete post"
              className="p-1.5 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
            >
              {deleting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />
              }
            </button>
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

      {/* Media — single image keeps aspect ratio, multiple in 2-col grid */}
      {mediaUrls.length === 1 && (
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
            src={mediaUrls[0]}
            alt={tweet.caption || "Post image"}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-[1.02] duration-700"
            sizes="(max-width: 768px) 100vw, 600px"
            priority={false}
          />
        </div>
      )}
      {mediaUrls.length > 1 && (
        <div className={cn("mb-4 sm:mb-6 grid gap-1.5 rounded-[16px] sm:rounded-[24px] overflow-hidden",
          mediaUrls.length === 2 ? "grid-cols-2" : "grid-cols-2"
        )}>
          {mediaUrls.slice(0, 4).map((url, i) => (
            <div key={i} className="relative aspect-square bg-[#f5f5f5]">
              <Image
                src={url}
                alt={`Image ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="300px"
              />
              {i === 3 && mediaUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-black text-2xl">
                  +{mediaUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent on-chain tippers */}
      <TippersRow tipCount={onchainTipCount} tippers={onchainTippers} />

      {/* Interactions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {/* Like */}
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-90",
              isLiked ? "bg-red-50 text-red-500" : "hover:bg-[#f5f5f5] text-[#666]"
            )}
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
            <span className="text-[13px] font-bold">{formatNumber(likeCount)}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowInput((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-90",
              showInput ? "bg-indigo-50 text-indigo-500" : "hover:bg-[#f5f5f5] text-[#666]"
            )}
          >
            <MessageCircle className={cn("h-5 w-5", showInput && "fill-current")} />
            <span className="text-[13px] font-bold">
              {formatNumber(displayCount + (tweet.replyCount ?? 0))}
            </span>
          </button>

          {/* Retweet / Recast */}
          {isProtocol && (
            <button
              onClick={handleRetweet}
              disabled={!isAuthenticated}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all active:scale-90 disabled:opacity-40",
                isRetweeted ? "bg-emerald-50 text-emerald-600" : "hover:bg-[#f5f5f5] text-[#666]"
              )}
            >
              <Repeat2 className={cn("h-5 w-5", isRetweeted && "stroke-[2.5]")} />
              {recastCount > 0 && (
                <span className="text-[13px] font-bold">{formatNumber(recastCount)}</span>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tip */}
          {recipientTid !== null && (
            <TipButton
              recipientTid={recipientTid}
              targetHash={tweet.id}
              tipCount={onchainTipCount}
              totalSol={onchainTipSol}
              onTipped={refreshTipAggregate}
            />
          )}
          {/* Share */}
          <button
            onClick={() => share(tweet.user.displayName, tweet.caption, `${typeof window !== "undefined" ? window.location.origin : ""}/tweet?hash=${encodeURIComponent(tweet.id)}`)}
            className="p-2 rounded-full hover:bg-[#f5f5f5] text-[#666] transition-all active:scale-90"
          >
            <Share2 className="h-5 w-5" />
          </button>
          {/* Bookmark */}
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
              tweet.isSaved ? "bg-black text-white" : "hover:bg-[#f5f5f5] text-[#666]"
            )}
          >
            <Bookmark className={cn("h-5 w-5", tweet.isSaved && "fill-current")} />
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
