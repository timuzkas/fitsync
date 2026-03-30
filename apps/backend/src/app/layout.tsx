import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitsync Backend",
  description: "Integration backend for personal fitness utility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
