import Link from "next/link";
import { Coffee, Mail, MessageCircle } from "lucide-react";
import styles from "./HeaderLinks.module.css";

const links = [
  { href: "/feedback", label: "Feedback", icon: MessageCircle },
  { href: "/contact", label: "Reach us", icon: Mail },
  { href: "/support", label: "Coffee", icon: Coffee },
];

export function HeaderLinks() {
  return (
    <nav className={styles.links} aria-label="Help and support">
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-label={label} title={label}>
          <Icon size={16} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
