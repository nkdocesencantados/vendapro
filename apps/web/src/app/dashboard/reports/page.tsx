"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }
const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const PAY: Record<string,string> = {cash:"Dinheiro",pix:"PIX",credit_card:"Credito",debit_card:"Debito"}

export default function ReportsPage() {
  const now = new Date()
  const [tab, setTab] = useState("geral")
  const [from, setFrom] = useState(new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0])
  const [to, setTo] = useState(new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split("T")[0])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [primary, setPrimary] = useState("#1D9E75")

  useEffect(()=>{
    try{ const sc=localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor)} }catch{}
    load()
  },[from,to])

  async function load(){
    setLoading(true)
    try{ const r = await api.get(`/reports/advanced?from=${from}&to=${to}`); setData(r.data) }
    catch(e){console.error(e)}finally{setLoading(false)}
  }

  const revenue    = data?.totalRevenue||0
  const totalSales = data?.totalSales||0
  const avgTicket  = data?.avgTicket||0
  const profit     = data?.estimatedProfit||0
  const margin     = revenue>0?Math.round((profit/revenue)*100):0
  const products: any[] = data?.topProducts||[]
  const dailyChart: any[] = data?.dailyChart||[]
  const payMethods: any[] = data?.paymentMethods||[]

  return (
    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s;}
        .vp-input:focus{border-color:var(--brand,#1D9E75);}
        .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
        .kpi{padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;}
        .kpi .lbl{font-size:11px;color:var(--text-subtle);margin-bottom:4px;}
        .kpi .val{font-size:clamp(14px,4vw,20px);font-weight:600;letter-spacing:-.02em;}
        .kpi .dlt{font-size:11px;color:#1D9E75;margin-top:2px;}
        .tab-row{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:14px;overflow-x:auto;}
        .tab{padding:8px 12px;font-size:12px;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;white-space:nowrap;}
        .tab.on{color:var(--text);border-bottom-color:#1D9E75;font-weight:500;}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:10px;}
        .card-head{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .card-title{font-size:13px;font-weight:600;color:var(--text);}
        .bar-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
        .bar-label{font-size:11px;color:var(--text-subtle);width:70px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .bar-track{flex:1;height:6px;background:var(--surface-2);border-radius:999px;overflow:hidden;}
        .bar-fill{height:100%;border-radius:999px;}
        .bar-val{font-size:11px;color:var(--text);width:40px;text-align:right;flex-shrink:0;}
        .prod-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);}
        .prod-row:last-child{border:none;}
        .date-row{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
        .chart-bars{display:flex;align-items:flex-end;gap:3px;height:80px;}
        .chart-bar{flex:1;border-radius:3px 3px 0 0;min-height:3px;}
        @media(max-width:640px){.kpi-grid{grid-template-columns:1fr 1fr!important;}}
      `}</style>

      <div style={{marginBottom:14}}>
        <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Relatorios</h1>
        <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>Analise completa do negocio</div>
      </div>

      <div className="date-row">
        <input className="vp-input" type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{flex:1,minWidth:130}}/>
        <input className="vp-input" type="date" value={to} onChange={e=>setTo(e.target.value)} style={{flex:1,minWidth:130}}/>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="lbl">Faturamento</div><div className="val">{BRLshort(revenue)}</div></div>
        <div className="kpi"><div className="lbl">Ticket medio</div><div className="val">{BRLshort(avgTicket)}</div></div>
        <div className="kpi"><div className="lbl">Lucro est.</div><div className="val">{BRLshort(profit)}<span style={{fontSize:11,color:"#1D9E75",marginLeft:6}}>{margin}%</span></div></div>
        <div className="kpi"><div className="lbl">Total vendas</div><div className="val">{totalSales}</div></div>
      </div>

      <div className="tab-row">
        {[["geral","Resumo"],["produtos","Produtos"],["vendas","Vendas"],["financeiro","Financeiro"]].map(([id,lbl])=>(
          <div key={id} className={`tab${tab===id?" on":""}`} onClick={()=>setTab(id)}>{lbl}</div>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>Carregando...</div>
      ) : (
        <>
          {tab==="geral" && (
            <>
              <div className="card">
                <div className="card-head"><div className="card-title">Top produtos</div></div>
                <div style={{padding:"10px 14px"}}>
                  {products.length===0 ? <div style={{color:"var(--text-subtle)",fontSize:13}}>Sem dados no periodo.</div>
                  : products.map((p:any,i:number)=>{
                    const maxRev = products[0]?.revenue||1
                    return (
                      <div key={i} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                          <span style={{color:"var(--text)",fontWeight:500}}><span style={{color:"var(--text-subtle)",marginRight:6}}>#{i+1}</span>{p.name}</span>
                          <span style={{fontWeight:600}}>{BRLshort(p.revenue)}</span>
                        </div>
                        <div className="bar-track"><div className="bar-fill" style={{width:`${(p.revenue/maxRev)*100}%`,background:primary}}/></div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {payMethods.length>0 && (
                <div className="card">
                  <div className="card-head"><div className="card-title">Por forma de pagamento</div></div>
                  <div style={{padding:"10px 14px"}}>
                    {payMethods.map((m:any)=>{
                      const pct = revenue>0?Math.round((m.total/revenue)*100):0
                      return (
                        <div key={m.method} className="bar-row">
                          <div className="bar-label">{PAY[m.method]||m.method}</div>
                          <div className="bar-track"><div className="bar-fill" style={{width:`${pct}%`,background:primary}}/></div>
                          <div className="bar-val">{pct}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {tab==="produtos" && (
            <div className="card">
              <div className="card-head"><div className="card-title">Performance de produtos</div></div>
              <div style={{padding:"8px 14px"}}>
                {products.length===0 ? <div style={{padding:"24px 0",textAlign:"center",color:"var(--text-subtle)",fontSize:13}}>Sem dados</div>
                : products.map((p:any,i:number)=>(
                  <div key={i} className="prod-row">
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:"var(--text)"}}>{p.name}</div>
                      <div style={{fontSize:11,color:"var(--text-subtle)",marginTop:2}}>{p.quantity} unidades vendidas</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{BRLshort(p.revenue)}</div>
                      <div style={{fontSize:11,color:"#1D9E75",marginTop:2}}>{BRLshort(p.revenue*0.263)} lucro</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="vendas" && (
            <div className="card">
              <div className="card-head"><div className="card-title">Vendas por dia</div></div>
              <div style={{padding:"14px"}}>
                {dailyChart.length>0 ? (
                  <>
                    <div className="chart-bars">
                      {dailyChart.map((d:any,i:number)=>{
                        const max = Math.max(...dailyChart.map((x:any)=>x.value),1)
                        return <div key={i} className="chart-bar" style={{height:`${Math.max((d.value/max)*100,3)}%`,background:d.value===Math.max(...dailyChart.map((x:any)=>x.value))?primary:"rgba(29,158,117,0.25)"}}/>
                      })}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--text-subtle)",marginTop:6}}>
                      <span>{dailyChart[0]?.day}</span>
                      <span>{dailyChart[Math.floor(dailyChart.length/2)]?.day}</span>
                      <span>{dailyChart[dailyChart.length-1]?.day}</span>
                    </div>
                  </>
                ) : <div style={{textAlign:"center",padding:32,color:"var(--text-subtle)",fontSize:13}}>Sem dados no periodo.</div>}
              </div>
            </div>
          )}

          {tab==="financeiro" && (
            <>
              <div className="card" style={{padding:14,marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:"var(--text)"}}>Fluxo do periodo</div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontSize:13,color:"var(--text-subtle)"}}>Entrada</span>
                  <strong style={{color:"#1D9E75",fontSize:13}}>+ {BRL(revenue)}</strong>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontSize:13,color:"var(--text-subtle)"}}>Saida estimada</span>
                  <strong style={{color:"var(--danger)",fontSize:13}}>- {BRL(revenue-profit)}</strong>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0"}}>
                  <strong style={{fontSize:14}}>Lucro estimado</strong>
                  <strong style={{fontSize:16}}>{BRL(profit)}</strong>
                </div>
              </div>
              <div className="card" style={{padding:14}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:"var(--text)"}}>Resumo</div>
                {[["Total de vendas",String(totalSales)],["Ticket medio",BRL(avgTicket)],["Margem estimada",margin+"%"],["Faturamento",BRL(revenue)]].map(([lbl,val])=>(
                  <div key={lbl} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{color:"var(--text-subtle)"}}>{lbl}</span>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
