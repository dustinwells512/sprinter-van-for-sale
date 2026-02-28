"use client";

import { useState, useRef, useCallback } from "react";
import type { Prospect } from "./AdminDashboard";
import { TIMELINE_LABELS } from "./AdminDashboard";

const STATUSES = ["new", "contacted", "interested", "closed"] as const;
const RISK_LEVELS = ["green", "yellow", "red"] as const;
const RISK_LABELS: Record<string, string> = { green: "OK", yellow: "Caution", red: "Risk" };

export default function ProspectRow({ prospect }: { prospect: Prospect }) {
  const autoRisk = prospect.metadata?.fraudFlag ?? "green";
  const [status, setStatus] = useState(prospect.meta_status ?? "new");
  const [risk, setRisk] = useState(prospect.meta_risk ?? autoRisk);
  const [notes, setNotes] = useState(prospect.meta_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (newStatus: string, newNotes: string, newRisk?: string) => {
      setSaving(true);
      setSaved(false);

      const body: Record<string, string> = { status: newStatus, notes: newNotes };
      if (newRisk !== undefined) body.risk = newRisk;

      await fetch(`/api/admin/submissions/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
  const fraudReasons = meta?.fraudReasons ?? [];
  const geo = meta?.geo;
  const timeOnPage = meta?.timeOnPage;
  const visitCount = meta?.visitCount;
  const firstVisit = meta?.firstVisit;
  const timeline = prospect.values.timeline;

  return (
    <>
      <tr className="prospect-main-row">
        <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>{dateStr}</td>
        <td>
          <select
            className={`risk-select ${risk}`}
            value={risk}
            title={fraudReasons.join("\n")}
            onChange={(e) => {
              setRisk(e.target.value);
              save(status, notes, e.target.value);
            }}
          >
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {RISK_LABELS[r]}
              </option>
            ))}
          </select>
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
                {visitCount !== undefined && visitCount > 1 && (
                  <span style={{ color: "#155724" }}>
                    {visitCount} visits{firstVisit ? ` (first: ${new Date(firstVisit).toLocaleDateString("en-US", { month: "short", day: "numeric" })})` : ""}
                  </span>
                )}
                {visitCount !== undefined && visitCount <= 1 && (
                  <span>1st visit</span>
                )}
                {meta?.isDuplicate && (
                  <span style={{ color: "#856404" }}>
                    Repeat ({meta.duplicateCount} prev)
                  </span>
                )}
                {fraudReasons.length > 0 && risk !== "green" && (
                  <span style={{ color: risk === "red" ? "#dc3545" : "#856404", fontStyle: "italic" }}>
                    {fraudReasons.join("; ")}
                  </span>
                )}
                {!geo && timeOnPage === undefined && risk === "green" && (
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
