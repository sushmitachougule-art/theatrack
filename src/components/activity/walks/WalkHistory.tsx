"use client";

import { WalkLog, Dog } from "@/types";
import { WalkCard } from "./WalkCard";

interface WalkHistoryProps {
  walks: WalkLog[];
  dogs: Dog[];
  onDelete: (id: string) => void;
}

export function WalkHistory({ walks, dogs, onDelete }: WalkHistoryProps) {
  if (walks.length === 0) {
    return (
      <div className="walk-history walk-history--empty">
        <p>No walks logged yet. Tap &quot;+ Log Walk&quot; to get started!</p>
      </div>
    );
  }

  const dogMap = new Map(dogs.map((d) => [d.id, d.name]));

  return (
    <div className="walk-history">
      <h3 className="walk-history__title">Recent Walks</h3>
      <div className="walk-history__list">
        {walks.map((walk) => (
          <WalkCard
            key={walk.id}
            walk={walk}
            dogName={dogMap.get(walk.dogId) ?? "Unknown"}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
