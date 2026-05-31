"use client";

import { useState, FormEvent } from "react";
import { useComments } from "@/hooks/useCommunity";
import { Send } from "lucide-react";

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentSection({
  postId,
  onCommentAdded,
}: CommentSectionProps) {
  const { comments, submitting, postComment } = useComments(postId);
  const [text, setText] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await postComment(text);
    setText("");
    onCommentAdded?.();
  };

  return (
    <div className="comments-section">
      {comments.length > 0 && (
        <div className="comments-section__list">
          {comments.map((c, idx) => (
            <div
              key={c.id || `comment-${idx}`}
              className="comments-section__item"
            >
              <span className="comments-section__author">{c.authorName}</span>
              <span className="comments-section__text">{c.text}</span>
            </div>
          ))}
        </div>
      )}
      <form className="comments-section__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="comments-section__input"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={280}
        />
        <button
          type="submit"
          className="comments-section__send"
          disabled={submitting || !text.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
