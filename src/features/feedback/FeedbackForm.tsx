"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import styles from "@/app/info-page.module.css";

const types = [
  "Suggestion",
  "Improvement",
  "Design issue",
  "Incorrect information",
  "Not useful",
  "Feature request",
  "Missing information",
  "Other",
];

const feedbackRecipient = "akashkr2929@gmail.com";

export function FeedbackForm() {
  const [status, setStatus] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const feedback = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      type: String(form.get("type") ?? ""),
      message: String(form.get("message") ?? ""),
      createdAt: new Date().toISOString(),
    };
    const subject = encodeURIComponent(`JwellCheck: ${feedback.type}`);
    const body = encodeURIComponent(
      `Hello Akash,\n\nName: ${feedback.name}\nEmail: ${feedback.email}\nFeedback type: ${feedback.type}\n\n${feedback.message}\n\nSent from JwellCheck`,
    );
    window.location.href = `mailto:${feedbackRecipient}?subject=${subject}&body=${body}`;
    setStatus("Opening your email application…");
  }

  return (
    <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
      <label>
        Name
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className={styles.full}>
        Feedback type
        <select name="type" defaultValue="" required>
          <option value="" disabled>
            Select a type
          </option>
          {types.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className={styles.full}>
        Message
        <textarea
          name="message"
          required
          placeholder="Tell us what happened or what would make JwellCheck better."
        />
      </label>
      <div className={styles.actions}>
        <span role="status">{status}</span>
        <button className={styles.button} type="submit">
          <Send size={17} /> Send feedback
        </button>
      </div>
    </form>
  );
}
