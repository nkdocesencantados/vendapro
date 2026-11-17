import Link from "next/link"
import { ArrowLeft, KeyRound, MessageCircle } from "lucide-react"
import { VendaProLogo } from "@/components/logo"

const WHATS_SUPPORT = "https://wa.me/5511958924764?text=Ol%C3%A1%2C+esqueci+minha+senha+do+VendaPro+e+preciso+de+ajuda"

export default function ForgotPasswordPage() {
  return (
    <main data-theme="dark" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
        <VendaProLogo size={40} />
        <div className="vp-card glow" style={{ width: "100%", padding: 28, marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--surface-3)", color: "var(--brand-neon)", display: "grid", placeItems: "center" }}>
            <KeyRound size={22} aria-hidden />
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Esqueceu sua senha?</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
            Fale com o suporte pelo WhatsApp e redefinimos sua senha o mais rápido possível.
          </p>
          <a href={WHATS_SUPPORT} target="_blank" rel="noopener noreferrer" className="vp-btn vp-btn-primary vp-btn-lg" style={{ width: "100%", marginTop: 6 }}>
            <MessageCircle size={18} aria-hidden /> Falar com o suporte
          </a>
        </div>
        <Link href="/login" className="vp-btn vp-btn-ghost vp-btn-sm"><ArrowLeft size={14} aria-hidden /> Voltar ao login</Link>
      </div>
    </main>
  )
}
