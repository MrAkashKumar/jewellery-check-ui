"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import styles from "@/app/info-page.module.css";
import { APP, UI_COPY } from "@/config/app-constants";

export function ContactCard() {
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  return (
    <section className={`${styles.card} ${styles.contactCard}`}>
      <div className={styles.contactDetails}>
        <div>
          <span className={styles.detailIcon}>
            <UserRound size={18} />
          </span>
          <p>
            <small>{UI_COPY.contact.contact}</small>
            <strong>{APP.contact.name}</strong>
          </p>
        </div>
        <div>
          <span className={styles.detailIcon}>
            <MapPin size={18} />
          </span>
          <p>
            <small>{UI_COPY.contact.location}</small>
            <strong>{APP.contact.location}</strong>
          </p>
        </div>
        <div>
          <span className={styles.detailIcon}>
            <Mail size={18} />
          </span>
          <p>
            <small>{UI_COPY.contact.email}</small>
            <strong>
              {showEmail ? (
                <a href={`mailto:${APP.contact.email}`}>{APP.contact.email}</a>
              ) : (
                APP.contact.maskedEmail
              )}
            </strong>
          </p>
          <button
            className={styles.visibilityButton}
            type="button"
            aria-label={`${showEmail ? UI_COPY.common.hide : UI_COPY.common.show} email address`}
            aria-pressed={showEmail}
            onClick={() => setShowEmail((visible) => !visible)}
          >
            {showEmail ? <EyeOff size={16} /> : <Eye size={16} />}
            {showEmail ? UI_COPY.common.hide : UI_COPY.common.show}
          </button>
        </div>
        <div>
          <span className={styles.detailIcon}>
            <Phone size={18} />
          </span>
          <p>
            <small>{UI_COPY.contact.phone}</small>
            <strong>{showPhone ? APP.contact.phone : APP.contact.maskedPhone}</strong>
          </p>
          <button
            className={styles.visibilityButton}
            type="button"
            aria-pressed={showPhone}
            onClick={() => setShowPhone((visible) => !visible)}
          >
            {showPhone ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPhone ? UI_COPY.common.hide : UI_COPY.common.show}
          </button>
        </div>
      </div>

      <div className={styles.collaborationMessage}>
        <Lightbulb size={24} />
        <div>
          <h2>{UI_COPY.contact.collaborationTitle}</h2>
          <p>{UI_COPY.contact.collaborationText}</p>
          <blockquote>{UI_COPY.contact.collaborationQuote}</blockquote>
        </div>
      </div>

      <Link className={styles.button} href={APP.links.feedback}>
        <MessageCircle size={17} /> {UI_COPY.contact.shareIdea}
      </Link>
    </section>
  );
}
