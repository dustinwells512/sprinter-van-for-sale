import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

type GeoData = {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  proxy: boolean;
  hosting: boolean;
};

type FraudSignals = {
  flag: "green" | "yellow" | "red";
  score: number;
  reasons: string[];
  ip: string;
  geo: GeoData | null;
  emailDomain: string;
  isFreeEmail: boolean;
  isDisposableEmail: boolean;
  isDuplicate: boolean;
  duplicateCount: number;
  timeOnPage: number;
};

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "mail.com", "protonmail.com", "zoho.com", "yandex.com",
  "gmx.com", "live.com", "msn.com", "me.com", "mac.com",
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
  "10minutemail.com", "trashmail.com", "sharklasers.com", "guerrillamailblock.com",
  "grr.la", "dispostable.com", "yopmail.com", "maildrop.cc",
]);

const TIMELINE_LABELS: Record<string, string> = {
  "ready-now": "Ready to purchase now",
  "within-30-days": "Within 30 days",
  "1-3-months": "1-3 months",
  "just-researching": "Just researching options",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message, timeline, timeOnPage, referrer } = body;

    if (!name || !email || !message || !timeline) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Get client IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Run fraud checks in parallel
    const [geoData, duplicateInfo] = await Promise.all([
      getGeoData(ip),
      checkDuplicates(email, phone),
    ]);

    // Analyze email domain
    const emailDomain = email.split("@")[1]?.toLowerCase() || "";
    const isFreeEmail = FREE_EMAIL_DOMAINS.has(emailDomain);
    const isDisposableEmail = DISPOSABLE_EMAIL_DOMAINS.has(emailDomain);

    // Calculate fraud score
    const fraud = calculateFraudScore({
      ip,
      geo: geoData,
      emailDomain,
      isFreeEmail,
      isDisposableEmail,
      isDuplicate: duplicateInfo.isDuplicate,
      duplicateCount: duplicateInfo.count,
      timeOnPage: timeOnPage || 0,
      message,
      timeline,
    });

    // Build enriched metadata
    const metadata = {
      submittedAt: new Date().toISOString(),
      referrer: referrer || "",
      timeOnPage: timeOnPage || 0,
      ip,
      geo: geoData,
      emailDomain,
      isFreeEmail,
      isDisposableEmail,
      isDuplicate: duplicateInfo.isDuplicate,
      duplicateCount: duplicateInfo.count,
      fraudFlag: fraud.flag,
      fraudScore: fraud.score,
      fraudReasons: fraud.reasons,
    };

    // Submit to dustylabs shared API
    const apiKey = process.env.DUSTYLABS_API_KEY;
    const apiUrl = process.env.DUSTYLABS_API_URL || "https://dustylabs.vercel.app";
    const formId = process.env.FORM_ID || "sprinter-van-contact";

    const submitRes = await fetch(`${apiUrl}/api/forms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey!,
      },
      body: JSON.stringify({
        formId,
        values: { name, email, phone: phone || "", message, timeline },
        metadata,
      }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.json().catch(() => ({ message: "Submission failed" }));
      return NextResponse.json({ message: err.message }, { status: submitRes.status });
    }

    const { submissionId } = await submitRes.json();

    // Create submission_meta with fraud flag
    const supabase = getSupabase();
    await supabase.schema("forms").from("submission_meta").upsert(
      {
        submission_id: submissionId,
        site_id: "sprinter-van",
        status: "new",
        notes: fraud.flag === "red"
          ? `[AUTO] Flagged as high-risk: ${fraud.reasons.join(", ")}`
          : fraud.flag === "yellow"
          ? `[AUTO] Some concerns: ${fraud.reasons.join(", ")}`
          : null,
      },
      { onConflict: "submission_id" }
    );

    // Send auto-reply email (non-blocking — don't fail the submission if email fails)
    sendAutoReply({ name, email, message, timeline }).catch((e) =>
      console.error("Auto-reply failed:", e)
    );

    return NextResponse.json({ success: true, submissionId });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

async function getGeoData(ip: string): Promise<GeoData | null> {
  if (ip === "unknown" || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.")) {
    return null;
  }
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=country,countryCode,regionName,city,isp,proxy,hosting`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      country: data.country || "",
      countryCode: data.countryCode || "",
      region: data.regionName || "",
      city: data.city || "",
      isp: data.isp || "",
      proxy: data.proxy || false,
      hosting: data.hosting || false,
    };
  } catch {
    return null;
  }
}

