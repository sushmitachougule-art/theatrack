"use client";

import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { useWalks } from "@/hooks/useWalks";
import { useAuth } from "@/hooks/useAuth";
import { TodaySummary } from "./TodaySummary";
import { WeeklyChart } from "./WeeklyChart";
import { LogWalkModal } from "./LogWalkModal";
import { WalkHistory } from "./WalkHistory";
import { GPSWalkTracker } from "./GPSWalkTracker";
import { saveWalkRoute } from "@/lib/repositories";

export function WalksTab() {
  const {
    dogs,
    recentWalks,
    weekWalks,
    todayStats,
    loading,
    saving,
    logWalk,
    removeWalk,
  } = useWalks();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [showGPS, setShowGPS] = useState(false);

  if (loading) {
    return (
      <div className="walks-tab walks-tab--loading">
        <div className="spinner" aria-label="Loading walks..." />
      </div>
    );
  }

  if (dogs.length === 0) {
    return (
      <div className="walks-tab walks-tab--empty">
        <p>Add a dog first to start logging walks!</p>
      </div>
    );
  }

  return (
    <div className="walks-tab">
      {/* GPS Tracker overlay */}
      {showGPS && (
        <GPSWalkTracker
          dogs={dogs}
          saving={saving}
          onComplete={async (data) => {
            const walkId = await logWalk({
              dogId: data.dogId,
              durationMinutes: data.durationMinutes,
              distanceKm: data.distanceKm,
              moodAfter: data.moodAfter,
              notes: data.notes,
            });
            // Save GPS route if we have points
            if (data.gpsPoints.length > 1 && walkId && user) {
              await saveWalkRoute(
                walkId,
                user.uid,
                data.gpsPoints,
                data.gpsDistanceMeters,
              );
            }
            setShowGPS(false);
          }}
          onCancel={() => setShowGPS(false)}
        />
      )}

      {/* Header with add buttons */}
      {!showGPS && (
        <>
          <div className="walks-tab__header">
            <h3 className="walks-tab__title">Walk Log</h3>
            <div className="walks-tab__actions">
              <button
                className="walks-tab__gps-btn"
                onClick={() => setShowGPS(true)}
              >
                <MapPin size={14} />
                GPS
              </button>
              <button
                className="walks-tab__add-btn"
                onClick={() => setShowModal(true)}
              >
                <Plus size={16} />
                Log Walk
              </button>
            </div>
          </div>

          {/* Today's summary */}
          <TodaySummary
            count={todayStats.count}
            totalMinutes={todayStats.totalMinutes}
            totalKm={todayStats.totalKm}
          />

          {/* Weekly bar chart */}
          <WeeklyChart walks={weekWalks} />

          {/* Walk history */}
          <WalkHistory walks={recentWalks} dogs={dogs} onDelete={removeWalk} />

          {/* Log Walk Modal */}
          {showModal && (
            <LogWalkModal
              dogs={dogs}
              saving={saving}
              onSave={async (data) => {
                await logWalk(data);
                setShowModal(false);
              }}
              onClose={() => setShowModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
