"use client"
import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createPortal } from "react-dom"

// Tour guiado: abre no primeiro acesso (vp-tour-done) e pelo evento "vp-tour-open" (botão ? do topo).
// Cada passo pode abrir uma aba (page) e destacar um elemento dela (sel, n-ésimo com nth).
// Sem sel, destaca o item da aba no menu. Abas fora do plano ou ocultas pelo lojista são puladas.
type Step = { page?: string; sel?: string; nth?: number; title: string; text: string }
const C = ".vp-content "
const STEPS: Step[] = [
  { title: "Bem-vindo ao VendaPro", text: "Vamos passar por cada aba e mostrar onde fica cada coisa. Leva 2 minutos. Você pode pular e rever quando quiser pelo botão (?) no topo." },
  { page: "/dashboard", sel: C + ".d-kpis", title: "Seu resumo do dia", text: "Aqui você vê quanto vendeu hoje, o faturamento do mês, o ticket médio, o fiado a receber e os produtos acabando." },
  { page: "/dashboard/inventory", sel: C + ".vp-btn-primary", title: "Comece cadastrando seus produtos", text: "Em Estoque, clique em Novo produto e informe nome, preço de venda e a quantidade que você tem. O estoque baixa sozinho a cada venda." },
  { page: "/dashboard/sales", sel: C + ".vp-btn-primary", title: "Registre uma venda", text: "Clique em Nova venda, escolha o cliente e a forma de pagamento. Em cada item: escolha o produto, a QUANTIDADE (quantas unidades) e confira o PREÇO UNITÁRIO (valor de uma unidade). O total é calculado na hora." },
  { page: "/dashboard/customers", sel: C + ".vp-btn-primary", title: "Cadastre seus clientes", text: "Clique em Novo cliente e salve nome e WhatsApp. Assim você vende no fiado e cobra com um toque." },
  { page: "/dashboard/receivables", sel: C + ".vp-kpi-grid", title: "Fiado: quem está devendo", text: "Toda venda com pagamento Fiado aparece aqui, com vencimento. Veja o total em aberto e o atrasado, registre pagamentos e cobre pelo WhatsApp." },
  { page: "/dashboard/pix", sel: C + "section.vp-card", nth: 1, title: "Cadastre sua chave PIX uma vez", text: "Informe o tipo e a chave, o nome do recebedor e a cidade. Fica salvo para as próximas cobranças." },
  { page: "/dashboard/pix", sel: C + "section.vp-card", nth: 0, title: "Gere a cobrança", text: "Digite o valor e o WhatsApp do cliente. O QR Code aparece ao lado: envie, copie o código ou baixe a imagem." },
  { page: "/dashboard/cash", sel: C + ".vp-btn-primary", title: "Caixa", text: "Lance entradas e saídas do dia (troco, despesas, retiradas) para saber quanto deve ter na gaveta." },
  { page: "/dashboard/receipts", title: "Recibos", text: "Todo recibo de venda fica aqui. Abra um para exportar em PDF ou mandar pelo WhatsApp." },
  { page: "/dashboard/reports", sel: C + ".vp-btn-primary", title: "Relatórios", text: "Produtos mais vendidos, formas de pagamento e horários de pico. Exporte para PDF ou Excel quando precisar." },
  { page: "/dashboard/commissions", sel: C + ".vp-kpi-grid", title: "Comissões", text: "Quanto cada vendedor vendeu e quanto tem de comissão no período." },
  { page: "/dashboard/team", sel: C + ".vp-btn-primary", title: "Equipe", text: "Adicione vendedores com login próprio. Eles registram vendas, mas não mexem nas configurações da loja." },
  { page: "/dashboard/settings", sel: '[data-tour="logo"]', title: "Deixe com a cara da sua loja", text: "Envie a logo da sua empresa: ela aparece no menu e nos recibos. Mais abaixo, escolha as cores do painel." },
  { page: "/dashboard/settings", sel: '[data-tour="abas"]', title: "Mostre só o que você usa", text: "Desligue as abas que sua loja não usa. Elas só ficam escondidas: ligue de novo quando quiser e tudo volta como estava." },
]

