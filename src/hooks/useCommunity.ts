"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  createCommunityPost,
  togglePostLike,
  deleteCommunityPost,
  subscribeToCommunityPosts,
  addComment,
  subscribeToComments,
  reportPost,
} from "@/lib/repositories";
import { CommunityPost, CommunityComment, ReportReason } from "@/types";
import toast from "react-hot-toast";

const DEMO_EMAIL = "demo@theatrack.app";
const DEMO_POST_LIMIT = 3;

export function useCommunity() {
  const { user, profile } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [posting, setPosting] = useState(false);

  const loading = user ? posts === null : false;

  // Subscribe to posts
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCommunityPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
    }, 20);
    return () => {
      unsub();
      setPosts(null);
    };
  }, [user]);

  // Create a post
  const createPost = useCallback(
    async (data: {
      dogId: string;
      dogName: string;
      dogBreed: string;
      caption: string;
      tags: string[];
      photoFile: File;
    }) => {
      if (!user || !profile) return;

      // Demo account: cap at N posts
      if (user.email === DEMO_EMAIL) {
        const userPosts = (posts ?? []).filter((p) => p.authorId === user.uid);
        if (userPosts.length >= DEMO_POST_LIMIT) {
          toast.error(
            `Demo account is limited to ${DEMO_POST_LIMIT} posts. Sign up for unlimited posting!`,
          );
          return;
        }
      }

      setPosting(true);
      try {
        await createCommunityPost(
          {
            authorId: user.uid,
            authorName: profile.displayName,
            authorPhotoUrl: profile.photoUrl,
            dogId: data.dogId,
            dogName: data.dogName,
            dogBreed: data.dogBreed,
            photoUrl: "", // Will be set by repo function after upload
            caption: data.caption,
            tags: data.tags,
          },
          data.photoFile,
        );
        toast.success("Posted! 📷");
      } catch (err) {
        console.error("Failed to create post:", err);
        toast.error("Failed to post. Try again.");
      } finally {
        setPosting(false);
      }
    },
    [user, profile, posts],
  );

  // Like/unlike a post
  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      try {
        await togglePostLike(postId, user.uid);
      } catch (err) {
        console.error("Failed to toggle like:", err);
      }
    },
    [user],
  );

  // Delete a post
  const removePost = useCallback(async (postId: string) => {
    try {
      await deleteCommunityPost(postId);
      toast.success("Post deleted");
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error("Failed to delete post.");
    }
  }, []);

  // Report a post
  const report = useCallback(
    async (postId: string, reason: ReportReason, details: string) => {
      if (!user) return;
      try {
        await reportPost({
          postId,
          reporterId: user.uid,
          reason,
          details,
        });
        toast.success("Reported. We'll review it.");
      } catch (err) {
        console.error("Failed to report:", err);
        toast.error("Failed to report.");
      }
    },
    [user],
  );

  return {
    user,
    posts: posts ?? [],
    loading,
    posting,
    createPost,
    toggleLike,
    removePost,
    report,
  };
}

// Separate hook for comments on a specific post
export function useComments(postId: string) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    const unsub = subscribeToComments(postId, setComments);
    return unsub;
  }, [postId]);

  const postComment = useCallback(
    async (text: string) => {
      if (!user || !profile || !text.trim()) return;
      setSubmitting(true);
      try {
        await addComment({
          postId,
          authorId: user.uid,
          authorName: profile.displayName,
          text: text.trim(),
        });
      } catch (err) {
        console.error("Failed to comment:", err);
        toast.error("Failed to post comment.");
      } finally {
        setSubmitting(false);
      }
    },
    [user, profile, postId],
  );

  return { comments, submitting, postComment };
}
