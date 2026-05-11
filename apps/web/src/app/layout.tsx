import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VendaPro - Gestao de Vendas",
  description: "Sistema de gestao para lojas fisicas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
