import type { Metadata } from "next";
import { SimplePageShell } from "@/components/SimplePageShell";
import { ContactCard } from "@/features/contact/ContactCard";
import styles from "../info-page.module.css";
import { UI_COPY } from "@/config/app-constants";

export const metadata: Metadata = { title: UI_COPY.contact.metadataTitle };

export default function ContactPage() {
  return (
    <SimplePageShell>
      <section className={styles.intro}>
        <h1>{UI_COPY.contact.title}</h1>
        <p>{UI_COPY.contact.description}</p>
      </section>
      <ContactCard />
    </SimplePageShell>
  );
}
