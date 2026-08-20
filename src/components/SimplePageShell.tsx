import Link from "next/link";
import { BadgeCheck, Gem } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import styles from "./SimplePageShell.module.css";
import { APP, UI_COPY } from "@/config/app-constants";

export function SimplePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={APP.links.home} aria-label={UI_COPY.common.homeAriaLabel}>
          <span>
            <Gem size={21} />
            <BadgeCheck size={11} />
          </span>
          <strong>{APP.name}</strong>
        </Link>
        <HeaderLinks />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
