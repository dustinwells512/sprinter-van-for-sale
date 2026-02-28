"use client";

import { useState, useEffect, useRef, FormEvent } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const loadTimeRef = useRef(Date.now());

  // Track page load time for time-on-page metric
  useEffect(() => {
    loadTimeRef.current = Date.now();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot check — if filled, silently "succeed"
    if (data.get("website")) {
      setStatus("success");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    const timeOnPage = Math.round((Date.now() - loadTimeRef.current) / 1000);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || "",
          message: data.get("message"),
          timeline: data.get("timeline"),
          timeOnPage,
          referrer: document.referrer || "",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Submission failed");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="form-success">
        <svg className="form-success-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3>Message Sent!</h3>
        <p>
          Thanks for reaching out. Check your inbox &mdash; we&apos;ve sent a
          follow-up with a couple of questions so we can prepare for our conversation.
        </p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      {status === "error" && <div className="form-error">{errorMsg}</div>}

      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Your name"
          autoComplete="name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="your@email.com"
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="(optional)"
          autoComplete="tel"
        />
      </div>

      <div className="form-group">
        <label htmlFor="timeline">Purchase Timeline *</label>
        <select id="timeline" name="timeline" required>
          <option value="">Select a timeframe...</option>
          <option value="ready-now">Ready to purchase now</option>
          <option value="within-30-days">Within 30 days</option>
          <option value="1-3-months">1-3 months</option>
          <option value="just-researching">Just researching options</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          name="message"
          required
          placeholder="Tell us about your interest in the van..."
        />
      </div>

      {/* Honeypot */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className="form-submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
