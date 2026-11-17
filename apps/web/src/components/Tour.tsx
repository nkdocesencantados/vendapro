"use client"
import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createPortal } from "react-dom"

// Tour guiado: abre no primeiro acesso (vp-tour-done) e pelo evento "vp-tour-open" (botão ? do topo).
// Cada passo pode abrir uma aba (page) e destacar um elemento dela (sel, n-ésimo com nth).
// Sem sel, destaca o item da aba no menu. Abas fora do plano ou ocultas pelo lojista são puladas.
// click: botão que o tour aperta sozinho para abrir uma janela (ex.: Nova venda) e mostrar os campos dela.
type Step = { page?: string; sel?: string; nth?: number; click?: string; title: string; text: string }
const C = ".vp-content "
const BTN = C + ".vp-btn-primary"
const STEPS: Step[] = [
  { title: "Bem-vindo ao VendaPro", text: "Vamos passar por cada aba e abrir as telas para você ver como tudo funciona. Leva 2 minutos. Pode pular: o botão Tour da loja, no topo, explica a tela em que você estiver." },
  { page: "/dashboard", sel: C + ".d-kpis", title: "Seu resumo do dia", text: "Aqui você vê quanto vendeu hoje, o faturamento do mês, o ticket médio, o fiado a receber e os produtos acabando." },
  { page: "/dashboard", sel: C + ".vp-btn-primary", title: "Atalho para vender", text: "De qualquer lugar do resumo, Nova venda leva direto para registrar uma venda." },
  { page: "/dashboard/inventory", sel: BTN, title: "Comece cadastrando seus produtos", text: "Em Estoque, o botão Novo produto abre o cadastro. Vamos abrir para você ver." },
  { page: "/dashboard/inventory", click: BTN, sel: ".vp-field:has(#inv-name)", title: "Nome do produto", text: "Escreva como você chama o produto na loja, ex.: \"Bolo de pote 250 ml\"." },
  { page: "/dashboard/inventory", click: BTN, sel: ".vp-field:has(#inv-price)", title: "Preço de venda", text: "Quanto o cliente paga por UMA unidade. Esse valor já entra sozinho quando você escolhe o produto na venda." },
  { page: "/dashboard/inventory", click: BTN, sel: ".vp-field:has(#inv-stock)", title: "Quantidade em estoque", text: "Quantas unidades você tem hoje. A cada venda o estoque diminui sozinho, e o painel avisa quando está acabando." },
  { page: "/dashboard/sales", sel: BTN, title: "Registre uma venda", text: "Toda venda começa no botão Nova venda. Vamos abrir para você ver cada campo." },
  { page: "/dashboard/sales", click: BTN, sel: ".vp-modal-body > div:first-child > .vp-field:first-child", title: "Cliente", text: "Digite o nome do cliente ou escolha um já cadastrado. Para vender fiado, o cliente é obrigatório." },
  { page: "/dashboard/sales", click: BTN, sel: '[data-tour="sale-payment"]', title: "Forma de pagamento", text: "Toque em como o cliente está pagando: PIX, Dinheiro, Crédito, Débito ou Fiado. No Fiado, escolha o vencimento: a venda vai para a aba Fiado até ser paga." },
  { page: "/dashboard/sales", click: BTN, sel: '[data-tour="sale-items"]', title: "Produto, quantidade e preço", text: "Em cada linha: escolha o PRODUTO, depois a QUANTIDADE (quantas unidades) e confira o PREÇO UNITÁRIO (valor de uma unidade). Use + Item para vender mais de um produto." },
  { page: "/dashboard/sales", click: BTN, sel: ".vp-modal-foot", title: "Total e finalizar", text: "O total é calculado na hora. Clique em Finalizar venda: ela entra no caixa, baixa o estoque e gera o recibo." },
  { page: "/dashboard/customers", sel: BTN, title: "Cadastre seus clientes", text: "Com o cliente salvo você vende no fiado e cobra pelo WhatsApp com um toque." },
  { page: "/dashboard/customers", click: BTN, sel: ".vp-field:has(#c-phone)", title: "WhatsApp do cliente", text: "Salve com DDD. É por ele que saem as cobranças do fiado e os recibos." },
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
  // pelo botão "Tour da loja": só os passos da tela aberta; no primeiro acesso: tour completo
  const [onlyPage, setOnlyPage] = useState<string | null>(null)

  const all = open ? STEPS.filter(s => !s.page || s.page === "/dashboard" || navLink(s.page)) : STEPS
  const pageSteps = onlyPage ? all.filter(s => s.page === onlyPage) : []
  const steps = pageSteps.length ? pageSteps : all
  const step = steps[Math.min(i, steps.length - 1)]

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setOpen(true) } catch {}
    const onOpen = (e: Event) => {
      setOnlyPage((e as CustomEvent).detail?.scope === "page" ? window.location.pathname : null)
      setI(0); setOpen(true)
    }
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
    let raf = 0, last = "", scrolled = false, acted = false
    const tick = () => {
      let el = find()
      // abre a janela do passo, ou fecha a que ficou aberta de um passo anterior
      if (!acted && step?.page === pathname) {
        const bg = document.querySelector<HTMLElement>(".vp-modal-bg")
        if (step.click && !el) { const b = document.querySelector<HTMLElement>(step.click); if (b) { b.click(); acted = true } }
        else if (!step.click && bg) { bg.click(); acted = true; el = null }
        else if (el || !step.click) acted = true
      }
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

  // fecha também a janela que o tour abriu (o botão do tour fica atrás de qualquer janela, então ela é do tour)
  const close = useCallback(() => {
    setOpen(false); document.querySelector<HTMLElement>(".vp-modal-bg")?.click()
    try { localStorage.setItem(KEY, "1") } catch {}
  }, [])

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
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--brand-neon)", letterSpacing: ".06em", textTransform: "uppercase" }}>{pageSteps.length ? "Esta tela · " : ""}Passo {i + 1} de {steps.length}</div>
        <h2 id="vp-tour-title" style={{ fontSize: 16, fontWeight: 700, margin: "6px 0 8px" }}>{step.title}</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--text-muted)" }}>{step.text}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button type="button" className="vp-btn vp-btn-ghost vp-btn-sm" onClick={close} style={{ marginRight: "auto" }}>Pular tour</button>
          {i > 0 && <button type="button" className="vp-btn vp-btn-secondary vp-btn-sm" onClick={() => setI(i - 1)}>Voltar</button>}
          <button type="button" className="vp-btn vp-btn-primary vp-btn-sm" autoFocus onClick={() => last ? close() : setI(i + 1)}>{last ? (pageSteps.length ? "Entendi" : "Começar a usar") : "Próximo"}</button>
        </div>
        {pageSteps.length > 0 && last && (
          <button type="button" onClick={() => { setOnlyPage(null); setI(0) }} style={{ marginTop: 12, background: "none", border: 0, padding: 0, color: "var(--brand-neon)", font: "inherit", fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>
            Ver o tour completo da loja
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
