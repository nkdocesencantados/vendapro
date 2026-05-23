"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"



function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }



function vpCSV(headers: string[], rows: any[][], filename: string) {

  const lines = [headers, ...rows].map(r => r.map((c:any) => String(c)).join(';')).join('\n');

  const blob = new Blob([lines], {type: 'text/csv;charset=utf-8'});

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url; a.download = filename + '.csv'; a.click();

  URL.revokeObjectURL(url);

}

function vpPDF(html: string) {

  const w = window.open('', '_blank');

  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 600); }

}

function vpTable(title: string, headers: string[], rows: string[][]) {

  const th = headers.map((h:string) => '<th>' + h + '</th>').join('');

  const tr = rows.map((r:string[]) => '<tr>' + r.map((c:string) => '<td>' + c + '</td>').join('') + '</tr>').join('');

  return '<html><head><title>'+title+'</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1D9E75;color:white;padding:8px;font-size:11px}td{padding:7px;border-bottom:1px solid #eee;font-size:11px}</style></head><body><h2>'+title+'</h2><table><thead><tr>'+th+'</tr></thead><tbody>'+tr+'</tbody></table></body></html>';

}



function exportRepCSV(products: any[], from: string, to: string) {

  vpCSV(['Produto','Qtd','Receita','Lucro Est.'],

    products.map((p:any)=>[p.name,p.quantity,Number(p.revenue).toFixed(2),(Number(p.revenue)*0.263).toFixed(2)]),

    'relatorio-'+from+'-'+to);

}

﻿function exportRepPDF(products: any[], revenue: number, profit: number, totalSales: number, from: string, to: string) {
  const margin=revenue>0?Math.round((profit/revenue)*100):0;
  const maxRev=products.length>0?Number(products[0].revenue):1;
  const rows=products.map((p:any,i:number)=>{
    const pct=maxRev>0?Math.round((Number(p.revenue)/maxRev)*100):0;
    const bg=i%2===0?'#ffffff':'#F8FAF9';
    const bar='<div style="display:flex;align-items:center"><div style="flex:1;height:6px;background:#E5EDE9;border-radius:999px;overflow:hidden;margin:0 8px"><div style="height:6px;background:#1D9E75;border-radius:999px;width:'+pct+'%"></div></div><span style="font-size:11px;color:#888;width:32px;text-align:right">'+pct+'%</span></div>';
    return '<tr style="background:'+bg+'"><td style="padding:10px 14px;color:#888;font-size:11px;border-bottom:1px solid #E5EDE9">'+(i+1)+'</td><td style="padding:10px 14px;font-weight:600;border-bottom:1px solid #E5EDE9">'+p.name+'</td><td style="padding:10px 14px;text-align:center;border-bottom:1px solid #E5EDE9">'+p.quantity+'</td><td style="padding:10px 14px;text-align:right;font-weight:600;border-bottom:1px solid #E5EDE9">R$ '+Number(p.revenue).toFixed(2)+'</td><td style="padding:10px 14px;text-align:right;font-weight:600;color:#1D9E75;border-bottom:1px solid #E5EDE9">R$ '+(Number(p.revenue)*0.263).toFixed(2)+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9">'+bar+'</td></tr>';
  }).join('');
  const logo='<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2.5" fill="white"/><circle cx="4" cy="18" r="2.5" fill="white"/><circle cx="20" cy="18" r="2.5" fill="white"/><line x1="12" y1="4" x2="4" y2="18" stroke="white" stroke-width="1.5"/><line x1="12" y1="4" x2="20" y2="18" stroke="white" stroke-width="1.5"/><line x1="4" y1="18" x2="20" y2="18" stroke="white" stroke-width="1.5"/></svg>';
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatorio VendaPro</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body>';
  const header='<div style="background:#04130F;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;background:#1D9E75;border-radius:10px;display:flex;align-items:center;justify-content:center;">'+logo+'</div><div><div style="font-size:16px;font-weight:700;color:white;">VendaPro</div><div style="font-size:11px;color:#6B8C82;margin-top:2px;">N&K Doces Encantados</div></div></div><div style="text-align:right;"><div style="font-size:18px;font-weight:700;color:white;">Relatorio de Desempenho</div><div style="font-size:12px;color:#8DA39A;margin-top:3px;">Periodo: '+from+' a '+to+'</div><div style="font-size:11px;color:#6B8C82;margin-top:2px;">Gerado em '+new Date().toLocaleString('pt-BR')+'</div></div></div>';
  const kpis='<div style="display:grid;grid-template-columns:repeat(4,1fr);background:#F8FAF9;border-bottom:2px solid #E5EDE9;"><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Faturamento</div><div style="font-size:22px;font-weight:700;color:#1D9E75;">R$ '+revenue.toFixed(2)+'</div></div><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Lucro estimado</div><div style="font-size:22px;font-weight:700;">R$ '+profit.toFixed(2)+'</div></div><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Margem</div><div style="font-size:22px;font-weight:700;">'+margin+'%</div></div><div style="padding:16px 20px;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Total vendas</div><div style="font-size:22px;font-weight:700;">'+totalSales+'</div></div></div>';
  const table='<div style="padding:24px 32px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #E5EDE9;">Top Produtos</div><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#1D9E75;"><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;font-weight:700;">Rank</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;font-weight:700;">Produto</th><th style="color:white;padding:10px 14px;text-align:center;font-size:11px;font-weight:700;">Qtd</th><th style="color:white;padding:10px 14px;text-align:right;font-size:11px;font-weight:700;">Receita</th><th style="color:white;padding:10px 14px;text-align:right;font-size:11px;font-weight:700;">Lucro Est.</th><th style="color:white;padding:10px 14px;font-size:11px;font-weight:700;">Participacao</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const footer='<div style="padding:14px 32px;background:#F8FAF9;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #E5EDE9;"><div style="font-size:11px;color:#888;">VendaPro - vendapro.com.br | Documento gerado automaticamente</div><div style="font-size:11px;color:#1D9E75;font-weight:700;">N&K Doces Encantados</div></div>';
  vpPDF(html+header+kpis+table+footer+'</body></html>');
}


