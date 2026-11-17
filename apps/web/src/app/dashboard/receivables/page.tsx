"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { HandCoins, MessageCircle, X } from "lucide-react"
import { api } from "@/lib/api"
import { storePix, waLink } from "@/lib/pix"

const BRL = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const DATE = (d?: string) => (d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—")
const TABS = [["open", "Em aberto"], ["overdue", "Atrasados"], ["paid", "Pagos"], ["all", "Todos"]] as const
const STATUS: Record<string, [string, string]> = { open: ["Em aberto", "vp-pill-warn"], overdue: ["Atrasado", "vp-pill-bad"], paid: ["Pago", "vp-pill-ok"] }

export default function ReceivablesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [status, setStatus] = useState("open")
  const [loading, setLoading] = useState(true)
  const [pay, setPay] = useState<any>(null) // { row, amount, method }
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get("/stores").then(r => setStore(Array.isArray(r.data) ? r.data[0] : r.data)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [status])

  async function load() {
    setLoading(true)
    const [l, s] = await Promise.allSettled([api.get("/receivables", { params: { status } }), api.get("/receivables/summary")])
    setRows(l.status === "fulfilled" && Array.isArray(l.value.data) ? l.value.data : [])
    setSummary(s.status === "fulfilled" ? s.value.data : null)
    if (l.status === "rejected") toast.error("Não foi possível carregar o fiado")
    setLoading(false)
  }

  async function registerPayment() {
    const amount = Math.round(parseFloat(String(pay.amount).replace(",", ".")) * 100) / 100
    if (!(amount > 0)) return toast.error("Informe um valor válido")
    if (amount > Number(pay.row.balance) + 0.001) return toast.error(`O saldo é ${BRL(pay.row.balance)}`)
    setSaving(true)
    try {
      await api.post(`/receivables/${pay.row.saleId}/payments`, { amount, method: pay.method })
      toast.success(amount >= Number(pay.row.balance) ? "Fiado quitado!" : "Pagamento registrado")
      setPay(null); load()
    } catch (e: any) { toast.error(e?.response?.data?.message || "Erro ao registrar pagamento") }
    finally { setSaving(false) }
  }

  function charge(r: any) {
    const pix = storePix(store, Number(r.balance))
    const first = (r.customerName || "").split(" ")[0]
    const text = `Oi ${first}! Passando para lembrar do valor de ${BRL(r.balance)} da compra de ${DATE(r.saleDate)}${r.dueDate ? ` (vencimento ${DATE(r.dueDate)})` : ""}.`
      + (pix ? ` Pode pagar pelo PIX copia e cola abaixo.` : "")
      + ` Obrigado!${store?.name ? ` — ${store.name}` : ""}`
      + (pix ? `\n\n${pix}` : "")
    window.open(waLink(r.customerPhone, text), "_blank", "noopener")
  }

  const cards: [string, number | undefined, string?][] = [
    ["Total em aberto", summary?.open],
    ["Atrasado", summary?.overdue, "var(--warning)"],
    ["Recebido no mês", summary?.receivedThisMonth, "var(--brand-glow)"],
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Toaster position="top-center" />
      <style dangerouslySetInnerHTML={{ __html: `
        .rv-tabs{display:flex;gap:4px;padding:4px;border-radius:12px;border:1px solid var(--border);background:var(--surface);flex-wrap:wrap}
        .rv-tab{min-height:36px;padding:0 14px;border-radius:9px;border:0;background:transparent;color:var(--text-muted);font-size:13px;font-weight:500;cursor:pointer}
        .rv-tab.on{background:var(--brand-tint);color:var(--text);font-weight:600;box-shadow:inset 0 0 0 1px var(--brand-soft)}
        .rv-num{font-family:var(--font-mono);letter-spacing:-.02em}
        .rv-pm{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
      ` }} />

      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <div style={{ marginRight: "auto" }}>
          <h1 className="vp-page-title" style={{ margin: 0 }}>Fiado</h1>
          <div className="vp-page-sub">{summary?.dueThisWeek ? `${summary.dueThisWeek} cobrança${summary.dueThisWeek > 1 ? "s vencem" : " vence"} esta semana` : "Contas a receber dos seus clientes"}</div>
        </div>
        <div className="rv-tabs" role="tablist" aria-label="Situação">
          {TABS.map(([v, l]) => <button key={v} role="tab" aria-selected={status === v} className={`rv-tab${status === v ? " on" : ""}`} onClick={() => setStatus(v)}>{l}</button>)}
        </div>
      </header>

      <section aria-label="Resumo do fiado" className="vp-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {cards.map(([l, v, c]) => (
          <div key={l} className="vp-kpi">
            <div className="vp-kpi-label">{l}</div>
            <div className="vp-kpi-value rv-num" style={c ? { color: c } : undefined}>{summary ? BRL(v || 0) : "—"}</div>
          </div>
        ))}
      </section>

      {!store?.pixKey && store && (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Dica: cadastre sua chave PIX em <Link href="/dashboard/settings" style={{ color: "var(--brand-glow)" }}>Configurações</Link> para mandar o código PIX junto com a cobrança.
        </div>
      )}

      <section className="vp-card">
        {loading ? <div className="vp-empty"><div className="vp-empty-sub">Carregando...</div></div>
          : rows.length === 0 ? (
            <div className="vp-empty">
              <div className="vp-empty-title">{status === "paid" ? "Nenhum fiado pago ainda" : "Nenhum fiado por aqui"}</div>
              <div className="vp-empty-sub">Vendas com pagamento "Fiado" aparecem nesta lista.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="vp-table" style={{ minWidth: 720 }}>
                <thead><tr><th>Cliente</th><th>Compra</th><th>Vencimento</th><th>Situação</th><th style={{ textAlign: "right" }}>Saldo</th><th><span className="sr-only" style={{ position: "absolute", left: -9999 }}>Ações</span></th></tr></thead>
                <tbody>
                  {rows.map(r => {
                    const [label, cls] = STATUS[r.status] || [r.status, "vp-pill-grey"]
                    return (
                      <tr key={r.saleId}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ color: "var(--text)" }}>{r.customerName}</span>
                            <span className="rv-num" style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.customerPhone || "sem telefone"}</span>
                          </div>
                        </td>
                        <td>{DATE(r.saleDate)}<div className="rv-num" style={{ fontSize: 12, color: "var(--text-subtle)" }}>{BRL(r.total)}{Number(r.paidAmount) > 0 && ` · pago ${BRL(r.paidAmount)}`}</div></td>
                        <td>{DATE(r.dueDate)}</td>
                        <td><span className={`vp-pill ${cls}`}>{label}</span></td>
                        <td className="rv-num" style={{ textAlign: "right", color: "var(--text)" }}>{BRL(r.balance)}</td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {r.status !== "paid" && <>
                            <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={() => charge(r)}><MessageCircle size={14} /> Cobrar</button>{" "}
                            <button className="vp-btn vp-btn-primary vp-btn-sm" onClick={() => setPay({ row: r, amount: Number(r.balance).toFixed(2), method: "pix" })}><HandCoins size={14} /> Receber</button>
                          </>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {pay && (
        <div className="vp-modal-bg" onClick={() => setPay(null)}>
          <div className="vp-modal" style={{ maxWidth: 420 }} role="dialog" aria-modal="true" aria-label="Registrar pagamento" onClick={e => e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>Registrar pagamento</h2>
              <button className="vp-icon-btn" aria-label="Fechar" onClick={() => setPay(null)}><X size={16} /></button>
            </div>
            <div className="vp-modal-body">
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)" }}>{pay.row.customerName} · saldo <b className="rv-num" style={{ color: "var(--text)" }}>{BRL(pay.row.balance)}</b></p>
              <div className="vp-field">
                <label htmlFor="pay-amount">Valor recebido</label>
                <input id="pay-amount" className="vp-input rv-num" inputMode="decimal" autoFocus value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={() => setPay({ ...pay, amount: Number(pay.row.balance).toFixed(2) })}>Valor total</button>
                  <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={() => setPay({ ...pay, amount: (Number(pay.row.balance) / 2).toFixed(2) })}>Metade</button>
                </div>
              </div>
              <div className="vp-field">
                <label>Forma</label>
                <div className="rv-pm" role="radiogroup">
                  {[["pix", "PIX"], ["cash", "Dinheiro"], ["debit_card", "Débito"], ["credit_card", "Crédito"]].map(([v, l]) => (
                    <button key={v} role="radio" aria-checked={pay.method === v} className={`vp-btn ${pay.method === v ? "vp-btn-primary" : "vp-btn-secondary"}`} style={{ justifyContent: "center" }} onClick={() => setPay({ ...pay, method: v })}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={() => setPay(null)}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={registerPayment} disabled={saving}>{saving ? "Salvando..." : "Confirmar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
