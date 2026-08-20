"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, Coffee, Send } from "lucide-react";
import styles from "@/app/info-page.module.css";
import { APP, UI_COPY, UI_TIMINGS } from "@/config/app-constants";

export function CoffeeInviteForm() {
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (!showThankYou) return;
    const timeout = window.setTimeout(() => setShowThankYou(false), UI_TIMINGS.coffeeThankYouMs);
    return () => window.clearTimeout(timeout);
  }, [showThankYou]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const invite = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      place: String(form.get("place") ?? "").trim(),
      note: String(form.get("note") ?? "").trim(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(APP.storageKeys.coffeeInvite, JSON.stringify(invite));

    const recipient =
      process.env.NEXT_PUBLIC_COFFEE_INVITE_EMAIL ??
      process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ??
      APP.contact.email;

    const subject = encodeURIComponent(
      `Coffee invitation from ${invite.name} — ${APP.name}`,
    );
    const body = encodeURIComponent(
      `Hello ${APP.contact.name},\n\nI would be happy to meet and share an idea over coffee.\n\nName: ${invite.name}\nEmail: ${invite.email}\nSuggested place: ${invite.place}\nIdea or message: ${invite.note || UI_COPY.support.fallbackIdea}\n\nLooking forward to hearing from you.\n\nBest regards,\n${invite.name}`,
    );

    setShowThankYou(true);
    window.setTimeout(() => {
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    }, UI_TIMINGS.mailDraftDelayMs);

    formElement.reset();
  }

  return (
    <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
      <div className={styles.formHeading}>
        <span>
          <Coffee size={19} />
        </span>
        <div>
          <h2>{UI_COPY.support.formTitle}</h2>
          <p>{UI_COPY.support.formDescription}</p>
        </div>
      </div>

      <label>
        {UI_COPY.support.name}
        <input
          name="name"
          autoComplete="name"
          placeholder={UI_COPY.support.namePlaceholder}
          required
        />
      </label>
      <label>
        {UI_COPY.support.email}
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder={UI_COPY.support.emailPlaceholder}
          required
        />
      </label>
      <label className={styles.full}>
        {UI_COPY.support.place}
        <input
          name="place"
          placeholder={UI_COPY.support.placePlaceholder}
          required
        />
      </label>
      <label className={styles.full}>
        {UI_COPY.support.idea}
        <textarea
          className={styles.compactTextarea}
          name="note"
          placeholder={UI_COPY.support.ideaPlaceholder}
        />
      </label>

      <div className={styles.actions}>
        <div className={styles.actionButtons}>
          <a
            className={`${styles.button} ${styles.secondaryButton}`}
            href={APP.links.calendly}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CalendarDays size={17} /> {UI_COPY.support.schedule}
          </a>
          <button className={styles.button} type="submit">
            <Send size={17} /> {UI_COPY.support.send}
          </button>
        </div>
      </div>

      {showThankYou && (
        <div
          className={styles.thankYouOverlay}
          role="status"
          aria-live="polite"
        >
          <div className={styles.thankYouPopup}>
            <span className={styles.thankYouGraphic}>
              <Coffee size={26} />
              <CheckCircle2 size={18} />
            </span>
            <strong>{UI_COPY.support.thankYouTitle}</strong>
            <p>{UI_COPY.support.thankYouText}</p>
          </div>
        </div>
      )}
    </form>
  );
}
