import type { Metadata } from "next";
import { SimplePageShell } from "@/components/SimplePageShell";
import { FeedbackForm } from "@/features/feedback/FeedbackForm";
import styles from "../info-page.module.css";
import { UI_COPY } from "@/config/app-constants";

export const metadata: Metadata = { title: UI_COPY.feedback.metadataTitle };

export default function FeedbackPage() {
  return (
    <SimplePageShell>
      <section className={styles.intro}>
        <h1>{UI_COPY.feedback.title}</h1>
        <p>{UI_COPY.feedback.description}</p>
      </section>
      <FeedbackForm />
    </SimplePageShell>
  );
}
