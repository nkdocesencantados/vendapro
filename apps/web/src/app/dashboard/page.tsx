"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"
import { useAuthStore } from "@/contexts/auth.store"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    api.get("/reports/dashboard").then(r => setData(r.data)).catch(() => {
      setData({ todaySales:0, monthSales:0, profit:0, avgTicket:0, monthGoal:20000, monthGoalPct:0, lowStock:[], weeklyChart:[{day:"Seg",value:0},{day:"Ter",value:0},{day:"Qua",value:0},{day:"Qui",value:0},{day:"Sex",value:0},{day:"Sab",value:0},{day:"Dom",value:0}] })
    })
  }, [])

  if (!data) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#888"}}>Carregando...</div>

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 20px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500,color:"#111"}}>Dashboard</div>
        <span style={{fontSize:"12px",color:"#666"}}>Ola, {user?.name?.split(" ")[0]}</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"14px"}}>
          {[{label:"Vendas hoje",value:fmt(data.todaySales)},{label:"Mes atual",value:fmt(data.monthSales)},{label:"Lucro estimado",value:fmt(data.profit)},{label:"Ticket medio",value:fmt(data.avgTicket)}].map(m=>(
            <div key={m.label} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"14px 16px"}}>
              <div style={{fontSize:"11px",color:"#888",marginBottom:"6px"}}>{m.label}</div>
              <div style={{fontSize:"21px",fontWeight:500,color:"#111"}}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"8px"}}>
            <span style={{fontWeight:500}}>Meta mensal</span>
            <span style={{color:"#1D9E75",fontWeight:500}}>{data.monthGoalPct}% - {fmt(data.monthSales)} de {fmt(data.monthGoal)}</span>
          </div>
          <div style={{height:"8px",background:"#E1F5EE",borderRadius:"4px"}}>
            <div style={{height:"100%",background:"#1D9E75",borderRadius:"4px",width:data.monthGoalPct+"%"}} />
          </div>
        </div>
        <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
          <div style={{fontSize:"12.5px",fontWeight:500,marginBottom:"12px"}}>Faturamento - ultimos 7 dias</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:"6px",height:"120px"}}>
            {data.weeklyChart?.map((d:any)=>{
              const max=Math.max(...data.weeklyChart.map((x:any)=>x.value),1)
              const pct=(d.value/max)*100
              return (<div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}><div style={{flex:1,display:"flex",alignItems:"flex-end",width:"100%"}}><div style={{width:"100%",background:"#1D9E75",borderRadius:"4px 4px 0 0",height:pct+"%",minHeight:"4px"}} /></div><div style={{fontSize:"10px",color:"#888"}}>{d.day}</div></div>)
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
