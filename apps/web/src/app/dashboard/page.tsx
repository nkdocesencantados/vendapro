"use client"
import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"
import { useAuthStore } from "@/contexts/auth.store"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [primary, setPrimary] = useState("#1D9E75")
  const [monthlyGoal, setMonthlyGoal] = useState(20000)
  const now = new Date()
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0])
  const [to, setTo] = useState(now.toISOString().split("T")[0])
  const [preset, setPreset] = useState("month")

  useEffect(() => {
    try {
      const c = localStorage.getItem("storeConfig")
      if (c) { const p = JSON.parse(c); if (p.primaryColor) setPrimary(p.primaryColor); if (p.monthlyGoal) setMonthlyGoal(Number(p.monthlyGoal)) }
    } catch {}
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/reports/advanced?from=${from}&to=${to}`)
      setData(r.data)
    } catch {
      setData({ totalRevenue:0, totalSales:0, estimatedProfit:0, avgTicket:0, topProducts:[], dailyChart:[], sellerRanking:[] })
    } finally { setLoading(false) }
  }, [from, to])

  useEffect(() => { load() }, [load])

  function applyPreset(p: string) {
    const n = new Date()
    if (p === "month") {
      setFrom(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0])
      setTo(n.toISOString().split("T")[0])
    }
    setPreset(p)
  }

  const d = data || {}
  const pct = Math.min(Math.round(((d.totalRevenue || 0) / monthlyGoal) * 100), 100)
  const dailyChart = d.dailyChart || []
  const maxVal = Math.max(...dailyChart.map((x: any) => x.value), 1)

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <style>{`
        .dash-cards { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px; }
        .dash-mid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
        @media (min-width: 768px) {
          .dash-cards { grid-template-columns: repeat(4,1fr); gap: 12px; }
          .dash-mid { grid-template-columns: 2fr 1fr; }
        }
      `}</style>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 16px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500,color:"#111"}}>Dashboard</div>
        <div style={{fontSize:"11px",color:"#666"}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"10px 16px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap",flexShrink:0}}>
        <button onClick={() => applyPreset("month")} style={{padding:"5px 12px",fontSize:"12px",border:"0.5px solid #e5e7eb",borderRadius:"6px",cursor:"pointer",background:preset==="month"?primary:"white",color:preset==="month"?"white":"#666"}}>Este mes</button>
        <button onClick={() => setPreset("custom")} style={{padding:"5px 12px",fontSize:"12px",border:"0.5px solid #e5e7eb",borderRadius:"6px",cursor:"pointer",background:preset==="custom"?primary:"white",color:preset==="custom"?"white":"#666"}}>Personalizado</button>
        {preset === "custom" && (
          <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:"12px",color:"#888"}}>De</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{padding:"4px 8px",border:"0.5px solid #e5e7eb",borderRadius:"6px",fontSize:"12px"}} />
            <span style={{fontSize:"12px",color:"#888"}}>ate</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{padding:"4px 8px",border:"0.5px solid #e5e7eb",borderRadius:"6px",fontSize:"12px"}} />
          </div>
        )}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:"40px",color:"#888"}}>Carregando...</div>
        ) : (
          <>
            <div className="dash-cards">
              {[
                { label:"Faturamento", value:fmt(d.totalRevenue||0), sub:(d.totalSales||0)+" vendas", color:"#1D9E75" },
                { label:"Lucro estimado", value:fmt(d.estimatedProfit||0), sub:"26% margem", color:"#8b5cf6" },
                { label:"Ticket medio", value:fmt(d.avgTicket||0), sub:"Por venda", color:"#f59e0b" },
                { label:"Total de vendas", value:String(d.totalSales||0), sub:"No periodo", color:"#3b82f6" },
              ].map(m => (
                <div key={m.label} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"14px"}}>
                  <div style={{fontSize:"11px",color:"#888",marginBottom:"6px"}}>{m.label}</div>
                  <div style={{fontSize:"18px",fontWeight:600,color:"#111",marginBottom:"4px"}}>{m.value}</div>
                  <div style={{fontSize:"11px",color:m.color}}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px",flexWrap:"wrap",gap:"4px"}}>
                <span style={{fontSize:"13px",fontWeight:500}}>Meta mensal</span>
                <span style={{fontSize:"12px",color:"#1D9E75",fontWeight:500}}>{fmt(d.totalRevenue||0)} de {fmt(monthlyGoal)} ({pct}%)</span>
              </div>
              <div style={{height:"8px",background:"#E1F5EE",borderRadius:"4px"}}>
                <div style={{height:"100%",background:"#1D9E75",borderRadius:"4px",width:pct+"%",transition:"width 0.5s"}} />
              </div>
            </div>
            <div className="dash-mid">
              <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
                <div style={{fontSize:"13px",fontWeight:500,marginBottom:"14px"}}>Vendas por dia</div>
                {dailyChart.length > 0 ? (
                  <div style={{display:"flex",alignItems:"flex-end",gap:"2px",height:"140px"}}>
                    {dailyChart.map((x: any) => {
                      const barH = Math.max(Math.round((x.value / maxVal) * 100), 5)
                      return (
                        <div key={x.day} style={{minWidth:"16px",flex:1,display:"flex",flexDirection:"column",alignItems:"center",height:"100%",justifyContent:"flex-end"}}>
                          <div style={{width:"100%",background:primary,borderRadius:"3px 3px 0 0",height:barH+"%"}} title={fmt(x.value)} />
                          <div style={{fontSize:"8px",color:"#888",marginTop:"3px",textAlign:"center"}}>{x.day}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{height:"100px",display:"flex",alignItems:"center",justifyContent:"center",color:"#ccc",fontSize:"13px"}}>Sem dados no periodo</div>
                )}
              </div>
              <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
                <div style={{fontSize:"13px",fontWeight:500,marginBottom:"14px"}}>Ranking Vendedores</div>
                {(d.sellerRanking||[]).length === 0 && <div style={{color:"#ccc",fontSize:"13px",textAlign:"center",padding:"20px 0"}}>Sem dados no periodo</div>}
                {(d.sellerRanking||[]).slice(0,5).map((s:any,i:number) => (
                  <div key={s.name} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                    <div style={{fontSize:"20px",flexShrink:0,width:"28px",textAlign:"center"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i===3?"4":"5"}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"13px",fontWeight:500}}>{s.name}</div>
                      <div style={{fontSize:"11px",color:"#888"}}>{s.count} venda{s.count!==1?"s":""}</div>
                    </div>
                    <div style={{fontSize:"13px",color:"#1D9E75",fontWeight:600}}>{fmt(s.total)}</div>
                  </div>
                ))}
              </div>
            </div>
            {(d.topProducts||[]).length > 0 && (
              <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"16px"}}>
                <div style={{fontSize:"13px",fontWeight:500,marginBottom:"14px"}}>Top Produtos</div>
                {(d.topProducts||[]).slice(0,5).map((p:any,i:number) => (
                  <div key={p.name} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                    <div style={{fontSize:"18px",flexShrink:0,width:"24px",textAlign:"center"}}>{i===0?"🏆":i===1?"🥈":i===2?"🥉":"➕"}</div>
                    <div style={{flex:1,fontSize:"13px"}}>{p.name}</div>
                    <div style={{fontSize:"12px",color:"#888",marginRight:"8px"}}>{p.quantity} un</div>
                    <div style={{fontSize:"13px",color:"#1D9E75",fontWeight:600}}>{fmt(p.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}