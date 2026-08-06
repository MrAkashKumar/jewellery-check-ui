import type { Metadata } from "next";
import { SimplePageShell } from "@/components/SimplePageShell";
import { FeedbackForm } from "@/features/feedback/FeedbackForm";
import styles from "../info-page.module.css";

export const metadata: Metadata = { title: "Feedback — JwellCheck" };

export default function FeedbackPage() {
  return (
    <SimplePageShell>
      <section className={styles.intro}>
        <h1>Share feedback</h1>
        <p>
          Report an issue or suggest a clearer way to compare jewellery prices.
        </p>
      </section>
      <FeedbackForm />
    </SimplePageShell>
  );
}
