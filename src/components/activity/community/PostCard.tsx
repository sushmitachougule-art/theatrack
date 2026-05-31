"use client";

import { useState } from "react";
import { CommunityPost } from "@/types";
import { Heart, MessageCircle, Trash2, Flag, Send } from "lucide-react";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
  post: CommunityPost;
  currentUserId: string;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string) => void;
  onMessage?: (authorId: string, authorName: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
  onReport,
  onMessage,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [optimisticCommentBump, setOptimisticCommentBump] = useState(0);
  // Track last server-synced values so we can reset optimistic state during render
  const [lastSyncedLikeCount, setLastSyncedLikeCount] = useState(
    post.likeCount,
  );
  const [lastSyncedLikedBy, setLastSyncedLikedBy] = useState(post.likedBy);
  const [lastSyncedCommentCount, setLastSyncedCommentCount] = useState(
    post.commentCount,
  );

  // Reset optimistic state during render when server data changes (React 19 pattern)
  if (
    post.likeCount !== lastSyncedLikeCount ||
    post.likedBy !== lastSyncedLikedBy
  ) {
    setLastSyncedLikeCount(post.likeCount);
    setLastSyncedLikedBy(post.likedBy);
    setOptimisticLiked(null);
    setOptimisticCount(null);
  }
  if (post.commentCount !== lastSyncedCommentCount) {
    setLastSyncedCommentCount(post.commentCount);
    setOptimisticCommentBump(0);
  }

  const isOwner = post.authorId === currentUserId;
  const isLiked = optimisticLiked ?? post.likedBy.includes(currentUserId);
  const likeCount = optimisticCount ?? (post.likeCount || 0);
  const commentCount = (post.commentCount || 0) + optimisticCommentBump;

  const handleLike = () => {
    const willLike = !isLiked;
    setOptimisticLiked(willLike);
    setOptimisticCount(
      willLike ? post.likeCount + 1 : Math.max(0, post.likeCount - 1),
    );
    onLike(post.id);
  };

  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <article className="post-card">
      <div className="post-card__header">
        <div className="post-card__author">
          <div className="post-card__avatar">
            {post.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="post-card__name">{post.authorName}</span>
            <span className="post-card__meta">
              {post.dogName} · {post.dogBreed}
            </span>
          </div>
        </div>
        <span className="post-card__time">{timeAgo}</span>
      </div>

      {post.photoUrl && (
        <div className="post-card__image">
          {!imgLoaded && (
            <div className="post-card__image-loader">
              <span className="post-card__image-loader-bone">🦴</span>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.photoUrl}
            alt={post.caption}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            style={{ opacity: imgLoaded ? 1 : 0 }}
          />
        </div>
      )}

      <p className="post-card__caption">{post.caption}</p>

      {post.tags.length > 0 && (
        <div className="post-card__tags">
          {post.tags.map((tag) => (
            <span key={tag} className="post-card__tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="post-card__actions">
        <button
          className={`post-card__action ${isLiked ? "post-card__action--liked" : ""}`}
          onClick={handleLike}
          aria-label={`${isLiked ? "Unlike" : "Like"} post by ${post.authorName}`}
          aria-pressed={isLiked}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          <span>{likeCount}</span>
        </button>
        <button
          className="post-card__action"
          onClick={() => setShowComments(!showComments)}
          aria-label={`${showComments ? "Hide" : "Show"} ${commentCount} comments`}
          aria-expanded={showComments}
        >
          <MessageCircle size={18} />
          <span>{commentCount}</span>
        </button>
        <div className="post-card__actions-right">
          {!isOwner && onMessage && (
            <button
              className="post-card__action post-card__action--dm"
              onClick={() => onMessage(post.authorId, post.authorName)}
              title="Send message"
            >
              <Send size={15} />
            </button>
          )}
          {isOwner ? (
            <button
              className="post-card__action post-card__action--danger"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <button
              className="post-card__action"
              onClick={() => onReport(post.id)}
            >
              <Flag size={16} />
            </button>
          )}
        </div>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentAdded={() => setOptimisticCommentBump((n) => n + 1)}
        />
      )}
    </article>
  );
}

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
