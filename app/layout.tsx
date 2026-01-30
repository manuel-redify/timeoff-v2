import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TimeOff Management",
  description: "TimeOff Management System",
};

import { Toaster } from "@/components/ui/sonner";
import { SessionProviders } from "@/components/providers/session-provider";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary";

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
        <SessionProviders>
          <AuthErrorBoundary>
            <AuthGuard>
              {children}
            </AuthGuard>
          </AuthErrorBoundary>
          <Toaster />
        </SessionProviders>
      </body>
    </html>
  );
}
