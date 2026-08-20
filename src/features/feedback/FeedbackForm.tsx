"use client";

import { useState, type FormEvent } from "react";
import { Check, ChevronDown, Send } from "lucide-react";
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
  const [selectedType, setSelectedType] = useState("");
  const [typesOpen, setTypesOpen] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedType) {
      setStatus("Please choose a feedback type.");
      return;
    }
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
      <fieldset className={`${styles.full} ${styles.feedbackTypeField}`}>
        <legend>Feedback type</legend>
        <div
          className={styles.feedbackTypePicker}
          onKeyDown={(event) => {
            if (event.key === "Escape") setTypesOpen(false);
          }}
        >
          <button
            className={styles.feedbackTypeTrigger}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={typesOpen}
            onClick={() => setTypesOpen((open) => !open)}
          >
            <span
              className={`${styles.feedbackTypeValue} ${
                selectedType ? styles.selectedTypeValue : styles.placeholderText
              }`}
            >
              {selectedType && <Check size={15} />}
              <span>{selectedType || "Select feedback type"}</span>
            </span>
            <ChevronDown size={17} />
          </button>
          {typesOpen && (
            <div
              className={styles.feedbackTypeMenu}
              role="listbox"
              aria-label="Feedback type"
            >
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="option"
                  aria-selected={selectedType === type}
                  onClick={() => {
                    setSelectedType(type);
                    setTypesOpen(false);
                    setStatus("");
                  }}
                >
                  <span>{type}</span>
                  {selectedType === type && <Check size={15} />}
                </button>
              ))}
            </div>
          )}
        </div>
        <input name="type" type="hidden" value={selectedType} />
      </fieldset>
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
