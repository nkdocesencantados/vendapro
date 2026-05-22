"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import { useAuthStore } from "@/contexts/auth.store"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }
const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const PAY: Record<string,string> = { cash:"Dinheiro", pix:"PIX", credit_card:"Credito", debit_card:"Debito" }

function Spark({ data, color="#1D9E75" }: { data:number[], color?:string }) {
  if(!data.length) return null
  const max = Math.max(...data,1)
  const w=80, h=32, pad=2
  const pts = data.map((v,i) => {
    const x = pad + (i/(data.length-1||1))*(w-pad*2)
    const y = h-pad-(v/max)*(h-pad*2)
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={w} height={h} style={{position:"absolute",bottom:0,right:0,opacity:0.4}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function KPI({ label, icon, value, delta, deltaDir="up", spark, mono=true }: any) {
  return (
    <div style={{ padding:18, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, position:"relative", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"var(--text-subtle)", fontWeight:500, marginBottom:10 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize:26, fontWeight:600, letterSpacing:"-0.02em", fontFamily: mono?"var(--font-mono)":"var(--font)", color:"var(--text)", position:"relative", zIndex:1 }}>
        {value}
      </div>
      {delta && (
        <div style={{ marginTop:6, fontSize:12, display:"inline-flex", alignItems:"center", gap:4, color: deltaDir==="up"?"var(--success)":"var(--danger)", position:"relative", zIndex:1 }}>
          {deltaDir==="up" ? "+" : "-"} {delta}
        </div>
      )}
      {spark}
    </div>
  )
}

function BarChart({ data, labels }: { data:number[], labels?:string[] }) {
  const max = Math.max(...data,1)
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:160 }}>
        {data.map((v,i) => (
          <div key={i} title={BRL(v)} style={{ flex:1, background:"linear-gradient(to top,var(--brand),#34D399)", borderRadius:"4px 4px 2px 2px", height:`${Math.max((v/max)*100,2)}%`, minHeight:3, transition:"opacity .15s", cursor:"default", position:"relative" }}>
            {labels && <span style={{ position:"absolute", bottom:-18, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"var(--text-subtle)", whiteSpace:"nowrap" }}>{labels[i]}</span>}
          </div>
        ))}
      </div>
      {labels && <div style={{ height:20 }} />}
    </div>
  )
}

function Icon({ name }: { name:string }) {
  const icons: Record<string,string> = {
    cash:    "M3 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0",
    chart:   "M3 3v18h18M7 12h3v6H7zM12 8h3v10h-3zM17 5h3v13h-3z",
    sparkle: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z",
    receipt: "M6 2v20l3-2 3 2 3-2 3 2V2zM9 8h6M9 12h6M9 16h4",
    target:  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    flame:   "M12 2c0 6-8 8-8 14a8 8 0 0 0 16 0c0-6-4-8-4-14",
    chevron: "M9 18l6-6-6-6",
    info:    "M12 9h.01M11 13h2v4h-2zM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    plus:    "M12 5v14M5 12h14",
    download:"M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 3v13",
    calendar:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  }
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <path d={icons[name]||""} />
    </svg>
  )
}

