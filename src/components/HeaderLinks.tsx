import Link from "next/link";
import { Coffee, Mail, MessageCircle } from "lucide-react";
import styles from "./HeaderLinks.module.css";
import { NAVIGATION } from "@/config/app-constants";

const icons = [MessageCircle, Mail, Coffee] as const;

export function HeaderLinks() {
  return (
    <nav className={styles.links} aria-label={NAVIGATION.ariaLabel}>
      {NAVIGATION.items.map(({ href, label }, index) => {
        const Icon = icons[index];
        return (
        <Link key={href} href={href} aria-label={label} title={label}>
          <Icon size={16} />
          <span>{label}</span>
        </Link>
        );
      })}
    </nav>
  );
}
