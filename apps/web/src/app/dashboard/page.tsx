"use client"
import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"
import { useAuthStore } from "@/contexts/auth.store"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [primary, setPrimary] = useState("#1D9E75")
  const now = new Date()
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0])
  const [to, setTo] = useState(now.toISOString().split("T")[0])
  const [preset, setPreset] = useState("month")

  useEffect(() => {
    try {
      const c = localStorage.getItem("storeConfig")
      if (c) { const p = JSON.parse(c); if (p.primaryColor) setPrimary(p.primaryColor) }
    } catch {}
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/reports/advanced?from=${from}&to=${to}`)
      setData(r.data)
    } catch {
      setData({ totalRevenue:0, totalSales:0, estimatedProfit:0, avgTicket:0, topProducts:[], dailyChart:[] })
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
  const pct = d.monthGoal > 0 ? Math.min(Math.round((d.totalRevenue / 20000) * 100), 100) : Math.min(Math.round(((d.totalRevenue || 0) / 20000) * 100), 100)

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

      {/* FILTRO */}
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
                { label:"Faturamento", value:fmt(d.totalRevenue||0), sub:(d.totalSales||0)+" vendas", color:primary },
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
                <span style={{fontSize:"12px",color:primary,fontWeight:500}}>{fmt(d.totalRevenue||0)} de {fmt(20000)} ({pct}%)</span>
              </div>
              <div style={{height:"8px",background:"#E1F5EE",borderRadius:"4px"}}>
                <div style={{height:"100%",background:primary,borderRadius:"4px",width:pct+"%",transition:"width 0.5s"}} />
              </div>
            </div>

            <div className="dash-mid">
              <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
                <div style={{fontSize:"13px",fontWeight:500,marginBottom:"14px"}}>Vendas por dia</div>
                {(d.dailyChart||[]).length > 0 ? (
                  <div style={{display:"flex",alignItems:"flex-end",gap:"4px",height:"120px",paddingBottom:"20px",position:"relative"}}>
                    {(d.dailyChart||[]).map((x:any) => {
                      const max = Math.max(...(d.dailyChart||[]).map((v:any) => v.value), 1)
                      const h = Math.max((x.value/max)*100, 4)
                      return (
                        <div key={x.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%"}}>
                          <div style={{width:"100%",background:primary,borderRadius:"4px 4px 0 0",height:h+"%",minHeight:"4px"}} title={fmt(x.value)} />
                          <div style={{fontSize:"9px",color:"#888",marginTop:"4px",whiteSpace:"nowrap"}}>{x.day}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{height:"100px",display:"flex",alignItems:"center",justifyContent:"center",color:"#ccc",fontSize:"13px"}}>Sem dados no periodo</div>
                )}
              </div>
              <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
                <div style={{fontSize:"13px",fontWeight:500,marginBottom:"14px"}}>Acesso rapido</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {[
                    { label:"Nova Venda", href:"/dashboard/sales" },
                    { label:"Novo Produto", href:"/dashboard/inventory" },
                    { label:"Caixa", href:"/dashboard/cash" },
                    { label:"Relatorios", href:"/dashboard/reports" },
                  ].map(item => (
                    <Link key={item.href} href={item.href} style={{display:"block",padding:"10px 12px",background:"#f9fafb",borderRadius:"8px",textDecoration:"none",color:"#111",fontSize:"13px",border:"0.5px solid #e5e7eb",textAlign:"center"}}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {(d.topProducts||[]).length > 0 && (
              <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"16px"}}>
                <div style={{fontSize:"13px",fontWeight:500,marginBottom:"14px"}}>Top Produtos</div>
                {(d.topProducts||[]).slice(0,5).map((p:any,i:number) => (
                  <div key={p.name} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                    <div style={{width:"20px",height:"20px",background:primary,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"10px",flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1,fontSize:"13px"}}>{p.name}</div>
                    <div style={{fontSize:"13px",color:primary,fontWeight:600}}>{fmt(p.revenue)}</div>
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