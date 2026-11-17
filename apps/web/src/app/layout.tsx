import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VendaPro · Gestão de vendas",
  description: "Vendas, estoque, caixa e fiado em um só lugar. Um produto Haux Web.",
  icons: { icon: "/brand/haux-emblem.png", apple: "/brand/haux-emblem.png" },
};

export const viewport: Viewport = { themeColor: "#060A08" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
