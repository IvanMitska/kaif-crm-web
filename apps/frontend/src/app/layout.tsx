import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: {
    default: "Sintara CRM - Автоматизация продаж и управление клиентами",
    template: "%s | Sintara CRM",
  },
  description: "Современная CRM-система для автоматизации бизнеса. Управление сделками, клиентами, онлайн-запись, аналитика и омниканальная коммуникация в одном месте.",
  keywords: ["CRM", "CRM система", "автоматизация продаж", "управление клиентами", "Sintara", "онлайн-запись", "аналитика"],
  authors: [{ name: "Sintara CRM" }],
  creator: "Sintara CRM",
  metadataBase: new URL("https://www.sintara-crm.com"),
  icons: {
    icon: [
      { url: "/logo-icon-192.png", type: "image/png", sizes: "32x32" },
      { url: "/logo-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/logo-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/logo-icon-192.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logo-icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sintara CRM",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://www.sintara-crm.com",
    siteName: "Sintara CRM",
    title: "Sintara CRM - Автоматизация продаж и управление клиентами",
    description: "Современная CRM-система для автоматизации бизнеса. Управление сделками, клиентами, онлайн-запись, аналитика и омниканальная коммуникация в одном месте.",
    images: [
      {
        url: "/logo.png",
        width: 600,
        height: 150,
        alt: "Sintara CRM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sintara CRM - Автоматизация продаж и управление клиентами",
    description: "Современная CRM-система для автоматизации бизнеса. Управление сделками, клиентами, онлайн-запись и аналитика.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}