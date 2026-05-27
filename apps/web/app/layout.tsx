import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  description: "Supply chain traceability backed by Polygon blockchain proof.",
  title: "Vierify"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
