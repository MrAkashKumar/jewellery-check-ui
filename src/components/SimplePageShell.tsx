import Link from "next/link";
import { BadgeCheck, Gem } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import styles from "./SimplePageShell.module.css";

export function SimplePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="JwellCheck home">
          <span>
            <Gem size={21} />
            <BadgeCheck size={11} />
          </span>
          <strong>JwellCheck</strong>
        </Link>
        <HeaderLinks />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
