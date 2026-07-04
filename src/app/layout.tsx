import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { WebviewHeartbeat } from "@/components/providers/webview-heartbeat";

export const metadata: Metadata = {
  title: "ClinicNova | Diş Kliniği Yönetim Platformu",
  description: "Diş klinikleri için hasta, randevu, tedavi, finans, stok ve raporlama yönetimi."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <WebviewHeartbeat />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
