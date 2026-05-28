"use client";

import { Dog } from "@/types";

interface DogSelectorProps {
  dogs: Dog[];
  activeDogId: string | null;
  onSelect: (dogId: string) => void;
}

export function DogSelector({ dogs, activeDogId, onSelect }: DogSelectorProps) {
  if (!dogs || dogs.length <= 1) return null;

  return (
    <div className="training-dog-selector">
      {dogs.map((dog) => (
        <button
          key={dog.id}
          className={`training-dog-selector__pill ${dog.id === activeDogId ? "training-dog-selector__pill--active" : ""}`}
          onClick={() => onSelect(dog.id)}
        >
          {dog.name}
        </button>
      ))}
    </div>
  );
}