const KEY = "vp-tour-done"
const navLink = (href: string) => document.querySelector(`a.vp-nav-item[href="${href}"]`)

export default function Tour() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [inMenu, setInMenu] = useState(false)

  const steps = open ? STEPS.filter(s => !s.page || s.page === "/dashboard" || navLink(s.page)) : STEPS
  const step = steps[Math.min(i, steps.length - 1)]

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setOpen(true) } catch {}
    const onOpen = () => { setI(0); setOpen(true) }
    window.addEventListener("vp-tour-open", onOpen)
    return () => window.removeEventListener("vp-tour-open", onOpen)
  }, [])

  // abre a aba do passo
  useEffect(() => {
    if (open && step?.page && step.page !== pathname) router.push(step.page)
  }, [open, step?.page, pathname, router])

  // acompanha o alvo a cada quadro: a página carrega dados e muda de layout depois de aberta
  useEffect(() => {
    if (!open) return
    const find = (): Element | null => {
      if (!step?.page || step.page !== pathname) return null
      if (step.sel) return document.querySelectorAll(step.sel)[step.nth || 0] || null
      return navLink(step.page)
    }
    let raf = 0, last = "", scrolled = false
    const tick = () => {
      const el = find()
      if (el && !scrolled) { el.scrollIntoView({ block: "center" }); scrolled = true }
      const r = el?.getBoundingClientRect()
      const ok = r && r.width > 0 && r.right > 0 && r.bottom > 0 && r.top < window.innerHeight
      const key = ok ? `${r!.top}|${r!.left}|${r!.width}|${r!.height}` : "none"
      if (key !== last) { last = key; setRect(ok ? r! : null); setInMenu(!!el?.closest(".vp-sidebar")) }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [open, step?.page, step?.sel, step?.nth, pathname])

  const close = useCallback(() => { setOpen(false); try { localStorage.setItem(KEY, "1") } catch {} }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  if (!open || !step) return null
  const last = i >= steps.length - 1
  const pad = 6, W = Math.min(340, window.innerWidth - 32), H = 250
  const vw = window.innerWidth, vh = window.innerHeight
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max))
  let card: React.CSSProperties
  if (!rect) card = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" }
  else if (inMenu) card = { top: clamp(rect.top - 8, 16, vh - H - 16), left: rect.right + 18 }
  else {
    const below = rect.bottom + 14 + H < vh
    card = { top: below ? rect.bottom + 14 : Math.max(16, rect.top - 14 - H), left: clamp(rect.left, 16, vw - W - 16) }
  }

  // portal no body: o topo tem backdrop-filter, que faria o position:fixed medir a partir dele
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="vp-tour-title" style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
      {rect
        ? <div style={{ position: "fixed", top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: 12, border: "2px solid var(--brand)", boxShadow: "0 0 0 9999px rgba(0,0,0,.65)", transition: "all .25s ease", pointerEvents: "none" }} />
        : <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)" }} />}
      <div style={{ position: "fixed", ...card, width: W, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, boxShadow: "0 20px 50px rgba(0,0,0,.45)", transition: "top .25s ease, left .25s ease" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--brand-neon)", letterSpacing: ".06em", textTransform: "uppercase" }}>Passo {i + 1} de {steps.length}</div>
        <h2 id="vp-tour-title" style={{ fontSize: 16, fontWeight: 700, margin: "6px 0 8px" }}>{step.title}</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--text-muted)" }}>{step.text}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button type="button" className="vp-btn vp-btn-ghost vp-btn-sm" onClick={close} style={{ marginRight: "auto" }}>Pular tour</button>
          {i > 0 && <button type="button" className="vp-btn vp-btn-secondary vp-btn-sm" onClick={() => setI(i - 1)}>Voltar</button>}
          <button type="button" className="vp-btn vp-btn-primary vp-btn-sm" autoFocus onClick={() => last ? close() : setI(i + 1)}>{last ? "Começar a usar" : "Próximo"}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
