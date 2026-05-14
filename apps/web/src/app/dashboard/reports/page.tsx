"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"

function Bar({ value, max, color = "#1D9E75" }: any) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 8, flex: 1 }}>
      <div style={{ background: color, borderRadius: 4, height: 8, width: `${pct}%`, transition: "width 0.5s" }} />
    </div>
  )
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("overview")
  const [data, setData] = useState<any>(null)
  const now = new Date()
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0])
  const [to, setTo] = useState(now.toISOString().split("T")[0])

  useEffect(() => { loadData() }, [from, to])

  async function loadData() {
    setLoading(true)
    try {
      const r = await api.get(`/reports/advanced?from=${from}&to=${to}`)
      setData(r.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function setPreset(preset: string) {
    const n = new Date()
    if (preset === "today") { setFrom(n.toISOString().split("T")[0]); setTo(n.toISOString().split("T")[0]) }
    else if (preset === "week") { const d = new Date(); d.setDate(d.getDate() - 7); setFrom(d.toISOString().split("T")[0]); setTo(n.toISOString().split("T")[0]) }
    else if (preset === "month") { setFrom(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0]); setTo(n.toISOString().split("T")[0]) }
    else if (preset === "year") { setFrom(new Date(n.getFullYear(), 0, 1).toISOString().split("T")[0]); setTo(n.toISOString().split("T")[0]) }
    else if (preset === "lastmonth") { setFrom(new Date(n.getFullYear(), n.getMonth()-1, 1).toISOString().split("T")[0]); setTo(new Date(n.getFullYear(), n.getMonth(), 0).toISOString().split("T")[0]) }
  }

  async function exportPdf() {
    if (!data) return
    const { jsPDF } = await import("jspdf" as any).catch(() => ({ jsPDF: (window as any).jspdf?.jsPDF }))
    const JP = jsPDF || (window as any).jspdf?.jsPDF
    const doc = new JP()
    doc.setFontSize(16); doc.setFont("helvetica","bold")
    doc.text("VendaPro - Relatorio", 105, 20, { align: "center" })
    doc.setFontSize(10); doc.setFont("helvetica","normal")
    doc.text(`Periodo: ${from} a ${to}`, 105, 28, { align: "center" })
    doc.line(20, 32, 190, 32)
    let y = 40
    const row = (label: string, value: string) => { doc.setFont("helvetica","bold"); doc.text(label, 20, y); doc.setFont("helvetica","normal"); doc.text(value, 190, y, { align: "right" }); y += 8 }
    doc.setFont("helvetica","bold"); doc.text("RESUMO", 20, y); y += 8
    row("Faturamento:", fmt(d.totalRevenue || 0))
    row("Qtd Vendas:", String(d.totalSales || 0))
    row("Ticket Medio:", fmt(d.avgTicket || 0))
    row("Lucro Estimado:", fmt(d.estimatedProfit || 0))
    doc.line(20, y, 190, y); y += 8
    doc.setFont("helvetica","bold"); doc.text("TOP PRODUTOS", 20, y); y += 8
    doc.setFont("helvetica","normal")
    ;(d.topProducts || []).slice(0,10).forEach((p: any) => { doc.text(p.name, 20, y); doc.text(fmt(p.revenue), 190, y, { align: "right" }); y += 7 })
    doc.save(`relatorio-${from}-${to}.pdf`)
  }

  async function exportCsv() {
    if (!data) return
    const rows = [
      ["Relatorio VendaPro — " + from + " a " + to],
      [],
      ["RESUMO"],
      ["Faturamento", fmt(data.totalRevenue)],
      ["Qtd Vendas", data.totalSales],
      ["Ticket Medio", fmt(data.avgTicket)],
      ["Lucro Estimado", fmt(data.estimatedProfit)],
      [],
      ["PRODUTOS MAIS VENDIDOS"],
      ["Produto", "Qtd", "Faturamento"],
      ...(data.topProducts || []).map((p: any) => [p.name, p.quantity, fmt(p.revenue)]),
      [],
      ["VENDAS POR DIA"],
      ["Data", "Valor", "Qtd Vendas"],
      ...(data.dailyChart || []).map((x: any) => [x.day, fmt(x.value), x.count]),
    ]
    const csv = rows.map((r: any[]) => r.join(";")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `relatorio-${from}-${to}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const tabStyle = (t: string) => ({
    padding: "8px 16px", fontSize: "13px", border: "none", borderRadius: "8px",
    cursor: "pointer", background: tab === t ? "#1D9E75" : "transparent",
    color: tab === t ? "white" : "#666", fontWeight: tab === t ? 500 : 400,
  })

  const d = data || {}
  const topProducts = d.topProducts || []
  const dailyChart = d.dailyChart || []
  const maxDaily = Math.max(...dailyChart.map((x: any) => x.value), 1)
  const maxProduct = Math.max(...topProducts.map((x: any) => x.revenue), 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "0 20px", height: "50px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>Relatorios</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={exportPdf} style={{ padding: "5px 12px", fontSize: "12px", border: "0.5px solid #1D9E75", borderRadius: "6px", cursor: "pointer", background: "white", color: "#1D9E75" }}>Exportar PDF</button>
          <button onClick={exportCsv} style={{ padding: "5px 12px", fontSize: "12px", border: "0.5px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", background: "white", color: "#666" }}>Exportar CSV</button>
          <button onClick={() => window.print()} style={{ padding: "5px 12px", fontSize: "12px", border: "0.5px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", background: "white", color: "#666" }}>Imprimir</button>
        </div>
      </div>

      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "10px 20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setPreset("year")} style={{ padding: "5px 12px", fontSize: "12px", border: "0.5px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", background: "white", color: "#666" }}>Este ano</button>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#888" }}>De</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: "5px 8px", border: "0.5px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }} />
          <span style={{ fontSize: "12px", color: "#888" }}>ate</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: "5px 8px", border: "0.5px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }} />
        </div>
      </div>

      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "0 20px", display: "flex", gap: "4px" }}>
        {[["overview","Visao Geral"],["products","Produtos"],["sales","Vendas"],["finance","Financeiro"]].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{l}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {loading ? <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Carregando...</div> : (
          <>
            {tab === "overview" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { label: "Faturamento", value: fmt(d.totalRevenue || 0), color: "#1D9E75", sub: `${d.totalSales || 0} vendas` },
                    { label: "Ticket Medio", value: fmt(d.avgTicket || 0), color: "#3b82f6", sub: "por venda" },
                    { label: "Lucro Estimado", value: fmt(d.estimatedProfit || 0), color: "#8b5cf6", sub: "margem estimada" },
                    { label: "Produtos Parados", value: String(d.slowProducts || 0), color: "#f59e0b", sub: "sem movimento" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{m.label}</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>Vendas por dia</div>
                    {dailyChart.length === 0 && <div style={{ color: "#888", fontSize: "13px" }}>Sem dados no periodo</div>}
                    {dailyChart.map((x: any) => (
                      <div key={x.day} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ fontSize: "11px", color: "#888", width: "50px", flexShrink: 0 }}>{x.day}</div>
                        <Bar value={x.value} max={maxDaily} />
                        <div style={{ fontSize: "11px", color: "#333", width: "80px", textAlign: "right" }}>{fmt(x.value)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>Top 5 Produtos</div>
                    {topProducts.slice(0, 5).map((p: any, i: number) => (
                      <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <div style={{ width: "20px", height: "20px", background: "#1D9E75", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: 500 }}>{p.name}</div>
                          <Bar value={p.revenue} max={maxProduct} />
                        </div>
                        <div style={{ fontSize: "12px", color: "#1D9E75", fontWeight: 600, flexShrink: 0 }}>{fmt(p.revenue)}</div>
                      </div>
                    ))}
                    {topProducts.length === 0 && <div style={{ color: "#888", fontSize: "13px" }}>Sem dados no periodo</div>}
                  </div>
                </div>
              </>
            )}

            {tab === "products" && (
              <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>Produtos mais vendidos</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "8px", marginBottom: "8px", fontSize: "11px", color: "#888", fontWeight: 500 }}>
                  <div>PRODUTO</div><div style={{ textAlign: "center" }}>QTD</div><div style={{ textAlign: "right" }}>FATURAMENTO</div><div style={{ textAlign: "right" }}>PARTICIPACAO</div>
                </div>
                {topProducts.map((p: any) => (
                  <div key={p.name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "8px", padding: "10px 0", borderTop: "0.5px solid #f3f4f6", alignItems: "center" }}>
                    <div><div style={{ fontSize: "13px", fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: "11px", color: "#888" }}>{p.category || "Sem categoria"}</div></div>
                    <div style={{ textAlign: "center", fontSize: "13px" }}>{p.quantity} un</div>
                    <div style={{ textAlign: "right", fontSize: "13px", color: "#1D9E75", fontWeight: 600 }}>{fmt(p.revenue)}</div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: "12px", color: "#666" }}>{d.totalRevenue > 0 ? Math.round((p.revenue / d.totalRevenue) * 100) : 0}%</div><Bar value={p.revenue} max={maxProduct} color="#3b82f6" /></div>
                  </div>
                ))}
                {topProducts.length === 0 && <div style={{ color: "#888", fontSize: "13px", padding: "20px 0" }}>Nenhuma venda no periodo</div>}
              </div>
            )}

            {tab === "sales" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                  {[
                    { label: "Total de vendas", value: String(d.totalSales || 0), suffix: "vendas" },
                    { label: "Maior venda", value: fmt(d.maxSale || 0), suffix: "" },
                    { label: "Menor venda", value: fmt(d.minSale || 0), suffix: "" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{m.label}</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: "#1D9E75" }}>{m.value}</div>
                      {m.suffix && <div style={{ fontSize: "11px", color: "#aaa" }}>{m.suffix}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>Evolucao de vendas</div>
                  {dailyChart.length === 0 && <div style={{ color: "#888", fontSize: "13px" }}>Sem dados no periodo</div>}
                  {dailyChart.map((x: any) => (
                    <div key={x.day} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <div style={{ fontSize: "11px", color: "#888", width: "80px", flexShrink: 0 }}>{x.day}</div>
                      <Bar value={x.value} max={maxDaily} color="#3b82f6" />
                      <div style={{ fontSize: "12px", color: "#333", width: "90px", textAlign: "right" }}>{fmt(x.value)}</div>
                      <div style={{ fontSize: "11px", color: "#888", width: "40px", textAlign: "right" }}>{x.count}v</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "finance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                  {[
                    { label: "Receita total", value: fmt(d.totalRevenue || 0), color: "#1D9E75" },
                    { label: "Custo estimado", value: fmt((d.totalRevenue || 0) * 0.6), color: "#ef4444" },
                    { label: "Lucro estimado", value: fmt(d.estimatedProfit || 0), color: "#8b5cf6" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{m.label}</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>Formas de pagamento</div>
                  {(d.paymentMethods || []).length === 0 && <div style={{ color: "#888", fontSize: "13px" }}>Sem dados no periodo</div>}
                  {(d.paymentMethods || []).map((p: any) => (
                    <div key={p.method} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", width: "100px", flexShrink: 0 }}>{p.method === "cash" ? "Dinheiro" : p.method === "pix" ? "PIX" : p.method === "credit_card" ? "Credito" : "Debito"}</div>
                      <Bar value={p.total} max={d.totalRevenue || 1} color="#f59e0b" />
                      <div style={{ fontSize: "12px", color: "#333", width: "80px", textAlign: "right" }}>{fmt(p.total)}</div>
                      <div style={{ fontSize: "11px", color: "#888", width: "35px", textAlign: "right" }}>{d.totalRevenue > 0 ? Math.round((p.total / d.totalRevenue) * 100) : 0}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}