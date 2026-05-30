import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";

import { PwaInstallPrompt } from "../components/pwa-install-prompt";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  display: "swap",
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600", "700", "800"]
});

const jetbrainsMono = JetBrains_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"]
});

export const viewport: Viewport = {
  themeColor: "#14B8A6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

const SITE_URL = "https://vierify.vn";
const OG_DESCRIPTION =
  "Nền tảng truy xuất nguồn gốc chuỗi cung ứng được xác thực bởi blockchain Polygon.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  description: OG_DESCRIPTION,
  title: "Vierify — Truy xuất nguồn gốc",
  manifest: "/manifest.json",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Vierify",
    title: "Vierify — Truy xuất nguồn gốc",
    description: OG_DESCRIPTION,
    locale: "vi_VN"
  },
  twitter: {
    card: "summary_large_image",
    title: "Vierify — Truy xuất nguồn gốc",
    description: OG_DESCRIPTION
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vierify"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Prevent flash of wrong color scheme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vierify-theme')||'light';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-slate-50 font-sans text-slate-950 antialiased dark:bg-slate-950 dark:text-slate-50">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
