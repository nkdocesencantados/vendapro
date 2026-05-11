"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"
import { useAuthStore } from "@/contexts/auth.store"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  useEffect(() => {
    api.get("/reports/dashboard").then((r) => setData(r.data)).catch(() => {
      setData({ todaySales:3840, monthSales:15600, profit:4100, avgTicket:128, monthGoal:20000, monthGoalPct:78, lowStock:[{name:"Tenis Chunky",stock:3}] })
    })
  }, [])
  if (!data) return <div style={{padding:"40px",textAlign:"center",color:"#888"}}>Carregando...</div>
  const d = data
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 20px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500,color:"#111"}}>Dashboard</div>
        <span style={{fontSize:"12px",color:"#666"}}>Ola, {user?.name?.split(" ")[0]}</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"14px"}}>
          {[{label:"Vendas hoje",value:fmt(d.todaySales)},{label:"Mes atual",value:fmt(d.monthSales)},{label:"Lucro",value:fmt(d.profit)},{label:"Ticket medio",value:fmt(d.avgTicket)}].map(m => (
            <div key={m.label} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"14px 16px"}}>
              <div style={{fontSize:"11px",color:"#888",marginBottom:"6px"}}>{m.label}</div>
              <div style={{fontSize:"21px",fontWeight:500,color:"#111"}}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"8px"}}>
            <span style={{fontWeight:500}}>Meta mensal</span>
            <span style={{color:"#1D9E75",fontWeight:500}}>{d.monthGoalPct}%</span>
          </div>
          <div style={{height:"8px",background:"#E1F5EE",borderRadius:"4px"}}>
            <div style={{height:"100%",background:"#1D9E75",borderRadius:"4px",width:d.monthGoalPct+"%"}} />
          </div>
        </div>
      </div>
    </div>
  )
}
