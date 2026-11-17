"use client"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Tour de boas-vindas: aparece no primeiro acesso (vp-tour-done) e reabre pelo evento "vp-tour-open".
const STEPS: { href?: string; title: string; text: string }[] = [
  { title: "Bem-vindo ao VendaPro", text: "Em 1 minuto mostramos onde fica cada coisa. Você pode pular e rever o tour quando quiser pelo botão de ajuda (?) no topo." },
  { href: "/dashboard", title: "Dashboard", text: "O resumo do dia: quanto vendeu, quantas vendas e como está a meta do mês." },
  { href: "/dashboard/inventory", title: "1º passo: cadastre seus produtos", text: "Em Estoque, clique em Novo produto e informe nome, preço de venda e quantidade que você tem na loja. O estoque baixa sozinho a cada venda." },
  { href: "/dashboard/sales", title: "2º passo: registre uma venda", text: "Clique em Nova venda, escolha o cliente e a forma de pagamento. Em cada item: escolha o produto, a QUANTIDADE (quantas unidades) e confira o PREÇO UNITÁRIO (valor de uma unidade). O total é calculado na hora." },
  { href: "/dashboard/customers", title: "Clientes", text: "Guarde nome e telefone de quem compra para vender no fiado e cobrar pelo WhatsApp." },
  { href: "/dashboard/receivables", title: "Fiado", text: "Veja quem está devendo, quando vence e registre os pagamentos recebidos." },
  { href: "/dashboard/pix", title: "Cobrar com PIX", text: "Gere um QR Code ou PIX copia e cola com o valor certo e envie ao cliente." },
  { href: "/dashboard/cash", title: "Caixa", text: "Abra e feche o caixa do dia e lance entradas e saídas para saber quanto deve ter na gaveta." },
  { href: "/dashboard/receipts", title: "Recibos", text: "Todo recibo de venda fica aqui: abra, exporte em PDF ou mande pelo WhatsApp." },
  { href: "/dashboard/reports", title: "Relatórios", text: "Produtos mais vendidos, formas de pagamento e horários de pico, com exportação para Excel e PDF." },
  { href: "/dashboard/settings", title: "Deixe com a cara da sua loja", text: "Em Configurações você envia a logo da sua empresa, escolhe as cores do painel e cadastra sua chave PIX." },
]

const KEY = "vp-tour-done"

export default function Tour() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // só passos cujo item existe no menu (depende do plano e do papel do usuário)
  const steps = open ? STEPS.filter(s => !s.href || document.querySelector(`a.vp-nav-item[href="${s.href}"]`)) : STEPS
  const step = steps[Math.min(i, steps.length - 1)]

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setOpen(true) } catch {}
    const onOpen = () => { setI(0); setOpen(true) }
    window.addEventListener("vp-tour-open", onOpen)
    return () => window.removeEventListener("vp-tour-open", onOpen)
  }, [])

  // o menu muda de posição depois que os dados da loja chegam (plano, logo, abas escondidas),
  // então acompanha o item a cada quadro em vez de medir uma vez só
  useEffect(() => {
    if (!open) return
    const find = () => step?.href ? document.querySelector(`a.vp-nav-item[href="${step.href}"]`) : null
    find()?.scrollIntoView({ block: "nearest" })
    let raf = 0, last = ""
    const tick = () => {
      const r = find()?.getBoundingClientRect()
      const ok = r && r.width > 0 && r.right > 0 && r.bottom > 0 && r.top < window.innerHeight
      const key = ok ? `${r!.top}|${r!.left}|${r!.width}|${r!.height}` : "none"
      if (key !== last) { last = key; setRect(ok ? r : null) } // menu escondido (celular): cartão no centro
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [open, step?.href])

  const close = useCallback(() => { setOpen(false); try { localStorage.setItem(KEY, "1") } catch {} }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  if (!open || !step) return null
  const last = i >= steps.length - 1
  const pad = 6
  const card: React.CSSProperties = rect
    ? { top: Math.max(16, Math.min(rect.top - 8, window.innerHeight - 260)), left: rect.right + 18 }
    : { top: "50%", left: "50%", transform: "translate(-50%,-50%)" }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="vp-tour-title" style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
      {rect
        ? <div style={{ position: "fixed", top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: 12, border: "2px solid var(--brand)", boxShadow: "0 0 0 9999px rgba(0,0,0,.65)", transition: "all .25s ease", pointerEvents: "none" }} />
        : <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)" }} />}
      <div style={{ position: "fixed", ...card, width: "min(340px, calc(100vw - 32px))", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, boxShadow: "0 20px 50px rgba(0,0,0,.45)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--brand-neon)", letterSpacing: ".06em", textTransform: "uppercase" }}>Passo {i + 1} de {steps.length}</div>
        <h2 id="vp-tour-title" style={{ fontSize: 16, fontWeight: 700, margin: "6px 0 8px" }}>{step.title}</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--text-muted)" }}>{step.text}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button type="button" className="vp-btn vp-btn-ghost vp-btn-sm" onClick={close} style={{ marginRight: "auto" }}>Pular tour</button>
          {i > 0 && <button type="button" className="vp-btn vp-btn-secondary vp-btn-sm" onClick={() => setI(i - 1)}>Voltar</button>}
          {step.href && step.href !== "/dashboard" && (
            <button type="button" className="vp-btn vp-btn-secondary vp-btn-sm" onClick={() => { close(); router.push(step.href!) }}>Ir agora</button>
          )}
          <button type="button" className="vp-btn vp-btn-primary vp-btn-sm" autoFocus onClick={() => last ? close() : setI(i + 1)}>{last ? "Começar" : "Próximo"}</button>
        </div>
      </div>
    </div>
  )
}
