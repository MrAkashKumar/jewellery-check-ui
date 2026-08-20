import type { Metadata } from "next";
import Image from "next/image";
import { SimplePageShell } from "@/components/SimplePageShell";
import { CoffeeInviteForm } from "@/features/support/CoffeeInviteForm";
import styles from "../info-page.module.css";
import { MEDIA_CONFIG, UI_COPY } from "@/config/app-constants";

export const metadata: Metadata = { title: UI_COPY.support.metadataTitle };

export default function SupportPage() {
  return (
    <SimplePageShell>
      <div className={styles.supportLayout}>
        <section className={styles.coffeeHero}>
          <Image
            src={UI_COPY.support.imagePath}
            alt={UI_COPY.support.imageAlt}
            fill
            loading="lazy"
            fetchPriority="low"
            quality={MEDIA_CONFIG.coffeeImageQuality}
            sizes={MEDIA_CONFIG.coffeeImageSizes}
          />
          <div>
            <p className={styles.eyebrow}>{UI_COPY.support.eyebrow}</p>
            <h1>{UI_COPY.support.title}</h1>
            <blockquote>{UI_COPY.support.quote}</blockquote>
          </div>
        </section>
        <CoffeeInviteForm />
      </div>
    </SimplePageShell>
  );
}