const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

const PAY: Record<string,string> = {cash:"Dinheiro",pix:"PIX",credit_card:"CrÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â©dito",debit_card:"DÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â©bito"}



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

        <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Relatórios</h1>

        <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>Análise completa do negócio</div>

      </div>



      <div style={{display:"flex",gap:6,marginBottom:8}}>

        <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>exportRepCSV(products,from,to)}>Exportar Excel</button>

        <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>exportRepPDF(products,revenue,profit,totalSales,from,to)}>Exportar PDF</button>

      </div>

      <div className="date-row">

        <input className="vp-input" type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{flex:1,minWidth:130}}/>

        <input className="vp-input" type="date" value={to} onChange={e=>setTo(e.target.value)} style={{flex:1,minWidth:130}}/>

      </div>



      <div className="kpi-grid">

        <div className="kpi"><div className="lbl">Faturamento</div><div className="val">{BRLshort(revenue)}</div></div>

        <div className="kpi"><div className="lbl">Ticket médio</div><div className="val">{BRLshort(avgTicket)}</div></div>

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

                  {products.length===0 ? <div style={{color:"var(--text-subtle)",fontSize:13}}>Sem dados no perÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â­odo.</div>

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

                ) : <div style={{textAlign:"center",padding:32,color:"var(--text-subtle)",fontSize:13}}>Sem dados no perÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â­odo.</div>}

              </div>

            </div>

          )}



          {tab==="financeiro" && (

            <>

              <div className="card" style={{padding:14,marginBottom:10}}>

                <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:"var(--text)"}}>Fluxo do perÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â­odo</div>

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

                {[["Total de vendas",String(totalSales)],["Ticket médio",BRL(avgTicket)],["Margem estimada",margin+"%"],["Faturamento",BRL(revenue)]].map(([lbl,val])=>(

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