async function checkDuplicates(
  email: string,
  phone: string
): Promise<{ isDuplicate: boolean; count: number }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .schema("forms")
      .from("submissions")
      .select("id")
      .eq("site_id", "sprinter-van")
      .or(`values->>email.eq.${email}${phone ? `,values->>phone.eq.${phone}` : ""}`);

    if (error) return { isDuplicate: false, count: 0 };
    return { isDuplicate: (data?.length || 0) > 0, count: data?.length || 0 };
  } catch {
    return { isDuplicate: false, count: 0 };
  }
}

function calculateFraudScore(data: {
  ip: string;
  geo: GeoData | null;
  emailDomain: string;
  isFreeEmail: boolean;
  isDisposableEmail: boolean;
  isDuplicate: boolean;
  duplicateCount: number;
  timeOnPage: number;
  message: string;
  timeline: string;
}): { flag: "green" | "yellow" | "red"; score: number; reasons: string[] } {
  let score = 0; // 0 = perfect, higher = more suspicious
  const reasons: string[] = [];

  // Disposable email: big red flag
  if (data.isDisposableEmail) {
    score += 40;
    reasons.push("Disposable email domain");
  }

  // Free email: slight yellow
  if (data.isFreeEmail && !data.isDisposableEmail) {
    score += 5;
    // Don't add as a reason — most legitimate buyers use gmail
  }

  // Time on page: < 15 seconds is very suspicious for a listing this long
  if (data.timeOnPage < 15) {
    score += 30;
    reasons.push(`Only ${data.timeOnPage}s on page before submitting`);
  } else if (data.timeOnPage < 60) {
    score += 10;
    reasons.push(`${data.timeOnPage}s on page (relatively quick)`);
  }

  // Duplicate submissions
  if (data.duplicateCount >= 3) {
    score += 25;
    reasons.push(`${data.duplicateCount} previous submissions from same contact`);
  } else if (data.isDuplicate) {
    score += 10;
    reasons.push("Repeat submission");
  }

  // Geo: outside US
  if (data.geo) {
    if (data.geo.proxy) {
      score += 30;
      reasons.push("Using proxy/VPN");
    }
    if (data.geo.hosting) {
      score += 35;
      reasons.push("Submitted from hosting/datacenter IP");
    }
    if (data.geo.countryCode && data.geo.countryCode !== "US") {
      score += 15;
      reasons.push(`Located in ${data.geo.country}`);
    }
  }

  // Message quality
  if (data.message.length < 10) {
    score += 15;
    reasons.push("Very short message");
  }
  // Contains suspicious patterns
  const lowerMsg = data.message.toLowerCase();
  if (
    lowerMsg.includes("http://") ||
    lowerMsg.includes("https://") ||
    lowerMsg.includes("bitcoin") ||
    lowerMsg.includes("crypto") ||
    lowerMsg.includes("wire transfer")
  ) {
    score += 25;
    reasons.push("Suspicious content in message");
  }

  // Timeline: "just researching" is lower priority but not fraud
  if (data.timeline === "just-researching") {
    score += 5;
    reasons.push("Just researching (not ready to buy)");
  }

  // Determine flag
  let flag: "green" | "yellow" | "red";
  if (score >= 40) {
    flag = "red";
  } else if (score >= 15) {
    flag = "yellow";
  } else {
    flag = "green";
  }

  // Green = no reasons shown
  if (flag === "green" && reasons.length === 0) {
    reasons.push("No concerns detected");
  }

  return { flag, score, reasons };
}

