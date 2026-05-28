"use client"
import React from "react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import { useAuthStore } from "@/contexts/auth.store"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }
const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const PAY: Record<string,string> = { cash:"Dinheiro", pix:"PIX", credit_card:"Crédito", debit_card:"Débito" }

function BarChart({ data, labels, color }: { data:number[], labels:string[], color:string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const chartRef  = React.useRef<any>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return

    const Chart = (window as any).Chart
    if (!Chart) {
      const timer = setTimeout(() => {
        if ((window as any).Chart) {
          canvas.dispatchEvent(new Event("rebuild"))
        }
      }, 500)
      return () => clearTimeout(timer)
    }

    if (chartRef.current) chartRef.current.destroy()

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: data.map(v => v > 0 ? color : "rgba(255,255,255,0.06)"),
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 4 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `R$ ${Number(ctx.parsed.y).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "rgba(255,255,255,0.4)",
              font: { size: 8 },
              maxRotation: 45,
              minRotation: 45,
              autoSkip: false,
              callback: function(this: any, _: any, i: number) {
                return data[i] > 0 ? labels[i] : ""
              }
            },
            grid: { color: "rgba(255,255,255,0.04)" },
            border: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            ticks: {
              color: "rgba(255,255,255,0.3)",
              font: { size: 9 },
              callback: (v: any) => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : `R$${v}`
            },
            grid: { color: "rgba(255,255,255,0.06)" },
            border: { display: false }
          }
        }
      }
    })

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [data, labels, color])

  if (!data.length) return (
    <div style={{padding:"40px 0",textAlign:"center",color:"var(--text-subtle)",fontSize:13}}>
      Sem dados no período
    </div>
  )

  return (
    <div style={{position:"relative",width:"100%",height:"clamp(160px, 25vw, 220px)"}}>
      <canvas ref={canvasRef} role="img" aria-label="Gráfico de vendas por dia" style={{display:"block",width:"100%",height:"100%"}}/>
    </div>
  )
}


export default function DashboardPage() {
  const { user: authUser } = useAuthStore()
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [store,   setStore]   = useState<any>(null)
  const [color,   setColor]   = useState("var(--brand)")
  const [chartMode, setChartMode] = useState<"revenue"|"count">("revenue")

  const now        = new Date()
  const monthLabel = MONTHS[now.getMonth()]
  const year       = now.getFullYear()

  useEffect(() => {
    api.get("/stores").then(r=>{ const s=Array.isArray(r.data)?r.data[0]:r.data; if(s) setStore(s) }).catch(()=>{})
    api.get("/reports/dashboard").then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const storeName  = store?.name || "Minha Loja"
  const firstName  = (authUser?.name||"Você").split(" ")[0]
  const fat        = data?.monthSales     || 0
  const today      = data?.todaySales     || 0
  const lucro      = data?.profit         || 0
  const margem     = fat>0 ? Math.round((lucro/fat)*100) : 0
  const ticket     = data?.avgTicket      || 0
  const totalV     = data?.monthSalesCount|| 0
  const meta       = store?.monthlyGoal   || data?.monthGoal || 0
  const metaPct    = meta>0 ? Math.min(Math.round((fat/meta)*100),100) : 0
  const chartData  = (data?.weeklyChart||[]).map((d:any)=> chartMode==="revenue" ? d.value : d.count||0)
  const chartLabels= (data?.weeklyChart||[]).map((d:any)=>d.day+"/"+year)
  const sellers:any[]    = data?.topSellers  || []
  const products:any[]   = data?.topProducts || []
  const recentSales:any[]= data?.recentSales || []
  const lowStock:any[]   = data?.lowStock    || []
  const notifs = [
    ...lowStock.map((p:any)=>({ type:"warn", msg:`Estoque baixo: ${p.name}` })),
    ...(metaPct>=100?[{ type:"ok", msg:"🎉 Meta do mês atingida!" }]:[]),
    ...(today>0?[{ type:"info", msg:`+vendas hoje: ${BRLshort(today)}` }]:[]),
  ]

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:16}}>
      <div style={{width:40,height:40,border:"3px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{color:"var(--text-subtle)",fontSize:13}}>Carregando dashboard...</div>
    </div>
  )

  return (
    <div>
      <style>{`
        .d-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .d-kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px 22px;position:relative;overflow:hidden;transition:var(--transition);}
        .d-kpi:hover{border-color:var(--border-strong);transform:translateY(-2px);box-shadow:var(--shadow-md);}
        .d-kpi-label{font-size:11px;font-weight:600;color:var(--text-subtle);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
        .d-kpi-val{font-family:var(--font-mono);font-size:clamp(20px,2.5vw,32px);font-weight:700;color:var(--text);letter-spacing:-.03em;line-height:1;}
        .d-kpi-delta{font-size:12px;color:var(--text-subtle);margin-top:8px;}
        .d-kpi-delta.ok{color:var(--success);}
        .d-kpi-glow{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:var(--brand-glow);filter:blur(20px);pointer-events:none;}
        .d-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:16px;}
        .d-left{display:flex;flex-direction:column;gap:16px;}
        .d-right{display:flex;flex-direction:column;gap:16px;}
        .d-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;}
        .d-card-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .d-card-title{font-size:14px;font-weight:600;color:var(--text);}
        .d-card-sub{font-size:12px;color:var(--text-subtle);margin-top:2px;}
        .d-card-body{padding:20px;}
        .d-seller-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
        .d-seller-row:last-child{border:0;}
        .d-seller-rank{width:20px;font-size:11px;font-weight:700;color:var(--text-subtle);flex-shrink:0;}
        .d-seller-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;}
        .d-seller-info{flex:1;min-width:0;}
        .d-seller-name{font-size:13px;font-weight:600;color:var(--text);}
        .d-seller-count{font-size:11px;color:var(--text-subtle);}
        .d-seller-bar{height:3px;background:var(--surface-3);border-radius:99px;margin-top:4px;overflow:hidden;}
        .d-seller-bar span{display:block;height:100%;border-radius:99px;background:var(--brand);}
        .d-seller-rev{font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;}
        .d-sale-row{display:flex;align-items:center;gap:12px;padding:11px 20px;border-bottom:1px solid var(--border);transition:var(--transition);}
        .d-sale-row:last-child{border:0;}
        .d-sale-row:hover{background:var(--surface-2);}
        .d-sale-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;}
        .d-sale-info{flex:1;min-width:0;}
        .d-sale-name{font-size:13px;font-weight:600;color:var(--text);}
        .d-sale-meta{display:flex;gap:5px;margin-top:3px;flex-wrap:wrap;}
        .d-sale-val{font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--brand);white-space:nowrap;}
        .d-product-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
        .d-product-row:last-child{border:0;}
        .d-product-icon{width:36px;height:36px;border-radius:var(--r);background:var(--surface-2);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid var(--border);}
        .d-product-info{flex:1;min-width:0;}
        .d-product-name{font-size:13px;font-weight:600;color:var(--text);}
        .d-product-qty{font-size:11px;color:var(--text-subtle);}
        .d-product-rev{font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;}
        .d-meta-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;margin-bottom:16px;}
        @media(max-width:1200px){.d-grid{grid-template-columns:1fr;} .d-kpi-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:640px){.d-kpi-grid{grid-template-columns:1fr 1fr;} .d-card-body{padding:14px;}}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(22px,3vw,30px)",fontWeight:700,letterSpacing:"-.03em",color:"var(--text)"}}>
            Olá, {firstName} 👋
          </h1>
          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:4}}>
            Visão geral da {storeName} — {monthLabel} de {year}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="vp-btn vp-btn-secondary">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Este mês
          </button>
          <Link href="/dashboard/sales">
            <button className="vp-btn vp-btn-primary">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Nova venda
            </button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="d-kpi-grid">
        <div className="d-kpi">
          <div className="d-kpi-label">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 3v18h18M7 12h3v6H7zM12 8h3v10h-3zM17 5h3v13h-3z"/></svg>
            Faturamento hoje
          </div>
          <div className="d-kpi-val">{BRLshort(today)}</div>
          <div className={`d-kpi-delta${today>0?" ok":""}`}>{today>0?"+vendas hoje":"Sem vendas hoje"}</div>
          <div className="d-kpi-glow"/>
        </div>
        <div className="d-kpi">
          <div className="d-kpi-label">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Faturamento do mês
          </div>
          <div className="d-kpi-val">{BRLshort(fat)}</div>
          <div className="d-kpi-delta ok">+{totalV} vendas</div>
          <div className="d-kpi-glow"/>
        </div>
        <div className="d-kpi">
          <div className="d-kpi-label">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4l3 3"/></svg>
            Lucro estimado
          </div>
          <div className="d-kpi-val">{BRLshort(lucro)}</div>
          <div className="d-kpi-delta ok">{margem}% margem</div>
          <div className="d-kpi-glow"/>
        </div>
        <div className="d-kpi">
          <div className="d-kpi-label">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18v12H3zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 0 0-5 0"/></svg>
            Ticket médio
          </div>
          <div className="d-kpi-val">{BRLshort(ticket)}</div>
          <div className="d-kpi-delta">Por venda</div>
          <div className="d-kpi-glow"/>
        </div>
      </div>

      {/* META */}
      {meta>0 && (
        <div className="d-meta-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:"var(--text)"}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                Meta mensal
              </div>
              <div style={{fontSize:12,color:"var(--text-subtle)",marginTop:3}}>
                {meta>fat?`Faltam ${BRLshort(meta-fat)} para a meta`:"🎉 Meta atingida!"}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"var(--font-mono)",fontSize:"clamp(14px,2vw,20px)",fontWeight:700,color:"var(--text)"}}>
                {BRLshort(fat)}<span style={{color:"var(--text-subtle)",fontSize:12,fontWeight:400}}> / {BRLshort(Number(meta))}</span>
              </div>
              <div style={{fontSize:12,color:"var(--brand)",fontWeight:600,marginTop:2}}>{metaPct}% atingido</div>
            </div>
          </div>
          <div className="vp-progress"><div className="vp-progress-fill" style={{width:`${metaPct}%`}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--text-subtle)",marginTop:6}}>
            <span>R$ 0</span><span>{BRLshort(Number(meta)/2)}</span><span>{BRLshort(Number(meta))}</span>
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="d-grid">
        <div className="d-left">

          {/* GRÁFICO */}
          <div className="d-card">
            <div className="d-card-head">
              <div>
                <div className="d-card-title">Vendas por dia</div>
                <div className="d-card-sub">{monthLabel} {year}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button className={`vp-btn vp-btn-sm${chartMode==="revenue"?" vp-btn-secondary":" vp-btn-ghost"}`} style={{fontSize:11}} onClick={()=>setChartMode("revenue")}>Receita</button>
                <button className={`vp-btn vp-btn-sm${chartMode==="count"?" vp-btn-secondary":" vp-btn-ghost"}`} style={{fontSize:11}} onClick={()=>setChartMode("count")}>Quantidade</button>
              </div>
            </div>
            <div className="d-card-body">
              <BarChart data={chartData} labels={chartLabels} color={getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#0EA5E9"}/>
            </div>
          </div>

          {/* ÚLTIMAS VENDAS */}
          {recentSales.length>0 && (
            <div className="d-card">
              <div className="d-card-head">
                <div>
                  <div className="d-card-title">Últimas vendas</div>
                  <div className="d-card-sub">{totalV} no período</div>
                </div>
                <Link href="/dashboard/sales">
                  <button className="vp-btn vp-btn-ghost vp-btn-sm">
                    Ver todas
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </Link>
              </div>
              {recentSales.slice(0,5).map((s:any)=>(
                <div key={s.id} className="d-sale-row">
                  <div className="d-sale-av" style={{background:"var(--brand)"}}>
                    {(s.customerName||"AV").slice(0,2).toUpperCase()}
                  </div>
                  <div className="d-sale-info">
                    <div className="d-sale-name">{s.customerName||"Cliente avulso"}</div>
                    <div className="d-sale-meta">
                      {s.sellerName&&<span className="vp-pill vp-pill-grey">{s.sellerName.split(" ")[0]}</span>}
                      <span className="vp-pill vp-pill-grey">{PAY[s.paymentMethod]||s.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="d-sale-val">{BRLshort(s.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="d-right">

          {/* RANKING VENDEDORES */}
          <div className="d-card">
            <div className="d-card-head">
              <div className="d-card-title">Ranking vendedores</div>
              <span className="vp-pill vp-pill-brand">{monthLabel}</span>
            </div>
            <div className="d-card-body">
              {sellers.length===0 ? (
                <div style={{color:"var(--text-subtle)",fontSize:13,textAlign:"center",padding:"20px 0"}}>Sem dados ainda.</div>
              ) : sellers.map((s:any,i:number)=>{
                const maxRev = sellers[0]?.revenue||1
                const init = (s.sellerName||s.name||"?").split(" ").map((x:string)=>x[0]).slice(0,2).join("")
                const bgs = ["var(--brand)","var(--brand-mid)","var(--surface-3)","var(--surface-3)","var(--surface-3)"]
                return (
                  <div key={i} className="d-seller-row">
                    <div className="d-seller-rank">#{i+1}</div>
                    <div className="d-seller-av" style={{background:bgs[i]||"var(--surface-3)"}}>{init}</div>
                    <div className="d-seller-info">
                      <div className="d-seller-name">{s.sellerName||s.name}</div>
                      <div className="d-seller-count">{s.count} vendas</div>
                      <div className="d-seller-bar"><span style={{width:`${(s.revenue/maxRev)*100}%`}}/></div>
                    </div>
                    <div className="d-seller-rev">{BRLshort(s.revenue)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TOP PRODUTOS */}
          <div className="d-card">
            <div className="d-card-head">
              <div className="d-card-title">Top produtos</div>
              <Link href="/dashboard/inventory">
                <button className="vp-btn vp-btn-ghost vp-btn-sm">
                  Estoque
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </Link>
            </div>
            <div className="d-card-body">
              {products.length===0 ? (
                <div style={{color:"var(--text-subtle)",fontSize:13,textAlign:"center",padding:"20px 0"}}>Sem dados ainda.</div>
              ) : products.slice(0,5).map((p:any,i:number)=>(
                <div key={i} className="d-product-row">
                  <div className="d-product-icon">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth={1.6}><path d="M21 8v13H3V8M12 3v18M3 8l9-5 9 5"/></svg>
                  </div>
                  <div className="d-product-info">
                    <div className="d-product-name">{p.name}</div>
                    <div className="d-product-qty">{p.quantity} un. vendidas</div>
                  </div>
                  <div className="d-product-rev">{BRLshort(p.revenue)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ESTOQUE BAIXO */}
          {lowStock.length>0 && (
            <div className="d-card" style={{borderColor:"rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.05)"}}>
              <div className="d-card-head" style={{borderColor:"rgba(245,158,11,0.2)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
                  <div className="d-card-title" style={{color:"var(--warning)"}}>Estoque baixo</div>
                </div>
              </div>
              <div className="d-card-body">
                <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.6,marginBottom:12}}>
                  {lowStock.slice(0,3).map((p:any)=>p.name).join(", ")} precisam de reposição.
                </div>
                <Link href="/dashboard/inventory">
                  <button className="vp-btn vp-btn-secondary vp-btn-sm">Ver estoque</button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
