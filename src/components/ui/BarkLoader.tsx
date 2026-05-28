"use client";

interface BarkLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Fun animated dog bark loader — shows bouncing paw prints
 * with a customizable message and woof sound effect text.
 */
export function BarkLoader({
  text = "Fetching...",
  size = "md",
}: BarkLoaderProps) {
  return (
    <div className={`bark-loader bark-loader--${size}`}>
      <div className="bark-loader__paws">
        <span className="bark-loader__paw">🐾</span>
        <span className="bark-loader__paw">🐾</span>
        <span className="bark-loader__paw">🐾</span>
      </div>
      <p className="bark-loader__text">{text}</p>
      <div className="bark-loader__woof">woof!</div>
    </div>
  );
}

/**
 * Shimmer skeleton for loading post cards (image placeholder).
 */
export function PostShimmer() {
  return (
    <div className="post-shimmer">
      <div className="post-shimmer__header">
        <div className="post-shimmer__avatar shimmer" />
        <div className="post-shimmer__meta">
          <div className="post-shimmer__name shimmer" />
          <div className="post-shimmer__sub shimmer" />
        </div>
      </div>
      <div className="post-shimmer__image shimmer" />
      <div className="post-shimmer__caption shimmer" />
      <div className="post-shimmer__actions shimmer" />
    </div>
  );
}

/**
 * Inline image loader for when a post photo is loading.
 * Shows a playful paw animation in place of the image.
 */
export function ImageLoader() {
  return (
    <div className="image-loader">
      <div className="image-loader__bone">🦴</div>
      <p className="image-loader__text">Loading photo...</p>
    </div>
  );
}
