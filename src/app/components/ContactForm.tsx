"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

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

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DUSTYLABS_API_URL}/api/forms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_DUSTYLABS_API_KEY!,
          },
          body: JSON.stringify({
            formId: process.env.NEXT_PUBLIC_FORM_ID || "sprinter-van-contact",
            values: {
              name: data.get("name"),
              email: data.get("email"),
              phone: data.get("phone") || "",
              message: data.get("message"),
            },
            metadata: {
              submittedAt: new Date().toISOString(),
              referrer: document.referrer || "",
            },
          }),
        }
      );

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
        <h3>Message Sent!</h3>
        <p>
          Thanks for reaching out. We&apos;ll get back to you as soon as
          possible.
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
