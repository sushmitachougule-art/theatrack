"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommunity } from "@/hooks/useCommunity";
import { useChatThreads } from "@/hooks/useChat";
import { useDogs } from "@/hooks/useDogs";
import { PostCard } from "./PostCard";
import { NewPostForm } from "./NewPostForm";
import { PostShimmer } from "@/components/ui/BarkLoader";
import { Plus } from "lucide-react";

export function CommunityTab() {
  const {
    user,
    posts,
    loading,
    posting,
    createPost,
    toggleLike,
    removePost,
    report,
  } = useCommunity();
  const { dogs } = useDogs();
  const { startChat } = useChatThreads();
  const router = useRouter();
  const [showNewPost, setShowNewPost] = useState(false);

  if (loading) {
    return (
      <div className="community-tab community-tab--loading">
        <PostShimmer />
        <PostShimmer />
      </div>
    );
  }

  const handleDelete = (postId: string) => {
    if (confirm("Delete this post?")) {
      removePost(postId);
    }
  };

  const handleReport = (postId: string) => {
    if (confirm("Report this post as inappropriate?")) {
      report(postId, "inappropriate", "");
    }
  };

  return (
    <div className="community-tab">
      <div className="community-tab__header">
        <h3 className="community-tab__title">Community</h3>
        <button
          className="community-tab__new-btn"
          onClick={() => setShowNewPost(true)}
        >
          <Plus size={16} />
          New Post
        </button>
      </div>

      {showNewPost && dogs && dogs.length > 0 && (
        <NewPostForm
          dogs={dogs}
          posting={posting}
          onSubmit={async (data) => {
            await createPost(data);
            setShowNewPost(false);
          }}
          onCancel={() => setShowNewPost(false)}
        />
      )}

      {posts.length === 0 ? (
        <p className="community-tab__empty">
          No posts yet. Be the first to share! 📸
        </p>
      ) : (
        <div className="community-tab__feed">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.uid ?? ""}
              onLike={toggleLike}
              onDelete={handleDelete}
              onReport={handleReport}
              onMessage={async (authorId, authorName) => {
                const threadId = await startChat(authorId, authorName, null);
                if (threadId) {
                  router.push("/messages");
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
