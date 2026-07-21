import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const squidBoy = localFont({
  variable: "--font-squidboy",
  src: [
    {
      path: "./fonts/SquidBoy/SquidBoy-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/SquidBoy/SquidBoy.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/SquidBoy/SquidBoy-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BandSpace",
  description: "Spazio di lavoro condiviso per la gestione della band",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${squidBoy.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
