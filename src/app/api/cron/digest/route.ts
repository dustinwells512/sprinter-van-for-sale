import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

const RISK_LABELS: Record<string, string> = {
  green: "OK",
  yellow: "Caution",
  red: "Risk",
};

const TIMELINE_LABELS: Record<string, string> = {
  "ready-now": "Ready now",
  "within-30-days": "Within 30 days",
  "1-3-months": "1-3 months",
  "just-researching": "Researching",
};

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or with the right secret)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Get submissions from the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: submissions, error } = await supabase
    .schema("forms")
    .from("submissions")
    .select("*")
    .eq("site_id", "sprinter-van")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Digest query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!submissions || submissions.length === 0) {
    // No new submissions — don't send an email
    return NextResponse.json({ sent: false, reason: "No new submissions" });
  }

  // Fetch meta for these submissions
  const ids = submissions.map((s) => s.id);
  const { data: metas } = await supabase
    .schema("forms")
    .from("submission_meta")
    .select("*")
    .in("submission_id", ids);

  const metaMap = new Map(
    (metas ?? []).map((m) => [m.submission_id, m])
  );

  // Also get total counts for context
  const { count: totalCount } = await supabase
    .schema("forms")
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("site_id", "sprinter-van");

  // Build the digest
  const riskCounts = { green: 0, yellow: 0, red: 0 };
  const rows: string[] = [];
  const htmlRows: string[] = [];

  for (const s of submissions) {
    const meta = metaMap.get(s.id);
    const risk = (meta?.risk_override ?? s.metadata?.fraudFlag ?? "green") as keyof typeof riskCounts;
    if (risk in riskCounts) riskCounts[risk]++;

    const name = s.values?.name ?? "Unknown";
    const email = s.values?.email ?? "";
    const timeline = s.values?.timeline ?? "";
    const message = s.values?.message ?? "";
    const visitCount = s.metadata?.visitCount;
    const timeOnPage = s.metadata?.timeOnPage;
    const geo = s.metadata?.geo;
    const location = geo
      ? [geo.city, geo.region].filter(Boolean).join(", ")
      : "";

    // Text row
    rows.push(
      `${RISK_LABELS[risk] ?? risk} | ${name} | ${email} | ${TIMELINE_LABELS[timeline] ?? timeline}` +
        (location ? ` | ${location}` : "") +
        (visitCount && visitCount > 1 ? ` | ${visitCount} visits` : "")
    );

    // HTML row
    const riskColor = risk === "red" ? "#dc3545" : risk === "yellow" ? "#856404" : "#28a745";
    const msgPreview = message.length > 80 ? message.slice(0, 80) + "..." : message;

    htmlRows.push(`
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;color:${riskColor};font-weight:600;font-size:13px;">
          ${RISK_LABELS[risk] ?? risk}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${escapeHtml(name)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <a href="mailto:${escapeHtml(email)}" style="color:#5B7C99;">${escapeHtml(email)}</a>
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${escapeHtml(TIMELINE_LABELS[timeline] ?? timeline)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;color:#666;">${escapeHtml(msgPreview)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#999;">
          ${location ? escapeHtml(location) : "—"}
          ${visitCount && visitCount > 1 ? `<br>${visitCount} visits` : ""}
          ${timeOnPage ? `<br>${timeOnPage}s on page` : ""}
        </td>
      </tr>
    `);
  }

  const count = submissions.length;
  const subject = `Sprinter Van: ${count} new lead${count === 1 ? "" : "s"} today`;

  const htmlBody = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:0 auto;color:#333;">
  <h2 style="margin-bottom:4px;">Sprinter Van — Daily Digest</h2>
  <p style="color:#666;margin-top:0;">
    ${count} new submission${count === 1 ? "" : "s"} in the last 24 hours
    &bull; ${totalCount ?? "?"} total all-time
  </p>

  <div style="display:flex;gap:16px;margin:16px 0;">
    <div style="background:#d4edda;padding:8px 16px;border-radius:8px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:#28a745;">${riskCounts.green}</div>
      <div style="font-size:11px;color:#155724;">Clean</div>
    </div>
    ${riskCounts.yellow > 0 ? `
    <div style="background:#fff3cd;padding:8px 16px;border-radius:8px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:#856404;">${riskCounts.yellow}</div>
      <div style="font-size:11px;color:#856404;">Caution</div>
    </div>` : ""}
    ${riskCounts.red > 0 ? `
    <div style="background:#f8d7da;padding:8px 16px;border-radius:8px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:#dc3545;">${riskCounts.red}</div>
      <div style="font-size:11px;color:#dc3545;">Flagged</div>
    </div>` : ""}
  </div>

  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="background:#f8f9fa;">
        <th style="padding:8px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #dee2e6;">Risk</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #dee2e6;">Name</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #dee2e6;">Email</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #dee2e6;">Timeline</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #dee2e6;">Message</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #dee2e6;">Intel</th>
      </tr>
    </thead>
    <tbody>
      ${htmlRows.join("")}
    </tbody>
  </table>

  <p style="margin-top:24px;">
    <a href="https://sprinter.dustinwells.com/admin" style="background:#5B7C99;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
      Open Admin Dashboard
    </a>
  </p>

  <hr style="border:none;border-top:1px solid #eee;margin:2rem 0;">
  <p style="font-size:12px;color:#999;">
    Daily digest from sprinter.dustinwells.com &bull; Sent at 8:00 AM MT
  </p>
</div>`;

  const textBody = `Sprinter Van — Daily Digest
${count} new submission${count === 1 ? "" : "s"} in the last 24 hours (${totalCount ?? "?"} total)

${rows.join("\n")}

View all: https://sprinter.dustinwells.com/admin`;

  // Send via SendGrid
  const sgKey = process.env.SENDGRID_API_KEY;
  if (!sgKey) {
    return NextResponse.json({ sent: false, reason: "SENDGRID_API_KEY not set" });
  }

  const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sgKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: "dustin+sprinter@dustinwells.com", name: "Dustin Wells" }],
        },
      ],
      from: { email: "dustin@dustinwells.com", name: "Sprinter Van Digest" },
      subject,
      content: [
        { type: "text/plain", value: textBody },
        { type: "text/html", value: htmlBody },
      ],
    }),
  });

  return NextResponse.json({
    sent: true,
    count,
    sgStatus: sgRes.status,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