export default function DashboardPage() {
  const { user: authUser } = useAuthStore()
  const [data, setData]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [primary, setPrimary] = useState("#1D9E75")

  const now = new Date()
  const monthLabel = MONTHS[now.getMonth()]
  const year = now.getFullYear()

  useEffect(() => {
    try {
      const sc = localStorage.getItem("storeConfig")
      if(sc){ const s=JSON.parse(sc); setStore(s); if(s.primaryColor)setPrimary(s.primaryColor) }
    } catch{}
    api.get("/stores").then(r=>{ const s=Array.isArray(r.data)?r.data[0]:r.data; if(s){setStore(s);if(s.primaryColor)setPrimary(s.primaryColor)} }).catch(()=>{})
    load()
  }, [])

  async function load() {
    setLoading(true)
    try { const r = await api.get("/reports/dashboard"); setData(r.data) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }

  const storeName  = store?.name || "Minha Loja"
  const userName   = authUser?.name || "Voce"
  const firstName  = userName.split(" ")[0]
  const fat        = data?.monthSales    || 0
  const today      = data?.todaySales    || 0
  const lucro      = data?.profit        || 0
  const margem     = fat>0 ? Math.round((lucro/fat)*100) : 0
  const ticket     = data?.avgTicket     || 0
  const totalV     = data?.monthSalesCount || 0
  const meta       = store?.monthlyGoal  || data?.monthGoal || 0
  const metaPct    = meta>0 ? Math.min(Math.round((fat/meta)*100),100) : 0
  const chartData  = (data?.weeklyChart||[]).map((d:any)=>d.value)
  const chartLabels= (data?.weeklyChart||[]).map((d:any)=>d.day)
  const sellers: any[]      = data?.topSellers  || []
  const products: any[]     = data?.topProducts || []
  const recentSales: any[]  = data?.recentSales || []
  const lowStock: any[]     = data?.lowStock    || []

  return (
    <div style={{padding:28,maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        @font-face { font-family: "Geist Mono"; font-feature-settings: "zero" off; }
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px;}
        .dash-left{display:flex;flex-direction:column;gap:18px;}
        .dash-right{display:flex;flex-direction:column;gap:18px;}
        .dash-grid{display:grid;grid-template-columns:2fr 1fr;gap:18px;}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);}
        .card-head h3{margin:0;font-size:14px;font-weight:600;}
        .card-head .sub{font-size:12px;color:var(--text-subtle);margin-top:2px;}
        .tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;}
        .tbl th{text-align:left;font-weight:500;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-subtle);padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface-2);}
        .tbl td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle;}
        .tbl tr:last-child td{border-bottom:0;}
        .tbl tr:hover td{background:var(--surface-2);}
        .tbl .num{font-family:var(--font-mono);text-align:right;}
        .pill{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;background:var(--surface-3);color:var(--text-muted);}
        .pill-brand{background:var(--brand-tint);color:var(--brand-deep);}
        .list-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);}
        .list-item:last-child{border-bottom:0;}
        .list-meta{flex:1;min-width:0;}
        .list-meta strong{display:block;font-size:13px;font-weight:500;}
        .list-meta small{font-size:11px;color:var(--text-subtle);}
        .mini-bar{height:4px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:4px;}
        .mini-bar span{display:block;height:100%;background:var(--brand);border-radius:999px;}
        .av-sm{width:24px;height:24px;border-radius:50%;display:inline-grid;place-items:center;font-size:10px;font-weight:600;flex-shrink:0;}
        .av-md{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:600;flex-shrink:0;}
        .progress{height:8px;background:var(--surface-2);border-radius:999px;overflow:hidden;}
        .progress span{display:block;height:100%;border-radius:999px;}
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);} .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        @media(max-width:1100px){.dash-grid{grid-template-columns:1fr!important;}}
        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:540px){.kpi-grid{grid-template-columns:1fr 1fr;}}
        @media(max-width:640px){
          .tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .tbl{min-width:480px;}
          .tbl th,.tbl td{padding:8px 10px;}
          .dash-grid{grid-template-columns:1fr!important;}
          .bar-labels{font-size:8px!important;}
        }
      `}</style>

      {/* PAGE HEAD */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:22,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:28,fontWeight:600,letterSpacing:"-.025em"}}>
            Ola, {firstName}!
          </h1>
          <div style={{color:"var(--text-subtle)",fontSize:14,marginTop:4}}>
            Visao geral da {storeName} - {monthLabel} de {year}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button className="vp-btn vp-btn-secondary" style={{gap:6}}>
            <Icon name="calendar"/> Este mes
          </button>
          <Link href="/dashboard/sales">
            <button className="vp-btn vp-btn-primary">
              <Icon name="plus"/> Nova venda
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>Carregando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <KPI label="Faturamento hoje" icon={<Icon name="cash"/>}
              value={BRL(today)}
              delta={today>0?"Hoje":"Sem vendas hoje"}
              spark={<Spark data={chartData.slice(-7)} color={primary}/>} />
            <KPI label="Faturamento do mes" icon={<Icon name="chart"/>}
              value={BRL(fat)}
              delta={`${totalV} vendas`}
              spark={<Spark data={chartData} color={primary}/>} />
            <KPI label="Lucro estimado" icon={<Icon name="sparkle"/>}
              value={BRL(lucro)}
              delta={`${margem}% margem`} />
            <KPI label="Ticket medio" icon={<Icon name="receipt"/>}
              value={BRL(ticket)}
              delta="Por venda" />
          </div>

          {/* META */}
          {meta > 0 && (
            <div className="card" style={{padding:18,marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600}}>
                    <Icon name="target"/> Meta mensal
                  </div>
                  <div style={{fontSize:12,color:"var(--text-subtle)",marginTop:2}}>
                    {meta>fat?`Faltam ${BRL(meta-fat)} para a meta`:"Meta atingida! ðŸŽ‰"}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontWeight:600,fontFamily:"var(--font-mono)",letterSpacing:"-.02em"}}>
                    {BRL(fat)} <span style={{color:"var(--text-subtle)",fontSize:13}}>/ {BRL(Number(meta))}</span>
                  </div>
                  <div style={{fontSize:12,color:primary,fontWeight:500,marginTop:2}}>{metaPct}% atingido</div>
                </div>
              </div>
              <div className="progress"><span style={{width:`${metaPct}%`,background:primary}}/></div>
              <div style={{marginTop:8,display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-subtle)",fontFamily:"var(--font-mono)"}}>
                <span>R$ 0</span><span>{BRL(Number(meta)/2)}</span><span>{BRL(Number(meta))}</span>
              </div>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="dash-grid">
            {/* ESQUERDA */}
            <div className="dash-left">

              {/* GRÃFICO */}
              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Vendas por dia</h3>
                    <div className="sub">Ultimos {chartData.length} dias</div>
                  </div>
                </div>
                <div style={{padding:"22px 18px 8px"}}>
                  {chartData.length > 0 ? (
                    <BarChart data={chartData} labels={chartLabels} />
                  ) : (
                    <div style={{textAlign:"center",padding:32,color:"var(--text-subtle)",fontSize:13}}>
                      Sem dados de vendas no periodo.
                    </div>
                  )}
                </div>
              </div>

              {/* ÃšLTIMAS VENDAS */}
              {recentSales.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div>
                      <h3>Ultimas vendas</h3>
                      <div className="sub">{totalV} no periodo</div>
                    </div>
                    <Link href="/dashboard/sales">
                      <button className="vp-btn vp-btn-ghost vp-btn-sm">
                        Ver todas <Icon name="chevron"/>
                      </button>
                    </Link>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{width:80}}>ID</th>
                        <th>Cliente</th>
                        <th>Vendedor</th>
                        <th>Pagamento</th>
                        <th className="num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.slice(0,5).map((s:any)=>(
                        <tr key={s.id}>
                          <td style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-subtle)"}}>{s.id.slice(-8).toUpperCase()}</td>
                          <td style={{fontWeight:500}}>{s.customerName||"Avulso"}</td>
                          <td>
                            {s.sellerName ? (
                              <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                                <span className="av-sm" style={{background:primary,color:"white"}}>
                                  {s.sellerName.split(" ").map((x:string)=>x[0]).slice(0,2).join("")}
                                </span>
                                {s.sellerName}
                              </span>
                            ) : <span style={{color:"var(--text-subtle)"}}>â€”</span>}
                          </td>
                          <td><span className="pill">{PAY[s.paymentMethod]||s.paymentMethod}</span></td>
                          <td className="num" style={{fontWeight:600,color:primary}}>{BRL(s.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DIREITA */}
            <div className="dash-right">

              {/* RANKING */}
              <div className="card">
                <div className="card-head">
                  <h3>Ranking de vendedores</h3>
                  <span className="pill pill-brand">
                    <Icon name="flame"/> {monthLabel}
                  </span>
                </div>
                <div style={{padding:14}}>
                  {sellers.length===0 ? (
                    <div style={{color:"var(--text-subtle)",fontSize:13,padding:"8px 0"}}>Sem dados de vendas.</div>
                  ) : sellers.map((s:any,i:number)=>{
                    const maxRev = sellers[0]?.revenue||1
                    const colors = [primary,"#04342C","#94A3B8","#94A3B8","#94A3B8"]
                    const init = (s.sellerName||s.name||"?").split(" ").map((x:string)=>x[0]).slice(0,2).join("")
                    return (
                      <div key={i} className="list-item">
                        <div style={{width:18,color:"var(--text-subtle)",fontFamily:"var(--font-mono)",fontSize:11}}>#{i+1}</div>
                        <div className="av-md" style={{background:colors[i]||"#94A3B8",color:"white"}}>{init}</div>
                        <div className="list-meta">
                          <strong>{s.sellerName||s.name}</strong>
                          <small>{s.count} vendas</small>
                          <div className="mini-bar"><span style={{width:`${(s.revenue/maxRev)*100}%`}}/></div>
                        </div>
                        <div style={{fontFamily:"var(--font-mono)",fontWeight:600,fontSize:13}}>{BRLshort(s.revenue)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* TOP PRODUTOS */}
              <div className="card">
                <div className="card-head">
                  <h3>Top produtos</h3>
                  <Link href="/dashboard/inventory">
                    <button className="vp-btn vp-btn-ghost vp-btn-sm">
                      Estoque <Icon name="chevron"/>
                    </button>
                  </Link>
                </div>
                <div style={{padding:14}}>
                  {products.length===0 ? (
                    <div style={{color:"var(--text-subtle)",fontSize:13,padding:"8px 0"}}>Sem dados de produtos.</div>
                  ) : products.slice(0,5).map((p:any,i:number)=>(
                    <div key={i} className="list-item">
                      <div style={{width:32,height:32,borderRadius:8,background:"var(--surface-2)",display:"grid",placeItems:"center",flexShrink:0}}><Icon name="package"/></div>
                      <div className="list-meta">
                        <strong>{p.name}</strong>
                        <small>{p.quantity} un. vendidas</small>
                      </div>
                      <div style={{fontFamily:"var(--font-mono)",fontWeight:600,fontSize:13}}>{BRLshort(p.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ALERTA ESTOQUE BAIXO */}
              {lowStock.length > 0 && (
                <div className="card" style={{borderColor:"var(--warning)",background:"var(--warning-bg)",padding:16}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <Icon name="info"/>
                    <div>
                      <div style={{fontWeight:500,fontSize:13,color:"var(--warning)"}}>Atencao: estoque baixo</div>
                      <div style={{fontSize:12,marginTop:4,color:"var(--text)",lineHeight:1.5}}>
                        {lowStock.slice(0,3).map((p:any)=>p.name).join(", ")} {lowStock.length>1?"estao":"esta"} com estoque baixo.
                      </div>
                      <Link href="/dashboard/inventory">
                        <button className="vp-btn vp-btn-secondary vp-btn-sm" style={{marginTop:10}}>Ir ao estoque</button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

