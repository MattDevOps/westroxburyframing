"use client";

import { useState } from "react";

export function ContactForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  const inputClass = isDark
    ? "w-full rounded-sm border border-border bg-card px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors"
    : "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";
  const labelClass = isDark ? "text-sm font-medium text-foreground/80" : "text-sm font-medium text-neutral-800";
  const buttonClass = isDark
    ? "w-full py-3.5 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors disabled:opacity-50"
    : "inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-500";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone, email, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Unable to send message.");
      }

      setStatus("success");
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      console.error("Contact form submit error", err);
      setStatus("error");
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="phone" className={labelClass}>
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className={labelClass}>
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
      {status === "success" && !error && (
        <p className="text-sm text-green-600">Thank you—your message has been sent.</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={buttonClass}
      >
        {isSubmitting ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