async function sendAutoReply(data: {
  name: string;
  email: string;
  message: string;
  timeline: string;
}) {
  const sgKey = process.env.SENDGRID_API_KEY;
  if (!sgKey) {
    console.warn("SENDGRID_API_KEY not set, skipping auto-reply");
    return;
  }

  const firstName = data.name.split(" ")[0];
  const timelineLabel = TIMELINE_LABELS[data.timeline] || data.timeline;

  // Generate contextual line based on their message
  const contextLine = generateContextLine(data.message);

  const subject = `Thanks for your interest in the Sprinter Van, ${firstName}`;
  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <p>Hi ${firstName},</p>

  <p>Thanks for reaching out about the 2020 Mercedes Sprinter — I got your message.</p>

  ${contextLine ? `<p>${contextLine}</p>` : ""}

  <p>You mentioned your timeline is <strong>${timelineLabel.toLowerCase()}</strong> — that's great to know.</p>

  <p>A few quick questions to help move things along:</p>

  <ol style="line-height: 1.8;">
    <li><strong>What draws you to this particular van?</strong> Whether it's the off-road setup, the interior, or something else — it helps me know what to focus on.</li>
    <li><strong>Have you owned a Sprinter or done van life before?</strong> Happy to go deeper on the technical details if that's helpful.</li>
    <li><strong>Are you in Colorado or would you be traveling for pickup?</strong> The van is on the Western Slopes and I'm flexible on scheduling viewings.</li>
  </ol>

  <p>Just reply to this email and we'll go from there.</p>

  <p style="margin-top: 2rem;">
    Talk soon,<br>
    <strong>Dustin</strong>
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
  <p style="font-size: 0.85rem; color: #999;">
    2020 Mercedes Sprinter 2500 &bull; High Roof &bull; 170" Extended WB<br>
    <a href="https://sprinter.dustinwells.com" style="color: #5B7C99;">View full listing</a>
  </p>
</div>`;

  const textBody = `Hi ${firstName},

Thanks for reaching out about the 2020 Mercedes Sprinter — I got your message.

${contextLine || ""}

You mentioned your timeline is ${timelineLabel.toLowerCase()} — that's great to know.

A few quick questions to help move things along:

1. What draws you to this particular van? Whether it's the off-road setup, the interior, or something else — it helps me know what to focus on.
2. Have you owned a Sprinter or done van life before? Happy to go deeper on the technical details if that's helpful.
3. Are you in Colorado or would you be traveling for pickup? The van is on the Western Slopes and I'm flexible on scheduling viewings.

Just reply to this email and we'll go from there.

Talk soon,
Dustin

---
2020 Mercedes Sprinter 2500 | High Roof | 170" Extended WB
View full listing: https://sprinter.dustinwells.com`;

  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sgKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: data.email, name: data.name }] }],
      from: { email: "dustin@dustinwells.com", name: "Dustin Wells" },
      reply_to: { email: "dustin+sprinter@dustinwells.com", name: "Dustin Wells" },
      subject,
      content: [
        { type: "text/plain", value: textBody },
        { type: "text/html", value: htmlBody },
      ],
    }),
  });
}

function generateContextLine(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("off-road") || lower.includes("offroad") || lower.includes("trail") || lower.includes("overland")) {
    return "I can tell you're interested in the off-road capabilities — this van was built for exactly that kind of adventure.";
  }
  if (lower.includes("battery") || lower.includes("solar") || lower.includes("electrical") || lower.includes("power")) {
    return "Great that you're looking at the electrical system — the 800Ah setup is genuinely one of the strongest builds I've seen.";
  }
  if (lower.includes("kitchen") || lower.includes("interior") || lower.includes("cabinets") || lower.includes("tommy")) {
    return "The Bennett interior by Tommy Camper Vans is really special — the craftsmanship stands out in person.";
  }
  if (lower.includes("price") || lower.includes("offer") || lower.includes("cost") || lower.includes("budget")) {
    return "I'm always happy to have a straightforward conversation about pricing.";
  }
  if (lower.includes("view") || lower.includes("see") || lower.includes("visit") || lower.includes("look at")) {
    return "Nothing beats seeing it in person — happy to set up a time that works for you.";
  }
  if (lower.includes("family") || lower.includes("kids") || lower.includes("wife") || lower.includes("partner")) {
    return "It's great to hear you're considering this for the family — there's something special about van adventures together.";
  }

  return "";
}
