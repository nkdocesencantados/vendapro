"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }

const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

export default function ReportsPage() {
  const now = new Date()
  const [tab, setTab] = useState("geral")
  const [from, setFrom] = useState(new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0])
  const [to, setTo]   = useState(new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split("T")[0])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [primary, setPrimary] = useState("#1D9E75")

  useEffect(()=>{
    try{ const sc=localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor)} }catch{}
    load()
  },[from,to])

  async function load(){
    setLoading(true)
    try{
      const r = await api.get(`/reports/advanced?from=${from}&to=${to}`)
      setData(r.data)
    }catch(e){console.error(e)}finally{setLoading(false)}
  }

  const revenue     = data?.totalRevenue||0
  const totalSales  = data?.totalSales||0
  const avgTicket   = data?.avgTicket||0
  const profit      = data?.estimatedProfit||0
  const margin      = revenue>0?Math.round((profit/revenue)*100):0
  const products: any[] = data?.topProducts||[]
  const dailyChart: any[] = data?.dailyChart||[]
  const payMethods: any[] = data?.paymentMethods||[]

  function BarChart({ data, labels }: { data:number[],labels?:string[] }){
    const max = Math.max(...data,1)
    return (
      <div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:160,padding:"8px 0"}}>
          {data.map((v,i)=>(
            <div key={i} style={{flex:1,background:`linear-gradient(to top,var(--brand),#34D399)`,borderRadius:"4px 4px 1px 1px",height:`${(v/max)*100}%`,minHeight:4,transition:"opacity .15s",cursor:"default"}} title={BRL(v)}>
              {labels&&<span style={{position:"absolute",bottom:-18,left:0,right:0,textAlign:"center",fontSize:9,color:"var(--text-subtle)"}}>{labels[i]}</span>}
            </div>
          ))}
        </div>
        {labels&&<div style={{height:20}}/>}
      </div>
    )
  }

  return (
    <div style={{padding:28,maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .vp-card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);}
        .vp-card-head h3{margin:0;font-size:14px;font-weight:600;}
        .vp-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;}
        .vp-tbl th{text-align:left;font-weight:500;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-subtle);padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface-2);}
        .vp-tbl td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle;}
        .vp-tbl tr:last-child td{border-bottom:0;}
        .vp-tbl tr:hover td{background:var(--surface-2);}
        .vp-pill{display:inline-flex;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;background:var(--surface-3);color:var(--text-muted);}
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);} .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s;}
        .vp-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .kpi{padding:18px;background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .kpi .lbl{font-size:12px;color:var(--text-subtle);font-weight:500;margin-bottom:10px;}
        .kpi .val{font-size:22px;font-weight:600;letter-spacing:-.02em;font-family:var(--font-mono,"Geist Mono",monospace);}
        .vp-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:20px;}
        .vp-tab{padding:9px 16px;font-size:13px;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;transition:all .12s;}
        .vp-tab.active{color:var(--text);border-bottom-color:var(--brand);font-weight:500;}
        .vp-tab:hover{color:var(--text);}
        .mini-bar{height:6px;background:var(--surface-2);border-radius:999px;margin-top:4px;overflow:hidden;}
        .mini-bar span{display:block;height:100%;border-radius:999px;}
        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}.rep-grid{grid-template-columns:1fr!important;}}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:600,letterSpacing:"-.02em"}}>Relatorios</h1>
          <div style={{color:"var(--text-subtle)",fontSize:14,marginTop:4}}>Analise completa do negocio</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input className="vp-input" type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{width:140}} />
          <input className="vp-input" type="date" value={to} onChange={e=>setTo(e.target.value)} style={{width:140}} />
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi"><div className="lbl">Faturamento</div><div className="val">{BRL(revenue)}</div></div>
        <div className="kpi"><div className="lbl">Ticket medio</div><div className="val">{BRL(avgTicket)}</div></div>
        <div className="kpi"><div className="lbl">Lucro estimado</div><div className="val">{BRL(profit)}<span style={{fontSize:13,color:"var(--success)",marginLeft:8}}>{margin}%</span></div></div>
        <div className="kpi"><div className="lbl">Total vendas</div><div className="val" style={{fontFamily:"inherit"}}>{totalSales}</div></div>
      </div>

      {/* TABS */}
      <div className="vp-tabs">
        {[["geral","Visao Geral"],["produtos","Produtos"],["vendas","Vendas"],["financeiro","Financeiro"]].map(([id,lbl])=>(
          <div key={id} className={`vp-tab${tab===id?" active":""}`} onClick={()=>setTab(id)}>{lbl}</div>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>Carregando...</div>
      ) : (
        <>
          {tab==="geral" && (
            <div style={{display:"grid",gap:18}}>
              {/* TOP PRODUTOS */}
              <div className="vp-card">
                <div className="vp-card-head"><h3>Top produtos do periodo</h3></div>
                <div style={{padding:18}}>
                  {products.length===0 ? (
                    <div style={{color:"var(--text-subtle)",fontSize:13}}>Sem dados no periodo.</div>
                  ) : products.map((p:any,i:number)=>{
                    const maxRev = products[0]?.revenue||1
                    return (
                      <div key={i} style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                          <span style={{fontSize:13,fontWeight:500}}>
                            <span style={{color:"var(--text-subtle)",marginRight:8,fontFamily:"var(--font-mono)",fontSize:11}}>#{i+1}</span>
                            {p.name}
                          </span>
                          <span style={{fontFamily:"var(--font-mono)",fontWeight:600}}>{BRL(p.revenue)}</span>
                        </div>
                        <div className="mini-bar"><span style={{width:`${(p.revenue/maxRev)*100}%`,background:primary}}/></div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* PAGAMENTO */}
              {payMethods.length>0 && (
                <div className="rep-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div className="vp-card">
                    <div className="vp-card-head"><h3>Por forma de pagamento</h3></div>
                    <div style={{padding:18}}>
                      {payMethods.map((m:any)=>{
                        const PAY: Record<string,string> = {cash:"Dinheiro",pix:"PIX",credit_card:"Credito",debit_card:"Debito"}
                        const pct = revenue>0?Math.round((m.total/revenue)*100):0
                        return (
                          <div key={m.method} style={{padding:"8px 0"}}>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                              <span style={{fontWeight:500}}>{PAY[m.method]||m.method}</span>
                              <span style={{fontFamily:"var(--font-mono)"}}>{pct}%</span>
                            </div>
                            <div style={{height:6,background:"var(--surface-2)",borderRadius:999}}>
                              <div style={{width:pct+"%",height:"100%",background:primary,borderRadius:999}}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==="produtos" && (
            <div className="vp-card">
              <div className="vp-card-head"><h3>Performance de produtos</h3></div>
              <table className="vp-tbl">
                <thead><tr><th>Produto</th><th style={{textAlign:"right"}}>Vendidos</th><th style={{textAlign:"right"}}>Receita</th><th style={{textAlign:"right"}}>Lucro</th></tr></thead>
                <tbody>
                  {products.length===0 ? (
                    <tr><td colSpan={4} style={{textAlign:"center",padding:32,color:"var(--text-subtle)"}}>Sem dados</td></tr>
                  ) : products.map((p:any,i:number)=>(
                    <tr key={i}>
                      <td style={{fontWeight:500}}>{p.name}</td>
                      <td style={{textAlign:"right",fontFamily:"var(--font-mono)"}}>{p.quantity}</td>
                      <td style={{textAlign:"right",fontFamily:"var(--font-mono)",fontWeight:600}}>{BRL(p.revenue)}</td>
                      <td style={{textAlign:"right",fontFamily:"var(--font-mono)",color:"var(--success)"}}>{BRL(p.revenue*0.263)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab==="vendas" && (
            <div className="vp-card" style={{padding:24}}>
              <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:600}}>Vendas por dia</h3>
              {dailyChart.length>0 ? (
                <BarChart data={dailyChart.map((d:any)=>d.value)} labels={dailyChart.map((d:any)=>d.day)} />
              ) : (
                <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Sem dados no periodo.</div>
              )}
            </div>
          )}

          {tab==="financeiro" && (
            <div className="rep-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              <div className="vp-card" style={{padding:24}}>
                <h3 style={{margin:0,fontSize:14,fontWeight:600}}>Fluxo do periodo</h3>
                <div style={{marginTop:14,display:"grid",gap:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                    <span>Entrada</span>
                    <strong style={{color:"var(--success)",fontFamily:"var(--font-mono)"}}>+ {BRL(revenue)}</strong>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                    <span>Saida estimada</span>
                    <strong style={{color:"var(--danger)",fontFamily:"var(--font-mono)"}}>− {BRL(revenue-profit)}</strong>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderTop:"2px solid var(--border-strong)"}}>
                    <strong>Lucro estimado</strong>
                    <strong style={{fontFamily:"var(--font-mono)",fontSize:18}}>{BRL(profit)}</strong>
                  </div>
                </div>
              </div>
              <div className="vp-card" style={{padding:24}}>
                <h3 style={{margin:0,fontSize:14,fontWeight:600}}>Resumo</h3>
                <div style={{marginTop:14,display:"grid",gap:12}}>
                  {[["Total de vendas",totalSales,""],["Ticket medio",BRL(avgTicket),""],["Margem estimada",margin+"%",""],["Faturamento",BRL(revenue),""]].map(([lbl,val])=>(
                    <div key={lbl} style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:"var(--text-muted)"}}>{lbl}</span>
                      <strong style={{fontFamily:"var(--font-mono)"}}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
