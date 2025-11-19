import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import FloatingQuickActions from "@/components/FloatingQuickActions";

const fredoka = Fredoka({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
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
        className={`${fredoka.variable} ${nunito.variable} antialiased font-body bg-[#FDFBF7] text-slate-800`}
      >
        <Header />
        {children}
        <FloatingQuickActions />
      </body>
    </html>
  );
}
