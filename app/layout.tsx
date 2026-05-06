import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CipherView — Encrypted Video Marketplace",
  description:
    "Buy and sell time-limited access to premium video content, secured by Sui blockchain and AES-256 encryption.",
  keywords: ["video marketplace", "Sui blockchain", "zkLogin", "encrypted content", "Web3"],
  metadataBase: new URL("https://securelink-eta.vercel.app"),
  openGraph: {
    title: "CipherView",
    description: "Encrypted video access marketplace on Sui",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
