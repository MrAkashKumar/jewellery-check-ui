import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { APP, SEO } from "@/config/app-constants";

export const metadata: Metadata = {
  metadataBase: new URL(APP.baseUrl),
  title: {
    default: SEO.title,
    template: SEO.titleTemplate,
  },
  description: SEO.description,
  applicationName: APP.name,
  keywords: [...SEO.keywords],
  openGraph: {
    title: SEO.openGraphTitle,
    description: SEO.openGraphDescription,
    type: "website",
    siteName: APP.name,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SEO.theme.light },
    { media: "(prefers-color-scheme: dark)", color: SEO.theme.dark },
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
