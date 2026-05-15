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

  const load = useCallback(async () => {
    try {
      const r = await api.get("/reports/dashboard")
      setData(r.data)
    } catch {
      setData({ todaySales:0, monthSales:0, profit:0, avgTicket:0, monthGoal:20000, monthGoalPct:0, lowStock:[], weeklyChart:[], totalSalesToday:0 })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#888",fontSize:"14px"}}>Carregando...</div>

  const pct = Math.min(data.monthGoalPct || 0, 100)

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
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        <div className="dash-cards">
          {[
            { label:"Vendas hoje", value:fmt(data.todaySales||0), sub:(data.totalSalesToday||0)+" vendas", color:"#1D9E75" },
            { label:"Faturamento mensal", value:fmt(data.monthSales||0), sub:"Este mes", color:"#3b82f6" },
            { label:"Lucro estimado", value:fmt(data.profit||0), sub:"26% margem", color:"#8b5cf6" },
            { label:"Ticket medio", value:fmt(data.avgTicket||0), sub:"Por venda", color:"#f59e0b" },
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
            <span style={{fontSize:"12px",color:"#1D9E75",fontWeight:500}}>{fmt(data.monthSales||0)} de {fmt(data.monthGoal||20000)} ({pct}%)</span>
          </div>
          <div style={{height:"8px",background:"#E1F5EE",borderRadius:"4px"}}>
            <div style={{height:"100%",background:"#1D9E75",borderRadius:"4px",width:pct+"%",transition:"width 0.5s"}} />
          </div>
        </div>
        <div className="dash-mid">
          <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
            <div style={{fontSize:"13px",fontWeight:500,marginBottom:"14px"}}>Faturamento - ultimos 7 dias</div>
            {data.weeklyChart?.length > 0 ? (
              <div style={{display:"flex",alignItems:"flex-end",gap:"6px",height:"100px"}}>
                {data.weeklyChart.map((d:any) => {
                  const max = Math.max(...data.weeklyChart.map((x:any) => x.value), 1)
                  const h = Math.max((d.value/max)*100, 4)
                  return (
                    <div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
                      <div style={{flex:1,display:"flex",alignItems:"flex-end",width:"100%"}}>
                        <div style={{width:"100%",background:"#1D9E75",borderRadius:"4px 4px 0 0",height:h+"%"}} title={fmt(d.value)} />
                      </div>
                      <div style={{fontSize:"9px",color:"#888"}}>{d.day}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{height:"100px",display:"flex",alignItems:"center",justifyContent:"center",color:"#ccc",fontSize:"13px"}}>Sem dados ainda</div>
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
        {data.lowStock?.length > 0 && (
          <div style={{background:"#FAEEDA",border:"1px solid #E8C97B",borderRadius:"12px",padding:"16px"}}>
            <div style={{fontSize:"13px",fontWeight:500,color:"#633806",marginBottom:"10px"}}>Estoque baixo - {data.lowStock.length} produto(s)</div>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              {data.lowStock.map((p:any) => (
                <div key={p.id||p.name} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"white",borderRadius:"8px",fontSize:"13px"}}>
                  <span style={{color:"#633806",fontWeight:500}}>{p.name}</span>
                  <span style={{color:"#D85A30",fontWeight:500}}>{p.stock} un</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}