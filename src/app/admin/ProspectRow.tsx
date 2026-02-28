"use client";

import { useState, useRef, useCallback } from "react";
import type { Prospect } from "./AdminDashboard";

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
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <tr>
      <td style={{ whiteSpace: "nowrap" }}>{dateStr}</td>
      <td>{prospect.values.name ?? ""}</td>
      <td>
        <a href={`mailto:${prospect.values.email}`}>{prospect.values.email}</a>
      </td>
      <td>{prospect.values.phone ?? ""}</td>
      <td style={{ maxWidth: 300 }}>{prospect.values.message ?? ""}</td>
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
      <td>
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
      </td>
    </tr>
  );
}
