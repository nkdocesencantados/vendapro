import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { VendaProLogo } from "@/components/logo"

export default function NotFound() {
  return (
    <main data-theme="dark" style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24, textAlign: "center" }}>
      <VendaProLogo size={40} />
      <div className="vp-num" style={{ fontSize: 72, fontWeight: 500, lineHeight: 1, color: "var(--brand-neon)", marginTop: 12 }}>404</div>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text)" }}>Página não encontrada</h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)", maxWidth: 340 }}>O endereço que você abriu não existe ou foi movido. Volte ao painel para continuar vendendo.</p>
      <Link href="/dashboard" className="vp-btn vp-btn-primary" style={{ marginTop: 4 }}>
        <ArrowLeft size={16} aria-hidden /> Voltar ao painel
      </Link>
    </main>
  )
}
