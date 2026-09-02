import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yahduth-al-an-24-admin.vercel.app"),
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/favicon.png" },
  openGraph: { title: "يحدث الآن 24 | لوحة التحكم", description: "إدارة منصة يحدث الآن 24", images: [{ url: "/logo.jpg", width: 1408, height: 768, alt: "شعار يحدث الآن 24" }] },
  twitter: { card: "summary_large_image", images: ["/logo.jpg"] },
  title: "يحدث الآن | لوحة التحكم",
  description: "تسجيل الدخول إلى لوحة تحكم يحدث الآن",
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
