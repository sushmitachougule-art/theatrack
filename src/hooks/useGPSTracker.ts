"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GeoPoint } from "@/types";

/**
 * GPS Walk Tracker — Web Geolocation API Implementation
 *
 * === How it works on web ===
 * Uses navigator.geolocation.watchPosition() which provides continuous
 * location updates while the browser tab is active. The browser delegates
 * to the device's GPS/GNSS hardware, Wi-Fi positioning, or cell tower
 * triangulation depending on device capabilities and environment.
 *
 * === Accuracy ===
 * - GPS hardware (outdoors): 3–5 meters typical
 * - Wi-Fi triangulation (indoors): 20–50 meters
 * - Cell tower (fallback): 100–300 meters
 * - enableHighAccuracy: true forces GPS/GNSS when available, yielding
 *   best outdoor accuracy (~3–10m) at the cost of more battery drain.
 *
 * === Battery Optimization Strategy ===
 * 1. Use watchPosition() (not repeated getCurrentPosition polling) — the
 *    browser/OS handles the GPS hardware efficiently with movement-based
 *    wake-up rather than timed polling.
 * 2. Filter points: Only record points that differ by ≥5m from the last
 *    recorded point. Prevents battery waste on stationary positions and
 *    reduces Firestore storage.
 * 3. maximumAge: 5000ms — accept cached positions up to 5 seconds old,
 *    reducing GPS chip wake-ups for slow walkers.
 * 4. Record a point at most every 3 seconds even if GPS fires faster.
 *    Typical dog walks record 10–20 points/minute, not 60.
 * 5. Background: Web apps CANNOT track in background on iOS. On Android
 *    Chrome, watchPosition may continue briefly but is not guaranteed.
 *    The app warns users to keep the screen on or use PWA mode.
 *
 * === Distance Calculation ===
 * Uses the Haversine formula between consecutive points to calculate
 * total walked distance. Accumulated incrementally for real-time display.
 *
 * === Integration Plan ===
 * The hook returns a GeoPoint[] array and total distance. When the walk
 * is "stopped", the points are saved to a `walkRoutes` subcollection
 * linked to the walkLog entry. A polyline can be rendered on a map later.
 */

interface UseGPSTrackerOptions {
  minDistanceMeters?: number; // min distance between recorded points (default 5m)
  minIntervalMs?: number; // min time between recorded points (default 3000ms)
}

interface GPSTrackerState {
  isTracking: boolean;
  points: GeoPoint[];
  distanceMeters: number;
  currentPosition: GeoPoint | null;
  error: string | null;
  elapsedSeconds: number;
}

// Haversine formula — distance between two lat/lng in meters
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGPSTracker(options: UseGPSTrackerOptions = {}) {
  const { minDistanceMeters = 5, minIntervalMs = 3000 } = options;

  const [state, setState] = useState<GPSTrackerState>({
    isTracking: false,
    points: [],
    distanceMeters: 0,
    currentPosition: null,
    error: null,
    elapsedSeconds: 0,
  });

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecordedRef = useRef<{ point: GeoPoint; time: number } | null>(
    null,
  );
  const distanceRef = useRef(0);
  const pointsRef = useRef<GeoPoint[]>([]);
  const startTimeRef = useRef<number>(0);

  // Check if Geolocation is available
  const isSupported =
    typeof window !== "undefined" && "geolocation" in navigator;

  const startTracking = useCallback(() => {
    if (!isSupported) {
      setState((s) => ({
        ...s,
        error: "Geolocation is not supported by this browser.",
      }));
      return;
    }

    // Reset state
    pointsRef.current = [];
    distanceRef.current = 0;
    lastRecordedRef.current = null;
    startTimeRef.current = Date.now();

    setState({
      isTracking: true,
      points: [],
      distanceMeters: 0,
      currentPosition: null,
      error: null,
      elapsedSeconds: 0,
    });

    // Start elapsed time counter
    timerRef.current = setInterval(() => {
      setState((s) => ({
        ...s,
        elapsedSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        const point: GeoPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: now,
          accuracy: position.coords.accuracy,
        };

        // Always update current position (for display)
        setState((s) => ({ ...s, currentPosition: point, error: null }));

        // Filter: skip if too close in time
        if (
          lastRecordedRef.current &&
          now - lastRecordedRef.current.time < minIntervalMs
        ) {
          return;
        }

        // Filter: skip if accuracy is too poor (>50m is unreliable)
        if (point.accuracy > 50) return;

        // Filter: skip if too close to last point
        if (lastRecordedRef.current) {
          const dist = haversineDistance(
            lastRecordedRef.current.point.lat,
            lastRecordedRef.current.point.lng,
            point.lat,
            point.lng,
          );
          if (dist < minDistanceMeters) return;

          // Add to total distance
          distanceRef.current += dist;
        }

        // Record this point
        pointsRef.current = [...pointsRef.current, point];
        lastRecordedRef.current = { point, time: now };

        setState((s) => ({
          ...s,
          points: pointsRef.current,
          distanceMeters: distanceRef.current,
        }));
      },
      (err) => {
        let errorMsg = "Location error";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg =
              "Location permission denied. Enable it in browser settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = "Location unavailable. Try moving outdoors.";
            break;
          case err.TIMEOUT:
            errorMsg = "Location request timed out. Retrying...";
            break;
        }
        setState((s) => ({ ...s, error: errorMsg }));
      },
      {
        enableHighAccuracy: true, // Use GPS chip for best accuracy
        maximumAge: 5000, // Accept cached positions up to 5s old (saves battery)
        timeout: 15000, // Give device 15s to get a fix
      },
    );
  }, [isSupported, minDistanceMeters, minIntervalMs]);

  const stopTracking = useCallback((): {
    points: GeoPoint[];
    distanceMeters: number;
    durationSeconds: number;
  } => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const result = {
      points: pointsRef.current,
      distanceMeters: distanceRef.current,
      durationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
    };

    setState((s) => ({ ...s, isTracking: false }));
    return result;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    isSupported,
    startTracking,
    stopTracking,
  };
}
