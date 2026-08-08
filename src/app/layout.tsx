import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jwellcheck.example"),
  title: {
    default: "JwellCheck — Compare Jewellery Prices Clearly",
    template: "%s · JwellCheck",
  },
  description:
    "Compare jewellery prices across shops with transparent metal value, making charge, GST, discount, fee and tourist refund calculations.",
  applicationName: "JwellCheck",
  keywords: [
    "jewellery price comparison",
    "gold making charge calculator",
    "Singapore jewellery",
    "gold price per gram",
  ],
  openGraph: {
    title: "JwellCheck — Compare with confidence",
    description:
      "Save multiple jewellery items, compare shop quotations and understand every charge.",
    type: "website",
    siteName: "JwellCheck",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ed" },
    { media: "(prefers-color-scheme: dark)", color: "#171512" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
