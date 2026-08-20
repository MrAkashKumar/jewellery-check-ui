"use client";

import { useState, type FormEvent } from "react";
import { Check, ChevronDown, Send } from "lucide-react";
import styles from "@/app/info-page.module.css";
import { APP, FEEDBACK_TYPES, UI_COPY } from "@/config/app-constants";

export function FeedbackForm() {
  const [status, setStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [typesOpen, setTypesOpen] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedType) {
      setStatus(UI_COPY.feedback.chooseTypeError);
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
    const subject = encodeURIComponent(`${APP.name}: ${feedback.type}`);
    const body = encodeURIComponent(
      `Hello ${APP.contact.name},\n\n${UI_COPY.feedback.name}: ${feedback.name}\n${UI_COPY.feedback.email}: ${feedback.email}\n${UI_COPY.feedback.type}: ${feedback.type}\n\n${feedback.message}\n\nSent from ${APP.name}`,
    );
    window.location.href = `mailto:${APP.contact.email}?subject=${subject}&body=${body}`;
    setStatus(UI_COPY.feedback.openingEmail);
  }

  return (
    <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
      <label>
        {UI_COPY.feedback.name}
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        {UI_COPY.feedback.email}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <fieldset className={`${styles.full} ${styles.feedbackTypeField}`}>
        <legend>{UI_COPY.feedback.type}</legend>
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
              <span>{selectedType || UI_COPY.feedback.selectType}</span>
            </span>
            <ChevronDown size={17} />
          </button>
          {typesOpen && (
            <div
              className={styles.feedbackTypeMenu}
              role="listbox"
              aria-label={UI_COPY.feedback.type}
            >
              {FEEDBACK_TYPES.map((type) => (
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
        {UI_COPY.feedback.message}
        <textarea
          name="message"
          required
          placeholder={UI_COPY.feedback.messagePlaceholder}
        />
      </label>
      <div className={styles.actions}>
        <span role="status">{status}</span>
        <button className={styles.button} type="submit">
          <Send size={17} /> {UI_COPY.feedback.send}
        </button>
      </div>
    </form>
  );
}
