"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lightbulb,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import styles from "@/app/info-page.module.css";

export function ContactCard() {
  const [showPhone, setShowPhone] = useState(false);

  return (
    <section className={`${styles.card} ${styles.contactCard}`}>
      <div className={styles.contactDetails}>
        <div>
          <span className={styles.detailIcon}>
            <UserRound size={18} />
          </span>
          <p>
            <small>Contact</small>
            <strong>Akash Kumar</strong>
          </p>
        </div>
        <div>
          <span className={styles.detailIcon}>
            <MapPin size={18} />
          </span>
          <p>
            <small>Location</small>
            <strong>Singapore</strong>
          </p>
        </div>
        <div>
          <span className={styles.detailIcon}>
            <Phone size={18} />
          </span>
          <p>
            <small>Phone number</small>
            <strong>{showPhone ? "+65 9347 8235" : "+65 •••• ••••"}</strong>
          </p>
          <button
            className={styles.visibilityButton}
            type="button"
            aria-pressed={showPhone}
            onClick={() => setShowPhone((visible) => !visible)}
          >
            {showPhone ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPhone ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className={styles.collaborationMessage}>
        <Lightbulb size={24} />
        <div>
          <h2>Let&apos;s build something useful</h2>
          <p>
            Have an innovative idea? Let&apos;s collaborate on simple solutions
            that support our community and make everyday life easier.
          </p>
          <blockquote>
            “Small ideas, shared together, can create meaningful change.”
          </blockquote>
        </div>
      </div>

      <Link className={styles.button} href="/feedback">
        <MessageCircle size={17} /> Share an idea or feedback
      </Link>
    </section>
  );
}
