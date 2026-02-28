"use client";

import { useEffect } from "react";

const STORAGE_KEY = "sprinter_visits";

export function getVisitData(): { visitCount: number; firstVisit: string; lastVisit: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { visitCount: 0, firstVisit: "", lastVisit: "" };
}

export default function VisitTracker() {
  useEffect(() => {
    try {
      const now = new Date().toISOString();
      const existing = getVisitData();

      const updated = {
        visitCount: existing.visitCount + 1,
        firstVisit: existing.firstVisit || now,
        lastVisit: now,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  return null;
}
