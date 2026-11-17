"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { ShoppingCart, Users, HandCoins, QrCode, Package, BarChart3, Percent, Settings, Wallet, Receipt, type LucideIcon } from "lucide-react"

function BRL(v: number) { return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

interface Result {
  id: string
  type: "sale" | "product"
  name?: string
  customerName?: string
  total?: number
  stock?: number
  price?: number
  createdAt?: string
}

export default function CommandPalette() {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState<{ sales: Result[]; products: Result[] }>({ sales: [], products: [] })
  const [loading, setLoading] = useState(false)
  const [sel,     setSel]     = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<any>(null)

  const storeId = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem("storeConfig") || "{}").id || "" } catch { return "" } })()
    : ""

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o) }
      if (e.key === "Escape") setOpen(false)
    }
    function onOpen() { setOpen(true) }
    window.addEventListener("keydown", onKey)
    window.addEventListener("open-cmd-palette", onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("open-cmd-palette", onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setResults({ sales: [], products: [] })
    }
  }, [open])

  const doSearch = useCallback((q: string) => {
    if (!q || q.length < 2) { setResults({ sales: [], products: [] }); return }
    setLoading(true)
    api.get("/reports/search?q=" + encodeURIComponent(q))
      .then(r => { setResults(r.data); setSel(0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [storeId])

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(v), 280)
  }

  const allItems: Result[] = [
    ...results.sales.map(s => ({ ...s, type: "sale" as const })),
    ...results.products.map(p => ({ ...p, type: "product" as const })),
  ]

  function navigate(r: Result) {
    setOpen(false)
    if (r.type === "sale") router.push("/dashboard/sales")
    else router.push("/dashboard/inventory")
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, allItems.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    if (e.key === "Enter" && allItems[sel]) navigate(allItems[sel])
  }

  if (!open) return null

  const hasSales    = results.sales.length > 0
  const hasProducts = results.products.length > 0
  const hasAny      = hasSales || hasProducts

  const shortcuts: { label: string; href: string; icon: LucideIcon }[] = [
    { label: "Nova venda",      href: "/dashboard/sales",       icon: ShoppingCart },
    { label: "Clientes",        href: "/dashboard/customers",   icon: Users },
    { label: "Fiado a receber", href: "/dashboard/receivables", icon: HandCoins },
    { label: "Cobrar com PIX",  href: "/dashboard/pix",         icon: QrCode },
    { label: "Ver estoque",     href: "/dashboard/inventory",   icon: Package },
    { label: "Caixa",           href: "/dashboard/cash",        icon: Wallet },
    { label: "Recibos",         href: "/dashboard/receipts",    icon: Receipt },
    { label: "Relatórios",      href: "/dashboard/reports",     icon: BarChart3 },
    { label: "Comissões",       href: "/dashboard/commissions", icon: Percent },
    { label: "Configurações",   href: "/dashboard/settings",    icon: Settings },
  ]

  return (
    <div>
      <div
        onClick={() => setOpen(false)}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(6px)", zIndex:9998 }}
      />
      <div style={{
        position:"fixed", top:"15%", left:"50%", transform:"translateX(-50%)",
        width:"min(580px, 90vw)",
        background:"var(--surface)",
        border:"1px solid var(--border-strong)",
        borderRadius:16,
        boxShadow:"0 24px 60px rgba(0,0,0,0.5)",
        zIndex:9999,
        overflow:"hidden",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderBottom:"1px solid var(--border)" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={onInput}
            onKeyDown={onKeyDown}
            placeholder="Buscar vendas, produtos, clientes..."
            style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:15, color:"var(--text)", fontFamily:"var(--font)" }}
          />
          {loading && (
            <div style={{ width:14, height:14, border:"2px solid var(--border)", borderTopColor:"var(--brand)", borderRadius:"50%", animation:"spin 0.7s linear infinite", flexShrink:0 }}/>
          )}
          <kbd style={{ fontSize:11, color:"var(--text-subtle)", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:5, padding:"2px 6px", flexShrink:0 }}>ESC</kbd>
        </div>

        <div style={{ maxHeight:360, overflowY:"auto" }}>
          {query.length >= 2 && !hasAny && !loading && (
            <div style={{ padding:"32px 16px", textAlign:"center", color:"var(--text-subtle)", fontSize:13 }}>
              Nenhum resultado para <strong style={{ color:"var(--text)" }}>{query}</strong>
            </div>
          )}

          {query.length < 2 && (
            <div style={{ padding:"16px" }}>
              <div style={{ fontSize:11, color:"var(--text-subtle)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10 }}>Atalhos rápidos</div>
              {shortcuts.map(item => (
                <button
                  type="button"
                  key={item.href}
                  onClick={() => { router.push(item.href); setOpen(false) }}
                  style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 12px", borderRadius:8, cursor:"pointer", background:"transparent", border:0, font:"inherit", textAlign:"left" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                >
                  <item.icon size={16} strokeWidth={1.8} color="var(--brand-neon)" aria-hidden />
                  <span style={{ fontSize:13, color:"var(--text)" }}>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {hasSales && (
            <div style={{ padding:"8px 0" }}>
              <div style={{ fontSize:10, color:"var(--text-subtle)", textTransform:"uppercase", letterSpacing:".08em", padding:"4px 16px 6px" }}>Vendas</div>
              {results.sales.map((s, i) => {
                const isSel = sel === i
                return (
                  <div
                    key={s.id}
                    onClick={() => navigate(s)}
                    onMouseEnter={() => setSel(i)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", cursor:"pointer", background: isSel ? "var(--surface-2)" : "transparent" }}
                  >
                    <div style={{ width:32, height:32, borderRadius:8, background:"var(--surface-3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"var(--brand-neon)", flexShrink:0 }}>
                      {(s.customerName || "AV").slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.customerName || "Cliente avulso"}</div>
                      <div style={{ fontSize:11, color:"var(--text-subtle)" }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : ""}</div>
                    </div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:600, color:"var(--brand-neon)" }}>{BRL(s.total || 0)}</div>
                  </div>
                )
              })}
            </div>
          )}

          {hasProducts && (
            <div style={{ padding:"8px 0", borderTop: hasSales ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize:10, color:"var(--text-subtle)", textTransform:"uppercase", letterSpacing:".08em", padding:"4px 16px 6px" }}>Produtos</div>
              {results.products.map((p, i) => {
                const isSel = sel === (results.sales.length + i)
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(p)}
                    onMouseEnter={() => setSel(results.sales.length + i)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", cursor:"pointer", background: isSel ? "var(--surface-2)" : "transparent" }}
                  >
                    <div style={{ width:32, height:32, borderRadius:8, background:"var(--surface-3)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth={1.6}><path d="M21 8v13H3V8M12 3v18M3 8l9-5 9 5"/></svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                      <div style={{ fontSize:11, color:"var(--text-subtle)" }}>Estoque: {p.stock} un.</div>
                    </div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:600, color:"var(--text)" }}>{BRL(p.price || 0)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding:"8px 16px", borderTop:"1px solid var(--border)", display:"flex", gap:14, alignItems:"center" }}>
          {[["↑↓","navegar"], ["↵","abrir"], ["ESC","fechar"]].map(([k, l]) => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <kbd style={{ fontSize:10, color:"var(--text-subtle)", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:4, padding:"1px 5px" }}>{k}</kbd>
              <span style={{ fontSize:11, color:"var(--text-subtle)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
