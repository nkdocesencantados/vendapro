"use client"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { api } from "@/lib/api"

const BRL = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export default function CommissionsPage() {
  const now = new Date()
  const [from, setFrom] = useState(ymd(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [to, setTo] = useState(ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)))
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!from || !to || from > to) return
    setLoading(true)
    api.get("/reports/commissions", { params: { from, to } })
      .then(r => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => { setRows([]); toast.error("Não foi possível carregar as comissões") })
      .finally(() => setLoading(false))
  }, [from, to])

  const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k] || 0), 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Toaster position="top-center" />
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
        <div style={{ marginRight: "auto" }}>
          <h1 className="vp-page-title" style={{ margin: 0 }}>Comissões</h1>
          <div className="vp-page-sub">Quanto cada vendedor vendeu e tem a receber no período</div>
        </div>
        <div className="vp-field" style={{ margin: 0 }}><label htmlFor="cm-from">De</label><input id="cm-from" type="date" className="vp-input" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div className="vp-field" style={{ margin: 0 }}><label htmlFor="cm-to">Até</label><input id="cm-to" type="date" className="vp-input" value={to} onChange={e => setTo(e.target.value)} /></div>
      </header>

      <section className="vp-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        <div className="vp-kpi"><div className="vp-kpi-label">Vendido</div><div className="vp-kpi-value">{BRL(sum("total"))}</div></div>
        <div className="vp-kpi"><div className="vp-kpi-label">Comissões</div><div className="vp-kpi-value brand">{BRL(sum("commission"))}</div></div>
        <div className="vp-kpi"><div className="vp-kpi-label">Vendas</div><div className="vp-kpi-value">{sum("sales")}</div></div>
      </section>

      <section className="vp-card">
        {from > to ? <div className="vp-empty"><div className="vp-empty-sub">A data inicial deve ser antes da final.</div></div>
          : loading ? <div className="vp-empty"><div className="vp-empty-sub">Carregando...</div></div>
          : rows.length === 0 ? <div className="vp-empty"><div className="vp-empty-title">Sem vendas no período</div><div className="vp-empty-sub">Escolha outro intervalo de datas.</div></div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table className="vp-table" style={{ minWidth: 480 }}>
                <thead><tr><th>Vendedor</th><th style={{ textAlign: "right" }}>Vendas</th><th style={{ textAlign: "right" }}>Total vendido</th><th style={{ textAlign: "right" }}>Comissão</th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.sellerId}>
                      <td style={{ color: "var(--text)" }}>{r.sellerName}</td>
                      <td style={{ textAlign: "right" }}>{r.sales}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{BRL(r.total)}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--brand-glow)" }}>{BRL(r.commission)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: 700, color: "var(--text)" }}>Total</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{sum("sales")}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{BRL(sum("total"))}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--brand-glow)" }}>{BRL(sum("commission"))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  )
}
