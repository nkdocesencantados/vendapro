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

function KPI({ label, value, delta, spark }: any) {
  return (
    <div style={{padding:12,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,position:"relative",overflow:"hidden"}}>
      <div style={{fontSize:11,color:"var(--text-subtle)",fontWeight:500,marginBottom:6}}>{label}</div>
      <div style={{fontSize:"clamp(14px,3.5vw,20px)",fontWeight:600,letterSpacing:"-.02em",color:"var(--text)"}}>{value}</div>
      {delta && <div style={{fontSize:11,color:"var(--success,#1D9E75)",marginTop:3}}>{delta}</div>}
      {spark}
    </div>
  )
}

function BarChart({ data, labels }: { data:number[], labels:string[] }) {
  if(!data.length) return null
  const max = Math.max(...data,1)
  const firstLabel = labels[0]||""
  const midLabel = labels[Math.floor(labels.length/2)]||""
  const lastLabel = labels[labels.length-1]||""
  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
        {data.map((v,i)=>(
          <div key={i} style={{flex:1,background:v===Math.max(...data)?"var(--brand,#1D9E75)":"rgba(29,158,117,0.25)",borderRadius:"3px 3px 0 0",height:`${Math.max((v/max)*100,3)}%`,minHeight:3}}/>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"var(--text-subtle)",marginTop:4}}>
        <span>{firstLabel}</span><span>{midLabel}</span><span>{lastLabel}</span>
      </div>
    </div>
  )
}

