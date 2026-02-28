"use client";

import { useState } from "react";
import type { Prospect } from "./AdminDashboard";
import ProspectRow from "./ProspectRow";

type Filter =
  | null
  | "new"
  | "contacted"
  | "interested"
  | "closed";

export default function ProspectList({ prospects: initial }: { prospects: Prospect[] }) {
  const [prospects, setProspects] = useState(initial);
  const [filter, setFilter] = useState<Filter>(null);

  const handleDelete = (id: string) => {
    setProspects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setProspects((prev) =>
      prev.map((p) => p.id === id ? { ...p, meta_status: newStatus } : p)
    );
  };

  const statusCounts = { new: 0, contacted: 0, interested: 0, closed: 0 };
  for (const p of prospects) {
    const s = (p.meta_status ?? "new") as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  }

  const filtered = filter
    ? prospects.filter((p) => (p.meta_status ?? "new") === filter)
    : prospects;

  function card(
    label: string,
    value: number,
    key: Filter,
    color?: string,
  ) {
    const active = filter === key;
    return (
      <div
        className={`admin-stat-card${active ? " active" : ""}`}
        onClick={() => setFilter(active ? null : key)}
      >
        <div className="stat-value" style={color ? { color } : undefined}>
          {value}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-stats">
        {card("Total", prospects.length, null)}
        {card("New", statusCounts.new, "new")}
        {card("Contacted", statusCounts.contacted, "contacted")}
        {card("Interested", statusCounts.interested, "interested")}
        {card("Closed", statusCounts.closed, "closed")}
      </div>

      {filter && (
        <div className="admin-filter-badge">
          Showing: <strong>{filter}</strong>
          <button onClick={() => setFilter(null)}>Clear</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <p>{filter ? `No ${filter} submissions.` : "No submissions yet."}</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Risk</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Timeline</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProspectRow key={p.id} prospect={p} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
