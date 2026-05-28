"use client";

import { useState, FormEvent, useRef } from "react";
import { Dog } from "@/types";
import { Camera, X } from "lucide-react";

interface NewPostFormProps {
  dogs: Dog[];
  posting: boolean;
  onSubmit: (data: {
    dogId: string;
    dogName: string;
    dogBreed: string;
    caption: string;
    tags: string[];
    photoFile: File;
  }) => void;
  onCancel: () => void;
}

export function NewPostForm({
  dogs,
  posting,
  onSubmit,
  onCancel,
}: NewPostFormProps) {
  const [dogId, setDogId] = useState(dogs[0]?.id ?? "");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedDog = dogs.find((d) => d.id === dogId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!photoFile || !selectedDog || !caption.trim()) return;
    const parsedTags = tags
      .split(/[\s,#]+/)
      .filter(Boolean)
      .map((t) => t.toLowerCase());
    onSubmit({
      dogId: selectedDog.id,
      dogName: selectedDog.name,
      dogBreed: selectedDog.breed,
      caption: caption.trim(),
      tags: parsedTags,
      photoFile,
    });
  };

  return (
    <div className="new-post-form">
      <div className="new-post-form__header">
        <h3>New Post</h3>
        <button className="new-post-form__close" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="new-post-form__body">
        <div className="new-post-form__field">
          <label className="new-post-form__label">Dog</label>
          <select
            className="new-post-form__select"
            value={dogId}
            onChange={(e) => setDogId(e.target.value)}
          >
            {dogs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="new-post-form__field">
          <label className="new-post-form__label">Photo</label>
          {preview ? (
            <div className="new-post-form__preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" />
              <button
                type="button"
                className="new-post-form__remove-photo"
                onClick={removePhoto}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="new-post-form__photo-btn"
              onClick={() => fileRef.current?.click()}
            >
              <Camera size={20} />
              <span>Add Photo</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
        </div>

        <div className="new-post-form__field">
          <label className="new-post-form__label">Caption</label>
          <textarea
            className="new-post-form__textarea"
            placeholder="What's your pup up to?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={280}
            rows={3}
          />
          <span className="new-post-form__count">{caption.length}/280</span>
        </div>

        <div className="new-post-form__field">
          <label className="new-post-form__label">Tags (optional)</label>
          <input
            type="text"
            className="new-post-form__input"
            placeholder="e.g. walk, park, happy"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="new-post-form__submit"
          disabled={posting || !photoFile || !caption.trim()}
        >
          {posting ? "Posting..." : "Share Post"}
        </button>
      </form>
    </div>
  );
}
