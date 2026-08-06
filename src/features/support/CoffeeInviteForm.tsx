"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, Coffee, Send } from "lucide-react";
import styles from "@/app/info-page.module.css";

export function CoffeeInviteForm() {
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (!showThankYou) return;
    const timeout = window.setTimeout(() => setShowThankYou(false), 2000);
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

    localStorage.setItem("jwellcheck-coffee-invite", JSON.stringify(invite));

    const recipient =
      process.env.NEXT_PUBLIC_COFFEE_INVITE_EMAIL ??
      process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ??
      "akashkr2929@gmail.com";

    const subject = encodeURIComponent(
      `Coffee invitation from ${invite.name} — JwellCheck`,
    );
    const body = encodeURIComponent(
      `Hello Akash,\n\nI would be happy to meet and share an idea over coffee.\n\nName: ${invite.name}\nEmail: ${invite.email}\nSuggested place: ${invite.place}\nIdea or message: ${invite.note || "Let's connect and exchange ideas."}\n\nLooking forward to hearing from you.\n\nBest regards,\n${invite.name}`,
    );

    setShowThankYou(true);
    window.setTimeout(() => {
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    }, 250);

    formElement.reset();
  }

  return (
    <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
      <div className={styles.formHeading}>
        <span>
          <Coffee size={19} />
        </span>
        <div>
          <h2>Thank you for offering us a coffee</h2>
          <p>Send your kind invitation and share an idea with us.</p>
        </div>
      </div>

      <label>
        Name
        <input
          name="name"
          autoComplete="name"
          placeholder="Your name"
          required
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </label>
      <label className={styles.full}>
        Place
        <input
          name="place"
          placeholder="Coffee shop or meeting place"
          required
        />
      </label>
      <label className={styles.full}>
        Your idea (optional)
        <textarea
          className={styles.compactTextarea}
          name="note"
          placeholder="Tell us what you would like to discuss."
        />
      </label>

      <div className={styles.actions}>
        <div className={styles.actionButtons}>
          <a
            className={`${styles.button} ${styles.secondaryButton}`}
            href="https://calendly.com/mrakashkumar/10min"
            target="_blank"
            rel="noopener noreferrer"
          >
            <CalendarDays size={17} /> Schedule a meeting
          </a>
          <button className={styles.button} type="submit">
            <Send size={17} /> Send invitation
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
            <strong>Thank you for the invitation!</strong>
            <p>
              We appreciate your kind gesture and look forward to connecting.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