const ICON_PATHS: Record<string,string> = {
  calendar: "M3 4h18v18H3V4zM16 2v4M8 2v4M3 10h18",
  plus: "M12 5v14M5 12h14",
  cash: "M3 6h18v12H3zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 0 0-5 0",
  chart: "M3 3v18h18M7 12h3v6H7zM12 8h3v10h-3zM17 5h3v13h-3z",
  sparkle: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z",
  receipt: "M6 2v20l3-2 3 2 3-2 3 2V2z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  chevron: "M9 18l6-6-6-6",
  flame: "M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
  package: "M21 8v13H3V8M12 3v18M3 8l9-5 9 5",
}
function Icon({ name, size=14 }: { name:string; size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <path d={ICON_PATHS[name]||""} />
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
    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
        .dash-grid{display:grid;grid-template-columns:2fr 1fr;gap:18px;}
        .dash-left{display:flex;flex-direction:column;gap:16px;}
        .dash-right{display:flex;flex-direction:column;gap:16px;}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;}
        .card-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border);}
        .card-head h3{margin:0;font-size:13px;font-weight:600;}
        .card-head .sub{font-size:11px;color:var(--text-subtle);margin-top:2px;}
        .pill{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:999px;font-size:11px;font-weight:500;background:var(--surface-3);color:var(--text-muted);}
        .pill-brand{background:var(--brand-tint);color:var(--brand-deep);}
        .list-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);}
        .list-item:last-child{border-bottom:0;}
        .list-meta{flex:1;min-width:0;}
        .list-meta strong{display:block;font-size:13px;font-weight:500;}
        .list-meta small{font-size:11px;color:var(--text-subtle);}
        .mini-bar{height:4px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:4px;}
        .mini-bar span{display:block;height:100%;background:var(--brand,#1D9E75);border-radius:999px;}
        .av-sm{width:24px;height:24px;border-radius:50%;display:inline-grid;place-items:center;font-size:10px;font-weight:600;flex-shrink:0;}
        .av-md{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:600;flex-shrink:0;}
        .progress{height:6px;background:var(--surface-2);border-radius:999px;overflow:hidden;}
        .progress span{display:block;height:100%;border-radius:999px;}
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand,#1D9E75);color:white;}
        .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);}
        .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-ghost{color:var(--text-muted);}
        .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .sale-row-m{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);}
        .sale-row-m:last-child{border-bottom:0;}
        .sale-info-m{flex:1;min-width:0;}
        .sale-name-m{font-size:13px;font-weight:500;color:var(--text);}
        .sale-meta-m{display:flex;gap:5px;margin-top:3px;flex-wrap:wrap;}

        @media(max-width:1100px){.dash-grid{grid-template-columns:1fr!important;}}
        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:640px){
          .kpi-grid{grid-template-columns:1fr 1fr!important;}
          .dash-grid{grid-template-columns:1fr!important;}
          .page-head-actions{flex-direction:column;align-items:stretch!important;}
          .page-head-actions .vp-btn{justify-content:center;}
          .card-head h3{font-size:12px;}
          .hide-mobile{display:none!important;}
        }
      `}</style>

      {/* PAGE HEAD */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(20px,5vw,28px)",fontWeight:600,letterSpacing:"-.025em"}}>
            Ola, {firstName}!
          </h1>
          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>
            {storeName} - {monthLabel} de {year}
          </div>
        </div>
        <div className="page-head-actions" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button className="vp-btn vp-btn-secondary">
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
            <KPI label="Fat. hoje" value={BRLshort(today)} delta={today>0?"Hoje":"Sem vendas"} spark={<Spark data={chartData.slice(-7)} color={primary}/>}/>
            <KPI label="Fat. do mes" value={BRLshort(fat)} delta={`${totalV} vendas`} spark={<Spark data={chartData} color={primary}/>}/>
            <KPI label="Lucro est." value={BRLshort(lucro)} delta={`${margem}% margem`}/>
            <KPI label="Ticket medio" value={BRLshort(ticket)} delta="Por venda"/>
          </div>

          {/* META */}
          {meta > 0 && (
            <div className="card" style={{padding:14,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8,flexWrap:"wrap"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600}}>
                    <Icon name="target"/> Meta mensal
                  </div>
                  <div style={{fontSize:11,color:"var(--text-subtle)",marginTop:2}}>
                    {meta>fat?`Faltam ${BRLshort(meta-fat)} para a meta`:"Meta atingida!"}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"clamp(13px,3.5vw,18px)",fontWeight:600,letterSpacing:"-.02em"}}>
                    {BRLshort(fat)} <span style={{color:"var(--text-subtle)",fontSize:11}}>/ {BRLshort(Number(meta))}</span>
                  </div>
                  <div style={{fontSize:11,color:primary,fontWeight:500,marginTop:2}}>{metaPct}% atingido</div>
                </div>
              </div>
              <div className="progress"><span style={{width:`${metaPct}%`,background:primary}}/></div>
              <div style={{marginTop:6,display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--text-subtle)"}}>
                <span>R$ 0</span><span>{BRLshort(Number(meta)/2)}</span><span>{BRLshort(Number(meta))}</span>
              </div>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="dash-grid">
            <div className="dash-left">

              {/* GRAFICO */}
              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Vendas por dia</h3>
                    <div className="sub">Ultimos {chartData.length} dias</div>
                  </div>
                </div>
                <div style={{padding:"16px 14px 10px"}}>
                  {chartData.length > 0 ? (
                    <BarChart data={chartData} labels={chartLabels}/>
                  ) : (
                    <div style={{textAlign:"center",padding:24,color:"var(--text-subtle)",fontSize:13}}>
                      Sem dados no periodo.
                    </div>
                  )}
                </div>
              </div>

              {/* ULTIMAS VENDAS - cards no mobile, tabela no desktop */}
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
                  <div>
                    {recentSales.slice(0,5).map((s:any)=>(
                      <div key={s.id} className="sale-row-m">
                        <div className="av-sm" style={{background:primary,color:"white"}}>
                          {(s.customerName||"AV").slice(0,2).toUpperCase()}
                        </div>
                        <div className="sale-info-m">
                          <div className="sale-name-m">{s.customerName||"Avulso"}</div>
                          <div className="sale-meta-m">
                            {s.sellerName && <span className="pill">{s.sellerName.split(" ")[0]}</span>}
                            <span className="pill">{PAY[s.paymentMethod]||s.paymentMethod}</span>
                          </div>
                        </div>
                        <div style={{fontWeight:600,fontSize:13,color:primary,whiteSpace:"nowrap"}}>{BRLshort(s.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="dash-right">

              {/* RANKING */}
              <div className="card">
                <div className="card-head">
                  <h3>Ranking vendedores</h3>
                  <span className="pill pill-brand"><Icon name="flame" size={11}/> {monthLabel}</span>
                </div>
                <div style={{padding:12}}>
                  {sellers.length===0 ? (
                    <div style={{color:"var(--text-subtle)",fontSize:13,padding:"8px 0"}}>Sem dados.</div>
                  ) : sellers.map((s:any,i:number)=>{
                    const maxRev = sellers[0]?.revenue||1
                    const colors = [primary,"#04342C","#94A3B8","#94A3B8","#94A3B8"]
                    const init = (s.sellerName||s.name||"?").split(" ").map((x:string)=>x[0]).slice(0,2).join("")
                    return (
                      <div key={i} className="list-item">
                        <div style={{width:16,color:"var(--text-subtle)",fontSize:10}}>#{i+1}</div>
                        <div className="av-md" style={{background:colors[i]||"#94A3B8",color:"white"}}>{init}</div>
                        <div className="list-meta">
                          <strong>{s.sellerName||s.name}</strong>
                          <small>{s.count} vendas</small>
                          <div className="mini-bar"><span style={{width:`${(s.revenue/maxRev)*100}%`}}/></div>
                        </div>
                        <div style={{fontWeight:600,fontSize:12}}>{BRLshort(s.revenue)}</div>
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
                <div style={{padding:12}}>
                  {products.length===0 ? (
                    <div style={{color:"var(--text-subtle)",fontSize:13,padding:"8px 0"}}>Sem dados.</div>
                  ) : products.slice(0,5).map((p:any,i:number)=>(
                    <div key={i} className="list-item">
                      <div style={{width:28,height:28,borderRadius:7,background:"var(--surface-2)",display:"grid",placeItems:"center",flexShrink:0}}><Icon name="package" size={13}/></div>
                      <div className="list-meta">
                        <strong>{p.name}</strong>
                        <small>{p.quantity} un. vendidas</small>
                      </div>
                      <div style={{fontWeight:600,fontSize:12}}>{BRLshort(p.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ALERTA ESTOQUE BAIXO */}
              {lowStock.length > 0 && (
                <div className="card" style={{borderColor:"var(--warning)",background:"var(--warning-bg)",padding:14}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                    <Icon name="info" size={14}/>
                    <div>
                      <div style={{fontWeight:500,fontSize:13,color:"var(--warning)"}}>Estoque baixo</div>
                      <div style={{fontSize:12,marginTop:4,color:"var(--text)",lineHeight:1.5}}>
                        {lowStock.slice(0,3).map((p:any)=>p.name).join(", ")} com estoque baixo.
                      </div>
                      <Link href="/dashboard/inventory">
                        <button className="vp-btn vp-btn-secondary vp-btn-sm" style={{marginTop:10}}>Ver estoque</button>
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
