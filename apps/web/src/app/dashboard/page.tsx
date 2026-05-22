"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { fmt, fmtDate } from "@/lib/utils"
import Link from "next/link"

const MONTH_NAMES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

function BRL(v: number) {
  return v?.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) || "R$ 0,00"
}
function BRLshort(v: number) {
  if (v >= 1000) return "R$ " + (v/1000).toFixed(1) + "k"
  return BRL(v)
}

function Icon({ name, size=16 }: { name:string, size?:number }) {
  const icons: Record<string,string> = {
    cash:    "M3 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0",
    chart:   "M3 3v18h18M7 12h3v6H7zM12 8h3v10h-3zM17 5h3v13h-3z",
    receipt: "M6 2v20l3-2 3 2 3-2 3 2V2zM9 8h6M9 12h6M9 16h4",
    users:   "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    target:  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    arrow_up:"M18 15l-6-6-6 6",
    plus:    "M12 5v14M5 12h14",
    chevron: "M9 18l6-6-6-6",
    flame:   "M12 2c0 6-8 8-8 14a8 8 0 0 0 16 0c0-6-4-8-4-14",
    info:    "M12 9h.01M11 13h2v4h-2zM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    package: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || ""} />
    </svg>
  )
}

function KPI({ label, icon, value, delta, deltaDir="up", mono=true }: any) {
  return (
    <div style={{ padding:18, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, position:"relative", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"var(--text-subtle)", fontWeight:500, marginBottom:10 }}>
        <Icon name={icon} size={14} />
        {label}
      </div>
      <div style={{ fontSize:26, fontWeight:600, letterSpacing:"-0.02em", fontFamily: mono ? "var(--font-mono)" : "var(--font)", color:"var(--text)" }}>
        {value}
      </div>
      {delta && (
        <div style={{ marginTop:6, fontSize:12, display:"inline-flex", alignItems:"center", gap:4, color: deltaDir==="up" ? "var(--success)" : "var(--danger)" }}>
          <Icon name="arrow_up" size={11} />
          {delta}
        </div>
      )}
    </div>
  )
}

