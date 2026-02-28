import { getSupabase } from "@/app/lib/supabase";
import ProspectRow from "./ProspectRow";
import LogoutButton from "./LogoutButton";

export type Prospect = {
  id: string;
  form_id: string;
  site_id: string;
  values: {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
  };
  metadata: Record<string, unknown> | null;
  created_at: string;
  meta_status: string | null;
  meta_notes: string | null;
};

export default async function AdminDashboard() {
  const supabase = getSupabase();

  const { data: submissions, error } = await supabase
    .schema("forms")
    .from("submissions")
    .select("*")
    .eq("site_id", "sprinter-van")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="admin-layout">
        <div className="admin-header">
          <h1>Sprinter Van - Admin</h1>
        </div>
        <div className="admin-content">
          <p>Error loading submissions: {error.message}</p>
        </div>
      </div>
    );
  }

  // Fetch meta for all submissions
  const ids = (submissions ?? []).map((s) => s.id);
  const { data: metas } = ids.length
    ? await supabase
        .schema("forms")
        .from("submission_meta")
        .select("*")
        .in("submission_id", ids)
    : { data: [] };

  const metaMap = new Map(
    (metas ?? []).map((m) => [m.submission_id, m])
  );

  const prospects: Prospect[] = (submissions ?? []).map((s) => {
    const meta = metaMap.get(s.id);
    return {
      ...s,
      meta_status: meta?.status ?? "new",
      meta_notes: meta?.notes ?? null,
    };
  });

  const statusCounts = { new: 0, contacted: 0, interested: 0, closed: 0 };
  for (const p of prospects) {
    const s = (p.meta_status ?? "new") as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  }

  return (
    <div className="admin-layout">
      <div className="admin-header">
        <h1>Sprinter Van - Prospects</h1>
        <LogoutButton />
      </div>
      <div className="admin-content">
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-value">{prospects.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-value">{statusCounts.new}</div>
            <div className="stat-label">New</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-value">{statusCounts.contacted}</div>
            <div className="stat-label">Contacted</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-value">{statusCounts.interested}</div>
            <div className="stat-label">Interested</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-value">{statusCounts.closed}</div>
            <div className="stat-label">Closed</div>
          </div>
        </div>

        {prospects.length === 0 ? (
          <div className="admin-empty">
            <p>No submissions yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => (
                  <ProspectRow key={p.id} prospect={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
