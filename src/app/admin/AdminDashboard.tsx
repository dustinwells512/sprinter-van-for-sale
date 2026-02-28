import { getSupabase } from "@/app/lib/supabase";
import ProspectList from "./ProspectList";
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
    timeline?: string;
  };
  metadata: {
    timeOnPage?: number;
    ip?: string;
    geo?: {
      country?: string;
      countryCode?: string;
      region?: string;
      city?: string;
      isp?: string;
      proxy?: boolean;
      hosting?: boolean;
    } | null;
    emailDomain?: string;
    isFreeEmail?: boolean;
    isDisposableEmail?: boolean;
    isDuplicate?: boolean;
    duplicateCount?: number;
    fraudFlag?: "green" | "yellow" | "red";
    fraudScore?: number;
    fraudReasons?: string[];
  } | null;
  created_at: string;
  meta_status: string | null;
  meta_notes: string | null;
};

const TIMELINE_LABELS: Record<string, string> = {
  "ready-now": "Ready now",
  "within-30-days": "Within 30 days",
  "1-3-months": "1-3 months",
  "just-researching": "Researching",
};

export { TIMELINE_LABELS };

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

  return (
    <div className="admin-layout">
      <div className="admin-header">
        <h1>Sprinter Van - Prospects</h1>
        <LogoutButton />
      </div>
      <div className="admin-content">
        <ProspectList prospects={prospects} />
      </div>
    </div>
  );
}