function BarChart({ data, labels }: { data:number[], labels?:string[] }) {
  const max = Math.max(...data, 1)
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:180, padding:"12px 0" }}>
        {data.map((v,i) => (
          <div key={i} style={{ flex:1, background:"linear-gradient(to top, var(--brand), var(--brand-soft))", borderRadius:"6px 6px 2px 2px", height:`${(v/max)*100}%`, minHeight:6, position:"relative", transition:"opacity 0.15s", cursor:"default" }}
            title={BRL(v)}>
            {labels && <span style={{ position:"absolute", bottom:-20, left:0, right:0, textAlign:"center", fontSize:10, color:"var(--text-subtle)" }}>{labels[i]}</span>}
          </div>
        ))}
      </div>
      {labels && <div style={{ height:24 }} />}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"month"|"custom">("month")
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [primary, setPrimary] = useState("#1D9E75")

  const now = new Date()
  const monthLabel = MONTH_NAMES[now.getMonth()]
  const year = now.getFullYear()

  useEffect(() => {
    try {
      const u = localStorage.getItem("user")
      const sc = localStorage.getItem("storeConfig")
      if (u) setUser(JSON.parse(u))
      if (sc) {
        const s = JSON.parse(sc)
        setStore(s)
        if (s.primaryColor) setPrimary(s.primaryColor)
      }
    } catch {}
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await api.get("/dashboard")
      setData(r.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const storeName = store?.name || user?.storeName || "Minha Loja"
  const userName = user?.name || "Voce"
  const firstName = userName.split(" ")[0]

  const fat = data?.revenue || 0
  const lucro = data?.profit || 0
  const margem = fat > 0 ? Math.round((lucro/fat)*100) : 0
  const ticket = data?.avgTicket || 0
  const totalVendas = data?.totalSales || 0
  const meta = store?.monthlyGoal || data?.monthlyGoal || 0
  const metaPct = meta > 0 ? Math.min(Math.round((fat/meta)*100),100) : 0
  const chartData: number[] = data?.dailyRevenue || []
  const chartLabels: string[] = data?.dailyLabels || []
  const sellers: any[] = data?.topSellers || []
  const products: any[] = data?.topProducts || []
  const recentSales: any[] = data?.recentSales || []

  return (
    <div style={{ padding:28, maxWidth:1440, margin:"0 auto" }}>
      <style>{`
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
        .dash-grid{display:grid;grid-template-columns:2fr 1fr;gap:18px;}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);}
        .card-head h3{margin:0;font-size:14px;font-weight:600;letter-spacing:-0.005em;}
        .card-head .sub{font-size:12px;color:var(--text-subtle);margin-top:2px;}
        .tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;}
        .tbl th{text-align:left;font-weight:500;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;color:var(--text-subtle);padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface-2);}
        .tbl td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle;}
        .tbl tr:last-child td{border-bottom:0;}
        .tbl tr:hover td{background:var(--surface-2);}
        .pill{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;background:var(--surface-3);color:var(--text-muted);}
        .list-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);}
        .list-item:last-child{border-bottom:0;}
        .list-meta{flex:1;min-width:0;}
        .list-meta strong{display:block;font-size:13px;font-weight:500;}
        .list-meta small{font-size:11px;color:var(--text-subtle);}
        .mini-bar{height:4px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:4px;}
        .mini-bar span{display:block;height:100%;background:var(--brand);border-radius:999px;}
        .avatar-sm{width:24px;height:24px;border-radius:50%;display:inline-grid;place-items:center;font-size:10px;font-weight:600;flex-shrink:0;}
        .avatar-md{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:600;flex-shrink:0;}
        .progress{height:8px;background:var(--surface-2);border-radius:999px;overflow:hidden;}
        .progress span{display:block;height:100%;border-radius:999px;}
        @media(max-width:1100px){.dash-grid{grid-template-columns:1fr!important;}}
        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:540px){.kpi-grid{grid-template-columns:1fr;}}
      `}</style>

      {/* PAGE HEAD */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:600, letterSpacing:"-0.02em" }}>
            Ola, {firstName} 👋
          </h1>
          <div style={{ color:"var(--text-subtle)", fontSize:14, marginTop:4 }}>
            Visao geral da {storeName} — {monthLabel} de {year}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", gap:4, background:"var(--surface-2)", padding:3, borderRadius:10, border:"1px solid var(--border)" }}>
            {(["month","custom"] as const).map(v => (
              <button key={v} onClick={()=>setPeriod(v)}
                style={{ padding:"6px 14px", fontSize:13, borderRadius:8, border:"none", cursor:"pointer", fontWeight: period===v ? 500 : 400,
                  background: period===v ? "var(--surface)" : "transparent",
                  color: period===v ? "var(--text)" : "var(--text-muted)",
                  boxShadow: period===v ? "var(--shadow-sm)" : "none" }}>
                {v==="month" ? "Este mes" : "Personalizado"}
              </button>
            ))}
          </div>
          <Link href="/dashboard/sales">
            <button style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", fontSize:13, fontWeight:500, background:primary, color:"white", border:"none", borderRadius:10, cursor:"pointer" }}>
              <Icon name="plus" size={14} /> Nova venda
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-subtle)" }}>Carregando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <KPI label="Faturamento do mes" icon="cash" value={BRL(fat)} delta={`${totalVendas} vendas`} />
            <KPI label="Lucro estimado" icon="chart" value={BRL(lucro)} delta={`${margem}% margem`} />
            <KPI label="Ticket medio" icon="receipt" value={BRL(ticket)} delta="Por venda" />
            <KPI label="Total de vendas" icon="package" value={String(totalVendas)} delta="No periodo" mono={false} />
          </div>

          {/* META */}
          {meta > 0 && (
            <div className="card" style={{ padding:18, marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600 }}>
                  <Icon name="target" size={15} /> Meta mensal
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontSize:15, fontWeight:600, fontFamily:"var(--font-mono)" }}>{BRL(fat)}</span>
                  <span style={{ fontSize:13, color:"var(--text-subtle)", fontFamily:"var(--font-mono)" }}> / {BRL(meta)}</span>
                  <span style={{ marginLeft:8, fontSize:12, color:primary, fontWeight:500 }}>{metaPct}%</span>
                </div>
              </div>
              <div className="progress">
                <span style={{ width:`${metaPct}%`, background:primary }} />
              </div>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="dash-grid">
            {/* ESQUERDA */}
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              {/* GRAFICO */}
              {chartData.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div>
                      <h3>Vendas por dia</h3>
                      <div className="sub">Ultimos {chartData.length} dias</div>
                    </div>
                  </div>
                  <div style={{ padding:"22px 18px 16px" }}>
                    <BarChart data={chartData} labels={chartLabels} />
                  </div>
                </div>
              )}

              {/* ULTIMAS VENDAS */}
              {recentSales.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div>
                      <h3>Ultimas vendas</h3>
                      <div className="sub">{totalVendas} no periodo</div>
                    </div>
                    <Link href="/dashboard/sales">
                      <button style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"5px 10px", fontSize:12, color:"var(--text-muted)", background:"none", border:"1px solid var(--border)", borderRadius:8, cursor:"pointer" }}>
                        Ver todas <Icon name="chevron" size={11} />
                      </button>
                    </Link>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Vendedor</th>
                        <th>Pagamento</th>
                        <th style={{ textAlign:"right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.slice(0,5).map((s:any) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight:500 }}>{s.customerName || "Cliente avulso"}</td>
                          <td>
                            {s.sellerName ? (
                              <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                                <span className="avatar-sm" style={{ background:primary, color:"white" }}>
                                  {s.sellerName.split(" ").map((x:string)=>x[0]).slice(0,2).join("")}
                                </span>
                                {s.sellerName}
                              </span>
                            ) : <span style={{ color:"var(--text-subtle)", fontSize:12 }}>—</span>}
                          </td>
                          <td><span className="pill">{s.paymentMethod === "cash" ? "Dinheiro" : s.paymentMethod === "pix" ? "PIX" : s.paymentMethod === "credit_card" ? "Credito" : "Debito"}</span></td>
                          <td style={{ textAlign:"right", fontFamily:"var(--font-mono)", fontWeight:600, color:primary }}>{BRL(s.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DIREITA */}
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              {/* RANKING */}
              <div className="card">
                <div className="card-head">
                  <h3>Ranking de vendedores</h3>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:999, fontSize:11, fontWeight:500, background:"var(--brand-tint)", color:"var(--brand-deep)" }}>
                    <Icon name="flame" size={11} /> {monthLabel}
                  </span>
                </div>
                <div style={{ padding:14 }}>
                  {sellers.length === 0 ? (
                    <div style={{ color:"var(--text-subtle)", fontSize:13, padding:"8px 0" }}>Sem dados</div>
                  ) : sellers.map((s:any,i:number) => {
                    const maxRev = sellers[0]?.revenue || 1
                    const colors = [primary, "#04342C", "#94A3B8", "#94A3B8", "#94A3B8"]
                    const initials = (s.sellerName||s.name||"?").split(" ").map((x:string)=>x[0]).slice(0,2).join("")
                    return (
                      <div key={i} className="list-item">
                        <div style={{ width:18, color:"var(--text-subtle)", fontFamily:"var(--font-mono)", fontSize:11 }}>#{i+1}</div>
                        <div className="avatar-md" style={{ background:colors[i]||"#94A3B8", color:"white" }}>{initials}</div>
                        <div className="list-meta">
                          <strong>{s.sellerName||s.name}</strong>
                          <small>{s.count} vendas</small>
                          <div className="mini-bar"><span style={{ width:`${(s.revenue/maxRev)*100}%` }}/></div>
                        </div>
                        <div style={{ fontFamily:"var(--font-mono)", fontWeight:600, fontSize:13 }}>{BRLshort(s.revenue)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* TOP PRODUTOS */}
              <div className="card">
                <div className="card-head">
                  <h3>Top produtos</h3>
                  <Link href="/dashboard/stock">
                    <button style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"5px 10px", fontSize:12, color:"var(--text-muted)", background:"none", border:"1px solid var(--border)", borderRadius:8, cursor:"pointer" }}>
                      Estoque <Icon name="chevron" size={11} />
                    </button>
                  </Link>
                </div>
                <div style={{ padding:14 }}>
                  {products.length === 0 ? (
                    <div style={{ color:"var(--text-subtle)", fontSize:13, padding:"8px 0" }}>Sem dados</div>
                  ) : products.slice(0,5).map((p:any,i:number) => (
                    <div key={i} className="list-item">
                      <div style={{ width:32, height:32, borderRadius:8, background:"var(--surface-2)", display:"grid", placeItems:"center", fontSize:16, flexShrink:0 }}>
                        📦
                      </div>
                      <div className="list-meta">
                        <strong>{p.name}</strong>
                        <small>{p.quantity} un. vendidas</small>
                      </div>
                      <div style={{ fontFamily:"var(--font-mono)", fontWeight:600, fontSize:13 }}>{BRLshort(p.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
