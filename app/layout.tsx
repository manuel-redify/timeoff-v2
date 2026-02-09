import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TimeOff Management",
  description: "TimeOff Management System",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
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
        className={`${inter.variable} antialiased`}
      >
        <SessionProviders>
          <AuthErrorBoundary>
            {children}
          </AuthErrorBoundary>
          <Toaster />
        </SessionProviders>
      </body>
    </html>
  );
}
