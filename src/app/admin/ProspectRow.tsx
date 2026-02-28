"use client";

import { useState, useRef, useCallback } from "react";
import type { Prospect } from "./AdminDashboard";
import { TIMELINE_LABELS } from "./AdminDashboard";

const STATUSES = ["new", "contacted", "interested", "closed"] as const;

export default function ProspectRow({ prospect }: { prospect: Prospect }) {
  const [status, setStatus] = useState(prospect.meta_status ?? "new");
  const [notes, setNotes] = useState(prospect.meta_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (newStatus: string, newNotes: string) => {
      setSaving(true);
      setSaved(false);

      await fetch(`/api/admin/submissions/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: newNotes }),
      });

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [prospect.id]
  );

  const debouncedSaveNotes = useCallback(
    (newNotes: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(status, newNotes), 800);
    },
    [status, save]
  );

  const date = new Date(prospect.created_at);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const meta = prospect.metadata;
  const fraudFlag = meta?.fraudFlag ?? "green";
  const fraudReasons = meta?.fraudReasons ?? [];
  const geo = meta?.geo;
  const timeOnPage = meta?.timeOnPage;
  const timeline = prospect.values.timeline;

  return (
    <>
      <tr className="prospect-main-row">
        <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>{dateStr}</td>
        <td>
          <span
            className={`fraud-flag ${fraudFlag}`}
            title={fraudReasons.join("\n")}
          >
            <span className={`fraud-dot ${fraudFlag}`} />
            {fraudFlag === "green" ? "OK" : fraudFlag === "yellow" ? "Caution" : "Risk"}
          </span>
        </td>
        <td style={{ fontWeight: 600 }}>{prospect.values.name ?? ""}</td>
        <td>
          <a href={`mailto:${prospect.values.email}`} style={{ color: "#5B7C99" }}>
            {prospect.values.email}
          </a>
          {meta?.emailDomain && (
            <div className="meta-details">
              <span>{meta.isDisposableEmail ? "Disposable" : meta.isFreeEmail ? "Free email" : meta.emailDomain}</span>
            </div>
          )}
        </td>
        <td>{prospect.values.phone ?? ""}</td>
        <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
          {timeline ? TIMELINE_LABELS[timeline] || timeline : "—"}
        </td>
        <td style={{ fontSize: "0.85rem" }}>{prospect.values.message ?? ""}</td>
        <td>
          <select
            className="status-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              save(e.target.value, notes);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </td>
      </tr>
      <tr className="prospect-detail-row">
        <td colSpan={8}>
          <div className="prospect-detail">
            <div className="prospect-intel">
              <span className="detail-label">Intel</span>
              <div className="meta-details inline">
                {geo && (
                  <span>
                    {[geo.city, geo.region, geo.countryCode].filter(Boolean).join(", ")}
                  </span>
                )}
                {geo?.isp && <span>{geo.isp}</span>}
                {geo?.proxy && <span style={{ color: "#dc3545" }}>VPN/Proxy</span>}
                {geo?.hosting && <span style={{ color: "#dc3545" }}>Datacenter IP</span>}
                {timeOnPage !== undefined && (
                  <span>{timeOnPage < 60 ? `${timeOnPage}s` : `${Math.floor(timeOnPage / 60)}m ${timeOnPage % 60}s`} on page</span>
                )}
                {meta?.isDuplicate && (
                  <span style={{ color: "#856404" }}>
                    Repeat ({meta.duplicateCount} prev)
                  </span>
                )}
                {fraudReasons.length > 0 && fraudFlag !== "green" && (
                  <span style={{ color: fraudFlag === "red" ? "#dc3545" : "#856404", fontStyle: "italic" }}>
                    {fraudReasons.join("; ")}
                  </span>
                )}
                {!geo && timeOnPage === undefined && fraudFlag === "green" && (
                  <span style={{ color: "#999" }}>No intel available</span>
                )}
              </div>
            </div>
            <div className="prospect-notes">
              <span className="detail-label">Notes</span>
              <textarea
                className="notes-textarea"
                value={notes}
                placeholder="Add notes..."
                onChange={(e) => {
                  setNotes(e.target.value);
                  debouncedSaveNotes(e.target.value);
                }}
              />
              {saving && <div className="save-indicator">Saving...</div>}
              {saved && <div className="save-indicator">Saved</div>}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
