import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "NexCall — Telecaller management, simplified", template: "%s | NexCall" },
  description: "Manage your telecalling team, leads, calls and follow-ups from one focused workspace.",
  openGraph: { title: "NexCall", description: "Telecaller management, simplified.", images: [{ url: "/og.png", width: 1200, height: 630, alt: "NexCall telecaller management dashboard" }] },
  twitter: { card: "summary_large_image", title: "NexCall", description: "Telecaller management, simplified.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
