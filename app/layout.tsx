import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TitleWyse — AI-Powered Title Review",
  description: "AI-Powered Title Review. Texas-Grade Precision.",
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
