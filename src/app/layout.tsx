import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import FloatingQuickActions from "@/components/FloatingQuickActions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Games Inc Jr",
  description: "Play amazing HTML5 games online. Alien Unicorn Alliance and more exciting games available now!",
  openGraph: {
    title: "Games Inc Jr",
    description: "Play amazing HTML5 games online. Alien Unicorn Alliance and more exciting games available now!",
    type: "website",
    siteName: "Games Inc Jr",
  },
  twitter: {
    card: "summary_large_image",
    title: "Games Inc Jr",
    description: "Play amazing HTML5 games online. Alien Unicorn Alliance and more exciting games available now!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
        <FloatingQuickActions />
      </body>
    </html>
  );
}
