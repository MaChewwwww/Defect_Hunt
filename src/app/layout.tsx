import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SandboxProvider } from "@/lib/store/sandbox-store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veranda PMS | Solstice Bay Resort & Villas",
  description:
    "Hospitality, Room Allotment, and Guest Folio Management System for Solstice Bay Resort & Villas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <SandboxProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton={false} />
        </SandboxProvider>
      </body>
    </html>
  );
}
