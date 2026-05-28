"use client";

import { Footprints, Clock, MapPin } from "lucide-react";

interface TodaySummaryProps {
  count: number;
  totalMinutes: number;
  totalKm: number;
}

export function TodaySummary({
  count,
  totalMinutes,
  totalKm,
}: TodaySummaryProps) {
  return (
    <div className="walk-summary">
      <div className="walk-summary__item">
        <Footprints size={18} aria-hidden="true" />
        <span className="walk-summary__value">{count}</span>
        <span className="walk-summary__label">
          walk{count !== 1 ? "s" : ""} today
        </span>
      </div>
      <div className="walk-summary__item">
        <Clock size={18} aria-hidden="true" />
        <span className="walk-summary__value">{totalMinutes}</span>
        <span className="walk-summary__label">min total</span>
      </div>
      {totalKm > 0 && (
        <div className="walk-summary__item">
          <MapPin size={18} aria-hidden="true" />
          <span className="walk-summary__value">{totalKm.toFixed(1)}</span>
          <span className="walk-summary__label">km</span>
        </div>
      )}
    </div>
  );
}
