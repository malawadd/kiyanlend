import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui/NeoToast";
import { RainbowKitProviders } from "@/components/providers/RainbowKitProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KiyanLend - Private Micro-Lending",
  description: "Privacy-preserving micro-lending powered by encrypted AI",
  icons: {
    icon: "/convex.svg",
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
        <RainbowKitProviders>
          <ClerkProvider dynamic>
            <ConvexClientProvider>
              <ToastProvider>
                <Navbar />
                {children}
              </ToastProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        </RainbowKitProviders>
      </body>
    </html>
  );
}
