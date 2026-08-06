import type { Metadata } from "next";
import Image from "next/image";
import { SimplePageShell } from "@/components/SimplePageShell";
import { CoffeeInviteForm } from "@/features/support/CoffeeInviteForm";
import styles from "../info-page.module.css";

export const metadata: Metadata = { title: "Buy us a coffee — JwellCheck" };

export default function SupportPage() {
  return (
    <SimplePageShell>
      <div className={styles.supportLayout}>
        <section className={styles.coffeeHero}>
          <Image
            src="/images/coffee-invitation.jpg"
            alt="A centered cappuccino ready for a conversation"
            fill
            priority
            quality={72}
            sizes="(max-width: 760px) 100vw, 42vw"
          />
          <div>
            <p className={styles.eyebrow}>A kind gesture</p>
            <h1>Buy us a coffee</h1>
            <blockquote>
              “A coffee is a kind gesture—and a lovely way to share a good
              idea.”
            </blockquote>
          </div>
        </section>
        <CoffeeInviteForm />
      </div>
    </SimplePageShell>
  );
}
