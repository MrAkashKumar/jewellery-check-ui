import type { Metadata } from "next";
import { SimplePageShell } from "@/components/SimplePageShell";
import { ContactCard } from "@/features/contact/ContactCard";
import styles from "../info-page.module.css";

export const metadata: Metadata = { title: "Reach us — JwellCheck" };

export default function ContactPage() {
  return (
    <SimplePageShell>
      <section className={styles.intro}>
        <h1>Reach us</h1>
        <p>
          Questions, community ideas, and thoughtful collaborations are always
          welcome.
        </p>
      </section>
      <ContactCard />
    </SimplePageShell>
  );
}
