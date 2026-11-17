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

function BarChart({ data, labels, color, mode }: { data:number[], labels:string[], color:string, mode?:string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const chartRef  = React.useRef<any>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let attempts = 0
    const tryInit = () => {
      if ((window as any).Chart) { setReady(true); return }
      attempts++
      if (attempts < 20) setTimeout(tryInit, 300)
    }
    tryInit()
  }, [])

  React.useEffect(() => {
    if (!ready || !canvasRef.current || !data.length) return
    const Chart = (window as any).Chart
    if (!Chart) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const max  = Math.max(...data, 1)
    const step = max<=100?10:max<=500?50:max<=2000?200:max<=5000?500:max<=10000?1000:2000

    const isLight = document.documentElement.getAttribute("data-theme") === "light"
    const glowBlur  = isLight ? 8 : 18
    const glowAlpha = isLight ? "44" : "88"

    const softColor = getComputedStyle(document.documentElement).getPropertyValue("--brand-soft").trim()
    const topColor = (softColor && softColor.startsWith("#")) ? softColor : color

    const haloPlugin = {
      id: "halo",
      afterDatasetsDraw(chart: any) {
        const { ctx } = chart
        chart.getDatasetMeta(0).data.forEach((bar: any) => {
          const { x, y, width, height } = bar.getProps(["x","y","width","height"])
          if (!height || height <= 0) return
          const w = width * 0.72
          const grad = ctx.createLinearGradient(x, y + height, x, y)
          grad.addColorStop(0,   color + "2E")
          grad.addColorStop(0.5, color + "99")
          grad.addColorStop(1,   topColor)
          ctx.save()
          // Halo externo: brand a 55% (35% em temas quentes)
          const isWarm = ["amber","rose","crimson","ouro"].includes(document.documentElement.getAttribute("data-palette")||"")
          const haloOpacity = isWarm ? "59" : "8C"   // 35% ou 55% em hex
          const haloBlur    = isWarm ? 10 : 18
          const haloSpread  = isWarm ? -4 : -2

          ctx.shadowColor  = color + haloOpacity
          ctx.shadowBlur   = haloBlur
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.roundRect(x - w/2, y, w, height, [6, 6, 2, 2])
          ctx.fill()

          // Contorno interno: brand-glow a 22% â€” "fio de luz" na borda
          ctx.save()
          ctx.strokeStyle = topColor + "38"
          ctx.lineWidth   = 1
          ctx.beginPath()
          ctx.roundRect(x - w/2 + 0.5, y + 0.5, w - 1, height - 0.5, [6, 6, 2, 2])
          ctx.stroke()
          ctx.restore()
        })
      }
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      plugins: [haloPlugin],
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: "transparent",
          borderColor: "transparent",
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.62,
          categoryPercentage: 0.70,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c:any) => mode==="count" ? `${c.parsed.y} vendas` : `R$ ${Number(c.parsed.y).toLocaleString("pt-BR",{minimumFractionDigits:2})}` } }
        },
        scales: {
          x: {
            ticks: {
              color: "#ffffff",
              font: { size: 9 },
              maxRotation: 45,
              minRotation: 45,
              autoSkip: false,
            },
            grid: { color: "rgba(255,255,255,0.04)" },
            border: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            min: 0,
            ticks: {
              color: "rgba(255,255,255,0.3)",
              font: { size: 9 },
              stepSize: step,
              callback: (v:any) => { const n=Number(v); if(mode==="count") return `${n}`; return n>=1000?`R$${(n/1000).toFixed(n%1000===0?0:1)}k`:`R$${n}` }
            },
            grid: { color: "rgba(255,255,255,0.06)" },
            border: { display: false }
          }
        }
      }
    })
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [ready, data, labels, color])

  if (!data.length) return (
    <div style={{padding:"40px 0",textAlign:"center",color:"var(--text-subtle)",fontSize:13}}>Sem vendas no período</div>
  )

  return (
    <div style={{position:"relative",width:"100%",height:260}}>
      <canvas ref={canvasRef} role="img" aria-label="Gráfico de vendas por dia"/>
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

  const loaded = React.useRef(false)
  useEffect(() => {
    // Carregar do cache primeiro para evitar flash vazio
    try {
      const cached = sessionStorage.getItem("vp-dashboard")
      if (cached) { setData(JSON.parse(cached)); setLoading(false) }
    } catch(e) {}

    if (loaded.current) return
    loaded.current = true
    api.get("/stores").then(r=>{ const s=Array.isArray(r.data)?r.data[0]:r.data; if(s) setStore(s) }).catch(()=>{})
    api.get("/reports/dashboard").then(r=>{
      if(r.data) {
        setData(r.data)
        try { sessionStorage.setItem("vp-dashboard", JSON.stringify(r.data)) } catch(e) {}
      }
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const WIDGETS: [string,string][] = [["kpis","Indicadores"],["meta","Meta do mês"],["chart","Gráfico de vendas"],["attention","Atenção"],["last","Últimas vendas"]]
  const [hidden, setHidden] = useState<Record<string,boolean>>({})
  const [custom, setCustom] = useState(false)
  useEffect(() => {
    try { const h = localStorage.getItem("vp-dash-hidden"); if (h) setHidden(JSON.parse(h)) } catch(e) {}
  }, [])
  function toggleWidget(k: string) {
    setHidden(prev => {
      const next = { ...prev, [k]: !prev[k] }
      try { localStorage.setItem("vp-dash-hidden", JSON.stringify(next)) } catch(e) {}
      return next
    })
  }
  const show = (k: string) => !hidden[k]

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
  const chartRaw   = (data?.weeklyChart||[])
  const chartFiltered = chartRaw.filter((d:any) => chartMode==="revenue" ? d.value > 0 : (d.count||0) > 0)
  const chartData  = chartFiltered.map((d:any) => chartMode==="revenue" ? d.value : d.count||0)
  const chartLabels= chartFiltered.map((d:any) => d.day)
  const sellers:any[]    = data?.topSellers  || []
  const products:any[]   = data?.topProducts || []
  const recentSales:any[]= data?.recentSales || []
  const lowStock:any[]   = data?.lowStock    || []
  const notifs = [
    ...lowStock.map((p:any)=>({ type:"warn", msg:`Estoque baixo: ${p.name}` })),
    ...(metaPct>=100?[{ type:"ok", msg:"🎉 Meta do mês atingida!" }]:[]),
    ...(today>0?[{ type:"info", msg:`+vendas hoje: ${BRL(today)}` }]:[]),
  ]

  const attention: {tone:string,title:string,text:string,href:string}[] = []
  if (lowStock.length>0) attention.push({ tone:"warn", title:"Estoque baixo", text:`${lowStock.length} produto${lowStock.length>1?"s":""} abaixo do mínimo: ${lowStock.slice(0,2).map((p:any)=>p.name).join(", ")}${lowStock.length>2?"…":""}`, href:"/dashboard/inventory" })
  if (meta>0) attention.push({ tone: metaPct>=100?"ok":"brand", title:"Meta do mês", text: metaPct>=100 ? "Meta atingida." : `${metaPct}% atingida. Faltam ${BRL(Math.max(meta-fat,0))}.`, href:"/dashboard/reports" })
  if (attention.length===0) attention.push({ tone:"ok", title:"Tudo em ordem", text:"Nenhum alerta no momento.", href:"/dashboard/reports" })

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:16}}>
      <div style={{width:40,height:40,border:"3px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{color:"var(--text-subtle)",fontSize:13}}>Carregando dashboard...</div>
    </div>
  )

  return (
    <div>
      <style>{`
        .d-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
        .d-kpi{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015)),var(--surface);border:1px solid rgba(255,255,255,.09);border-radius:var(--r-lg);padding:20px 22px;position:relative;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}
        .d-kpi::before{content:"";position:absolute;left:22px;top:0;width:34px;height:2px;background:var(--brand);box-shadow:0 0 12px var(--brand);}
        .d-kpi-label{font-family:var(--font-mono);font-size:11px;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;}
        .d-kpi-val{font-family:var(--font-mono);font-size:clamp(20px,2.4vw,30px);font-weight:600;color:var(--text);letter-spacing:-.03em;line-height:1;}
        .d-kpi-delta{font-size:12px;color:var(--text-muted);margin-top:8px;}
        .d-kpi-delta.ok{color:var(--success);}
        .d-grid{display:grid;grid-template-columns:1.7fr 1fr;gap:16px;margin-bottom:16px;}
        .d-card{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015)),var(--surface);border:1px solid rgba(255,255,255,.09);border-radius:var(--r-lg);overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}
        .d-card-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
        .d-card-title{font-size:15px;font-weight:600;color:var(--text);}
        .d-card-sub{font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;color:var(--text-subtle);margin-top:3px;text-transform:uppercase;}
        .d-card-body{padding:20px;}
        .d-meta{padding:18px 22px;margin-bottom:16px;}
        .d-att{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:12px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.07);text-decoration:none;color:inherit;margin-bottom:10px;transition:var(--transition);}
        .d-att:hover{border-color:var(--border-strong);}
        .d-att:last-child{margin-bottom:0;}
        .d-att-dot{width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0;}
        .d-sale-row{display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--border);transition:var(--transition);}
        .d-sale-row:last-child{border:0;}
        .d-sale-row:hover{background:var(--surface-2);}
        .d-sale-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#05070A;background:var(--brand);flex-shrink:0;}
        .d-sale-info{flex:1;min-width:0;}
        .d-sale-name{font-size:13px;font-weight:600;color:var(--text);}
        .d-sale-meta{display:flex;gap:5px;margin-top:3px;flex-wrap:wrap;}
        .d-sale-val{font-family:var(--font-mono);font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;}
        .d-custom{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:16px 20px;border-radius:var(--r-lg);margin-bottom:20px;background:var(--surface);border:1px solid color-mix(in srgb,var(--brand) 45%,transparent);box-shadow:0 0 30px color-mix(in srgb,var(--brand) 12%,transparent);}
        .d-chip{height:34px;padding:0 14px;border-radius:17px;border:1px solid var(--border-strong);background:transparent;color:var(--text-muted);font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:var(--transition);}
        .d-chip.on{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--text);}
        @media(max-width:1200px){.d-grid{grid-template-columns:1fr;} .d-kpi-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:640px){.d-kpi-grid{grid-template-columns:1fr 1fr;} .d-card-body{padding:14px;}}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:22,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(24px,3vw,30px)",fontWeight:700,letterSpacing:"-.03em",color:"var(--text)"}}>Resumo</h1>
          <div style={{color:"var(--text-muted)",fontSize:12,marginTop:6,fontFamily:"var(--font-mono)",textTransform:"uppercase",letterSpacing:".06em"}}>
            {storeName} · {monthLabel} de {year}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="vp-btn vp-btn-secondary" onClick={()=>setCustom(c=>!c)} aria-pressed={custom}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/></svg>
            Personalizar
          </button>
          <Link href="/dashboard/reports">
            <button className="vp-btn vp-btn-secondary">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>
              Exportar
            </button>
          </Link>
          <Link href="/dashboard/sales">
            <button className="vp-btn vp-btn-primary">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Nova venda
            </button>
          </Link>
        </div>
      </div>

      {/* PERSONALIZAR */}
      {custom && (
        <div className="d-custom">
          <span style={{fontSize:13,fontWeight:600,marginRight:4}}>Mostrar no resumo:</span>
          {WIDGETS.map(([k,label])=>(
            <button key={k} className={`d-chip${show(k)?" on":""}`} aria-pressed={show(k)} onClick={()=>toggleWidget(k)}>{show(k)?"✓":"+"} {label}</button>
          ))}
          <span style={{fontSize:12,color:"var(--text-subtle)",marginLeft:"auto"}}>Ranking, produtos e pagamentos estão em Relatórios</span>
        </div>
      )}

      {/* KPIs */}
      {show("kpis") && (
        <div className="d-kpi-grid">
          <div className="d-kpi">
            <div className="d-kpi-label">Faturamento hoje</div>
            <div className="d-kpi-val">{BRL(today)}</div>
            <div className={`d-kpi-delta${today>0?" ok":""}`}>{today>0?"Com vendas hoje":"Sem vendas hoje"}</div>
          </div>
          <div className="d-kpi">
            <div className="d-kpi-label">Faturamento do mês</div>
            <div className="d-kpi-val">{BRL(fat)}</div>
            <div className="d-kpi-delta ok">{totalV} venda{totalV===1?"":"s"}</div>
          </div>
          <div className="d-kpi">
            <div className="d-kpi-label">Lucro estimado</div>
            <div className="d-kpi-val">{BRL(lucro)}</div>
            <div className="d-kpi-delta">{margem}% de margem</div>
          </div>
          <div className="d-kpi">
            <div className="d-kpi-label">Ticket médio</div>
            <div className="d-kpi-val">{BRL(ticket)}</div>
            <div className="d-kpi-delta">Por venda</div>
          </div>
        </div>
      )}

      {/* META */}
      {show("meta") && meta>0 && (
        <div className="d-card d-meta">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:15,fontWeight:600,color:"var(--text)"}}>Meta do mês</div>
            <div style={{fontFamily:"var(--font-mono)",fontSize:13,color:"var(--text-muted)"}}>
              <span style={{color:"var(--text)",fontWeight:600}}>{BRL(fat)}</span> / {BRL(Number(meta))} · <span style={{color:"var(--brand)",fontWeight:600}}>{metaPct}%</span>
            </div>
          </div>
          <div className="vp-progress"><div className="vp-progress-fill" style={{width:`${metaPct}%`}}/></div>
        </div>
      )}

      {/* GRÁFICO + ATENÇÃO */}
      {(show("chart")||show("attention")) && (
        <div className="d-grid" style={{gridTemplateColumns: show("chart")&&show("attention") ? undefined : "1fr"}}>
          {show("chart") && (
            <div className="d-card">
              <div className="d-card-head">
                <div>
                  <div className="d-card-title">Vendas por dia</div>
                  <div className="d-card-sub">{monthLabel} {year} · somente dias com venda</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button className={`vp-btn vp-btn-sm${chartMode==="revenue"?" vp-btn-secondary":" vp-btn-ghost"}`} style={{fontSize:11}} onClick={()=>setChartMode("revenue")}>Receita</button>
                  <button className={`vp-btn vp-btn-sm${chartMode==="count"?" vp-btn-secondary":" vp-btn-ghost"}`} style={{fontSize:11}} onClick={()=>setChartMode("count")}>Quantidade</button>
                </div>
              </div>
              <div className="d-card-body">
                <BarChart data={chartData} labels={chartLabels} color={(() => { try { return getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#2DBE60" } catch { return "#2DBE60" } })()} mode={chartMode}/>
              </div>
            </div>
          )}
          {show("attention") && (
            <div className="d-card">
              <div className="d-card-head"><div className="d-card-title">Precisa de atenção</div></div>
              <div className="d-card-body">
                {attention.map((a,i)=>(
                  <Link key={i} href={a.href} className="d-att">
                    <span className="d-att-dot" style={{background: a.tone==="warn"?"var(--warning)":a.tone==="ok"?"var(--success)":"var(--brand)", boxShadow:`0 0 10px ${a.tone==="warn"?"var(--warning)":a.tone==="ok"?"var(--success)":"var(--brand)"}`}}/>
                    <span style={{minWidth:0}}>
                      <span style={{display:"block",fontSize:14,fontWeight:600,color:"var(--text)"}}>{a.title}</span>
                      <span style={{display:"block",fontSize:12,lineHeight:1.5,color:"var(--text-muted)",marginTop:2}}>{a.text}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ÚLTIMAS VENDAS */}
      {show("last") && recentSales.length>0 && (
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
              <div className="d-sale-av">{(s.customerName||"AV").slice(0,2).toUpperCase()}</div>
              <div className="d-sale-info">
                <div className="d-sale-name">{s.customerName||"Cliente avulso"}</div>
                <div className="d-sale-meta">
                  {s.sellerName&&<span className="vp-pill vp-pill-grey">{s.sellerName.split(" ")[0]}</span>}
                  <span className="vp-pill vp-pill-grey">{PAY[s.paymentMethod]||s.paymentMethod}</span>
                </div>
              </div>
              <div className="d-sale-val">{BRL(s.total)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
