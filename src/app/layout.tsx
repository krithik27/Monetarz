import type { Metadata } from "next";
import "../styles/globals.css";
import localFont from "next/font/local";
import { Indie_Flower } from "next/font/google";
import { Providers } from "@/components/Providers";
import { PwaRegister } from "@/components/pwa-register";
import RazorpayScript from "@/components/RazorpayCheckout";

const cabinet = localFont({
  src: "../../public/fonts/cabinetgortesk/web/CabinetGrotesk-Variable.woff2",
  variable: "--font-sans",
  display: "swap",
});

const indieFlower = Indie_Flower({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-accent",
});

export const viewport = {
  themeColor: "#FCFAF7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Monetarz | Mindful Money",
  description: "Mindful money journal for the modern age.",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logomtz192.png",
    apple: "/images/logomtz192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Monetarz",
  },
};

import { ScrollToTop } from "@/components/ui/scroll-to-top";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cabinet.variable} ${indieFlower.variable} scroll-smooth`}>
      <body className="antialiased selection:bg-brand-moss selection:text-brand-cream bg-brand-cream relative min-h-screen">
        <PwaRegister />
        <div className="relative z-10 w-full min-h-screen">
          <Providers>
            {children}
            <ScrollToTop />
            <RazorpayScript />
          </Providers>
        </div>
      </body>
    </html>
  );
}
