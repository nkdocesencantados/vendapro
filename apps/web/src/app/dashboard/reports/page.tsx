"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }
function pct(a:number,b:number){ if(!b) return 0; return Math.round(((a-b)/b)*100) }

const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"]
const PAY: Record<string,string> = {cash:"Dinheiro",pix:"PIX",credit_card:"Credito",debit_card:"Debito"}

function exportRepPDF(d:any, d2:any, from:string, to:string, storeName:string, margin:number) {
  const rev = d?.totalRevenue||0
  const prof = d?.estimatedProfit||0
  const tot = d?.totalSales||0
  const avg = d?.avgTicket||0
  const prevRev = d2?.totalRevenue||0
  const products: any[] = d?.topProducts||[]
  const payMethods: any[] = d?.paymentMethods||[]
  const maxRev = products[0]?.revenue||1
  const dailyChart2: any[] = d?.dailyChart||[]
  const activeDays = dailyChart2.filter((x:any)=>x.value>0).length||tot
  const maxSale = d?.maxSale||0

  const kpiCard = (lbl:string,val:string,sub:string,color:string) =>
    `<div style="padding:16px 20px;border-right:1px solid #E5EDE9;">
      <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">${lbl}</div>
      <div style="font-size:20px;font-weight:700;color:${color};">${val}</div>
      <div style="font-size:11px;color:#888;margin-top:4px;">${sub}</div>
    </div>`

  const prodRows = products.map((p:any,i:number) => {
    const pct2 = Math.round((Number(p.revenue)/Number(maxRev))*100)
    const lucro = Number(p.revenue)*margin/100
    const bg = i%2===0?'#fff':'#F9FBFA'
    return `<tr style="background:${bg}">
      <td style="padding:10px 14px;color:#888;font-size:12px;border-bottom:1px solid #E5EDE9;">#${i+1}</td>
      <td style="padding:10px 14px;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${p.name}</td>
      <td style="padding:10px 14px;text-align:center;font-size:12px;border-bottom:1px solid #E5EDE9;">${p.quantity}</td>
      <td style="padding:10px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${Number(p.revenue).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
      <td style="padding:10px 14px;text-align:right;font-weight:600;color:#1D9E75;font-size:12px;border-bottom:1px solid #E5EDE9;">${Number(lucro).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;">
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="flex:1;height:6px;background:#E5EDE9;border-radius:999px;overflow:hidden;">
            <div style="height:6px;background:#1D9E75;border-radius:999px;width:${pct2}%"></div>
          </div>
          <span style="font-size:11px;color:#888;width:32px;">${pct2}%</span>
        </div>
      </td>
    </tr>`
  }).join('')

  const payRows = payMethods.map((p:any) => {
    const payPct = rev>0?Math.round((Number(p.total)/rev)*100):0
    return `<tr>
      <td style="padding:8px 14px;font-size:12px;border-bottom:1px solid #E5EDE9;">${PAY[p.paymentMethod]||p.paymentMethod}</td>
      <td style="padding:8px 14px;text-align:center;font-size:12px;border-bottom:1px solid #E5EDE9;">${p.count}</td>
      <td style="padding:8px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${Number(p.total).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
      <td style="padding:8px 14px;text-align:right;font-size:12px;color:#888;border-bottom:1px solid #E5EDE9;">${payPct}%</td>
    </tr>`
  }).join('')

  const growthPct = pct(rev, prevRev)
  const growthStr = prevRev>0 ? (growthPct>=0?`+${growthPct}%`:`${growthPct}%`) : 'N/A'
  const growthColor = growthPct>=0?'#1D9E75':'#ef4444'

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Relatorio VendaPro</title>
  <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:13px;}
  h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#555;margin:20px 32px 10px;padding-bottom:8px;border-bottom:2px solid #E5EDE9;}
  table{width:100%;border-collapse:collapse;}th{background:#1D9E75;color:white;padding:10px 14px;text-align:left;font-size:11px;font-weight:700;}
  </style></head><body>

  <div style="background:#04130F;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:40px;height:40px;background:#1D9E75;border-radius:10px;display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2.5" fill="white"/><circle cx="4" cy="18" r="2.5" fill="white"/><circle cx="20" cy="18" r="2.5" fill="white"/><line x1="12" y1="4" x2="4" y2="18" stroke="white" stroke-width="1.5"/><line x1="12" y1="4" x2="20" y2="18" stroke="white" stroke-width="1.5"/><line x1="4" y1="18" x2="20" y2="18" stroke="white" stroke-width="1.5"/></svg>
      </div>
      <div><div style="font-size:16px;font-weight:700;color:white;">VendaPro</div><div style="font-size:11px;color:#6B8C82;">${storeName}</div></div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:18px;font-weight:700;color:white;">Relatório de Desempenho</div>
      <div style="font-size:12px;color:#8DA39A;margin-top:3px;">Período: ${from} a ${to}</div>
      <div style="font-size:11px;color:#6B8C82;margin-top:2px;">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(5,1fr);background:#F8FAF9;border-bottom:2px solid #E5EDE9;">
    ${kpiCard('Faturamento',`${Number(rev).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,`vs anterior: ${growthStr}`,growthPct>=0?'#1D9E75':'#ef4444')}
    ${kpiCard('Lucro estimado',`${Number(prof).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,`${margin}% margem`,'#1D9E75')}
    ${kpiCard('Ticket médio',`${Number(avg).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,`${tot} vendas`,'#1a1a1a')}
    ${kpiCard('Total vendas',String(tot),`${rev>0?Math.round(rev/tot):0} R$/venda`,'#1a1a1a')}
    ${kpiCard('Crescimento',growthStr,'vs período anterior',growthColor)}
  </div>


  <h3>Indicadores Chave</h3>
  <div style="padding:0 32px 16px;">
    <table style="border-collapse:collapse;width:100%;">
      <tbody>
        <tr style="background:#F8FAF9"><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Dias com venda</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${activeDays} dias</td></tr>
        <tr><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Média por dia ativo</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;color:#1D9E75;border-bottom:1px solid #E5EDE9;">${activeDays>0?Number(rev/activeDays).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—'}</td></tr>
        <tr style="background:#F8FAF9"><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Maior venda</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;color:#1D9E75;border-bottom:1px solid #E5EDE9;">${Number(maxSale||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>
        <tr><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Ticket médio</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${Number(avg).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>
        <tr style="background:#F8FAF9"><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Lucro estimado</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;color:#1D9E75;border-bottom:1px solid #E5EDE9;">${Number(prof).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>
        <tr><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Margem</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${margin}%</td></tr>
        <tr style="background:#F8FAF9"><td style="padding:9px 14px;font-size:12px;color:#555;">Taxa cancelamento</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;">0%</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Top Produtos</h3>
  <div style="padding:0 32px 20px;">
    <table><thead><tr><th>Rank</th><th>Produto</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Receita</th><th style="text-align:right;">Lucro Est.</th><th>Participação</th></tr></thead>
    <tbody>${prodRows}</tbody></table>
  </div>

  <h3>Formas de Pagamento</h3>
  <div style="padding:0 32px 20px;">
    <table><thead><tr><th>Forma</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Total</th><th style="text-align:right;">%</th></tr></thead>
    <tbody>${payRows}</tbody></table>
  </div>

  <div style="padding:14px 32px;background:#F8FAF9;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #E5EDE9;margin-top:20px;">
    <div style="font-size:11px;color:#888;">VendaPro - vendapro.com.br | Gerado automaticamente</div>
    <div style="font-size:11px;color:#1D9E75;font-weight:700;">${storeName}</div>
  </div>

  </body></html>`

  const w = window.open('','_blank')
  if(w){w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),600)}
}

export default function ReportsPage() {
  const now = new Date()
  const [tab, setTab] = useState("geral")
  const [from, setFrom] = useState(new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0])
  const [to, setTo] = useState(new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split("T")[0])
  const [data, setData] = useState<any>(null)
  const [prevData, setPrevData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)

  useEffect(()=>{
    api.get("/stores").then(r=>{ const s=Array.isArray(r.data)?r.data[0]:r.data; if(s) setStore(s) }).catch(()=>{})
  },[])

  useEffect(()=>{ load() },[from,to])

  async function load(){
    setLoading(true)
    try{
      const r = await api.get(`/reports/advanced?from=${from}&to=${to}`)
      setData(r.data)
      // Calcular período anterior com mesma duração
      const d1 = new Date(from), d2 = new Date(to)
      const diff = d2.getTime()-d1.getTime()
      const prevTo = new Date(d1.getTime()-1).toISOString().split("T")[0]
      const prevFrom = new Date(d1.getTime()-diff-86400000).toISOString().split("T")[0]
      const r2 = await api.get(`/reports/advanced?from=${prevFrom}&to=${prevTo}`)
      setPrevData(r2.data)
    }catch(e){console.error(e)}finally{setLoading(false)}
  }

  const revenue    = data?.totalRevenue||0
  const totalSales = data?.totalSales||0
  const avgTicket  = data?.avgTicket||0
  const profit     = data?.estimatedProfit||0
  const margin     = revenue>0?Math.round((profit/revenue)*100):0
  const products: any[]    = data?.topProducts||[]
  const payMethods: any[]  = data?.paymentMethods||[]
  const sellers: any[]     = data?.topSellers||[]
  const dailyChart: any[]  = data?.dailyChart||[]

  const prevRev    = prevData?.totalRevenue||0
  const prevSales  = prevData?.totalSales||0
  const prevTicket = prevData?.avgTicket||0
  const prevProfit = prevData?.estimatedProfit||0

  const growthRev   = pct(revenue, prevRev)
  const growthSales = pct(totalSales, prevSales)
  const growthTicket= pct(avgTicket, prevTicket)

  // Vendas por dia da semana
  const byWeekday = Array(7).fill(0)
  const byWeekdayRev = Array(7).fill(0)

  // Maior venda do período
  const maxSale = data?.maxSale||0
  const cancelRate = data?.cancelRate||0
  const activeDays = data?.activeDays||0

  const storeName = store?.name||"Minha Loja"

  const tabs = [["geral","Visão geral"],["produtos","Produtos"],["financeiro","Financeiro"],["vendedores","Vendedores"]]

  return (
    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .r-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--r);font-size:12px;font-weight:600;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;transition:var(--transition);}
        .r-btn:hover{border-color:var(--border-strong);background:var(--surface-2);}
        .r-btn-p{background:var(--brand);color:white;border-color:var(--brand);}
        .r-btn-p:hover{filter:brightness(1.1);}
        .r-kpi4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
        .r-kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;position:relative;overflow:hidden;transition:var(--transition);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--brand-glow) 8%,transparent),0 12px 28px -22px color-mix(in srgb,var(--brand) 50%,transparent);}
        .r-kpi:hover{border-color:var(--border-strong);transform:translateY(-2px);box-shadow:var(--shadow-md);}
        .r-kpi-l{font-size:11px;font-weight:600;color:var(--brand-glow);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;opacity:.7;}
        .r-kpi-v{font-family:var(--font-mono);font-size:clamp(18px,2vw,26px);font-weight:700;color:var(--text);letter-spacing:-.03em;line-height:1;}
        .r-kpi-d{font-size:11px;margin-top:6px;}
        .r-kpi-d.up{color:var(--success);}
        .r-kpi-d.dn{color:var(--danger);}
        .r-kpi-d.ne{color:var(--text-subtle);}
        .r-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:12px;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--brand-glow) 8%,transparent),0 12px 28px -22px color-mix(in srgb,var(--brand) 50%,transparent);}
        .r-card-h{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .r-card-t{font-size:13px;font-weight:600;color:var(--text);}
        .r-card-s{font-size:11px;color:var(--text-subtle);}
        .r-card-b{padding:14px 16px;}
        .r-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .r-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
        .r-tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:16px;overflow-x:auto;}
        .r-tab{padding:9px 16px;font-size:12px;color:var(--text-subtle);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;white-space:nowrap;transition:var(--transition);}
        .r-tab.on{color:var(--brand);border-bottom-color:var(--brand);font-weight:600;}
        .r-tab:hover{color:var(--text);}
        .r-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
        .r-lbl{font-size:11px;color:var(--text-subtle);width:70px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .r-track{flex:1;height:6px;background:var(--surface-3);border-radius:99px;overflow:hidden;}
        .r-fill{height:100%;border-radius:99px;background:var(--brand);}
        .r-val{font-size:11px;font-family:var(--font-mono);color:var(--text);width:50px;text-align:right;flex-shrink:0;}
        .r-kv{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);}
        .r-kv:last-child{border:none;}
        .r-kv-l{font-size:12px;color:var(--text-muted);}
        .r-kv-v{font-size:12px;font-weight:600;color:var(--text);}
        .r-alert{background:var(--surface-2);border-left:3px solid var(--brand);border-radius:0 var(--r) var(--r) 0;padding:10px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;}
        .r-alert-warn{border-left-color:var(--warning);}
        .r-alert-bad{border-left-color:var(--danger);}
        .r-alert-ok{border-left-color:var(--success);}
        .comp-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
        .comp-l{font-size:11px;color:var(--text-muted);width:64px;flex-shrink:0;}
        .comp-bar{flex:1;height:6px;background:var(--surface-3);border-radius:99px;overflow:hidden;}
        .comp-fill{height:100%;border-radius:99px;background:var(--brand);}
        .comp-v{font-size:11px;font-family:var(--font-mono);color:var(--text);width:72px;text-align:right;flex-shrink:0;}
        .comp-c{font-size:10px;width:38px;text-align:right;flex-shrink:0;}
        .pay-row{display:flex;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);}
        .pay-row:last-child{border:none;}
        .pay-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
        .pay-lbl{font-size:12px;color:var(--text-muted);flex:1;margin-left:8px;}
        .pay-val{font-size:12px;font-family:var(--font-mono);color:var(--text);}
        .pay-pct{font-size:11px;color:var(--text-subtle);width:36px;text-align:right;}
        @media(max-width:1200px){.r-kpi4{grid-template-columns:repeat(2,1fr);} .r-g2{grid-template-columns:1fr;} .r-g3{grid-template-columns:1fr;}}
        @media(max-width:640px){.r-kpi4{grid-template-columns:1fr 1fr!important;}}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(20px,3vw,28px)",fontWeight:700,letterSpacing:"-.03em",color:"var(--text)"}}>Relatórios</h1>
          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>Análise completa do negócio</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button className="r-btn" onClick={()=>{
            const rows = products.map((p:any)=>[p.name,p.quantity,Number(p.revenue).toFixed(2),(Number(p.revenue)*margin/100).toFixed(2)])
            const lines = [['Produto','Qtd','Receita','Lucro Est.'],...rows].map(r=>r.join(';')).join('\n')
            const blob = new Blob(['\uFEFF'+lines],{type:'text/csv;charset=utf-8'})
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href=url; a.download=`relatorio-${from}-${to}.csv`; a.click()
            URL.revokeObjectURL(url)
          }}>Excel</button>
          <button className="r-btn r-btn-p" onClick={()=>exportRepPDF(data,prevData,from,to,storeName,margin)}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
            Exportar PDF completo
          </button>
        </div>
      </div>

      {/* FILTRO DE DATAS */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"8px 12px",fontSize:13,color:"var(--text)",outline:"none",minWidth:140}} type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
        <span style={{color:"var(--text-subtle)",fontSize:13}}>até</span>
        <input style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"8px 12px",fontSize:13,color:"var(--text)",outline:"none",minWidth:140}} type="date" value={to} onChange={e=>setTo(e.target.value)}/>
        <span style={{fontSize:12,color:"var(--text-subtle)"}}>
          {prevRev>0 && `Comparando com período anterior`}
        </span>
      </div>

      {/* KPIs */}
      <div className="r-kpi4">
        <div className="r-kpi">
          <div className="r-kpi-l">Faturamento</div>
          <div className="r-kpi-v">{BRL(revenue)}</div>
          <div className={`r-kpi-d ${growthRev>=0?"up":"dn"}`}>
            {prevRev>0 ? `${growthRev>=0?'▲':'▼'} ${Math.abs(growthRev)}% vs anterior` : 'Sem comparativo'}
          </div>
          <div style={{position:"absolute",bottom:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"var(--brand-glow)",filter:"blur(20px)",pointerEvents:"none"}}/>
        </div>
        <div className="r-kpi">
          <div className="r-kpi-l">Lucro estimado</div>
          <div className="r-kpi-v">{BRL(profit)}</div>
          <div className="r-kpi-d up">{margin}% margem</div>
          <div style={{position:"absolute",bottom:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"var(--brand-glow)",filter:"blur(20px)",pointerEvents:"none"}}/>
        </div>
        <div className="r-kpi">
          <div className="r-kpi-l">Ticket médio</div>
          <div className="r-kpi-v">{BRL(avgTicket)}</div>
          <div className={`r-kpi-d ${growthTicket>=0?"up":"dn"}`}>
            {prevTicket>0 ? `${growthTicket>=0?'▲':'▼'} ${Math.abs(growthTicket)}% vs anterior` : 'Sem comparativo'}
          </div>
          <div style={{position:"absolute",bottom:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"var(--brand-glow)",filter:"blur(20px)",pointerEvents:"none"}}/>
        </div>
        <div className="r-kpi">
          <div className="r-kpi-l">Total vendas</div>
          <div className="r-kpi-v">{totalSales}</div>
          <div className={`r-kpi-d ${growthSales>=0?"up":"dn"}`}>
            {prevSales>0 ? `${growthSales>=0?'▲':'▼'} ${Math.abs(growthSales)}% vs anterior` : 'Sem comparativo'}
          </div>
          <div style={{position:"absolute",bottom:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"var(--brand-glow)",filter:"blur(20px)",pointerEvents:"none"}}/>
        </div>
      </div>

      {/* TABS */}
      <div className="r-tabs">
        {tabs.map(([id,lbl])=>(
          <div key={id} className={`r-tab${tab===id?" on":""}`} onClick={()=>setTab(id)}>{lbl}</div>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>
          <div style={{width:36,height:36,border:"3px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
          Carregando...
        </div>
      ) : (
        <>
          {/* ABA VISÃO GERAL */}
          {tab==="geral" && (
            <>
              <div className="r-g2" style={{marginBottom:12}}>
                {/* Comparativo mensal */}
                <div className="r-card">
                  <div className="r-card-h">
                    <div className="r-card-t">Comparativo de períodos</div>
                    <div className="r-card-s">{prevRev>0?"vs período anterior":"período atual"}</div>
                  </div>
                  <div className="r-card-b">
                    <div className="comp-row">
                      <div className="comp-l">Atual</div>
                      <div className="comp-bar"><div className="comp-fill" style={{width:"100%"}}/></div>
                      <div className="comp-v">{BRLshort(revenue)}</div>
                      <div className={`comp-c ${growthRev>=0?"r-kpi-d up":"r-kpi-d dn"}`} style={{fontSize:10,color:growthRev>=0?"var(--success)":"var(--danger)"}}>{prevRev>0?`${growthRev>=0?"+":""}${growthRev}%`:"—"}</div>
                    </div>
                    <div className="comp-row">
                      <div className="comp-l">Anterior</div>
                      <div className="comp-bar"><div className="comp-fill" style={{width:`${revenue>0?Math.min(Math.round(prevRev/revenue*100),100):0}%`,opacity:0.45}}/></div>
                      <div className="comp-v">{BRLshort(prevRev)}</div>
                      <div className="comp-c" style={{fontSize:10,color:"var(--text-subtle)"}}>base</div>
                    </div>
                    <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid var(--border)",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      <div>
                        <div style={{fontSize:10,color:"var(--text-subtle)",marginBottom:3}}>Vendas</div>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{totalSales} <span style={{fontSize:10,color:growthSales>=0?"var(--success)":"var(--danger)"}}>{prevSales>0?`${growthSales>=0?"+":""}${growthSales}%`:""}</span></div>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:"var(--text-subtle)",marginBottom:3}}>Ticket</div>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{BRLshort(avgTicket)}</div>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:"var(--text-subtle)",marginBottom:3}}>Margem</div>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--success)"}}>{margin}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicadores chave */}
                <div className="r-card">
                  <div className="r-card-h"><div className="r-card-t">Indicadores chave</div></div>
                  <div className="r-card-b">
                    <div className="r-kv">
                      <span className="r-kv-l">Dias com venda</span>
                      <span className="r-kv-v">{activeDays || (dailyChart.filter((d:any)=>d.value>0).length)} dias</span>
                    </div>
                    <div className="r-kv">
                      <span className="r-kv-l">Média por dia ativo</span>
                      <span className="r-kv-v">{BRL(activeDays>0?revenue/activeDays:(dailyChart.filter((d:any)=>d.value>0).length>0?revenue/dailyChart.filter((d:any)=>d.value>0).length:0))}</span>
                    </div>
                    <div className="r-kv">
                      <span className="r-kv-l">Maior venda</span>
                      <span className="r-kv-v" style={{color:"var(--success)"}}>{BRL(maxSale||0)}</span>
                    </div>
                    <div className="r-kv">
                      <span className="r-kv-l">Taxa cancelamento</span>
                      <span className="r-kv-v" style={{color:(cancelRate||0)>10?"var(--danger)":"var(--text)"}}>{cancelRate||0}%</span>
                    </div>
                    <div className="r-kv">
                      <span className="r-kv-l">Lucro estimado</span>
                      <span className="r-kv-v" style={{color:"var(--success)"}}>{BRL(profit)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formas de pagamento + Alertas */}
              <div className="r-g2">
                <div className="r-card">
                  <div className="r-card-h"><div className="r-card-t">Formas de pagamento</div><div className="r-card-s">{totalSales} vendas</div></div>
                  <div className="r-card-b">
                    {payMethods.length===0 ? <div style={{color:"var(--text-subtle)",fontSize:13}}>Sem dados.</div>
                    : payMethods.map((p:any,i:number)=>{
                      const payPct = revenue>0?Math.round((Number(p.total)/revenue)*100):0
                      const dots = ["var(--brand)","#f59e0b","#8b5cf6","#6b7280","#ef4444"]
                      return (
                        <div key={i} className="pay-row">
                          <div className="pay-dot" style={{background:dots[i]||"var(--brand)"}}/>
                          <div className="pay-lbl">{PAY[p.paymentMethod]||p.paymentMethod}</div>
                          <div className="pay-val">{BRL(Number(p.total))}</div>
                          <div className="pay-pct">{payPct}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="r-card">
                  <div className="r-card-h"><div className="r-card-t">Alertas & insights</div></div>
                  <div className="r-card-b">
                    {growthRev>=10 && (
                      <div className="r-alert r-alert-ok">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth={2}><path d="M20 6L9 17l-5-5"/></svg>
                        <div style={{fontSize:12,color:"var(--text)"}}>Faturamento cresceu <b>{growthRev}%</b> vs período anterior</div>
                      </div>
                    )}
                    {growthRev<0 && (
                      <div className="r-alert r-alert-bad">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2}><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                        <div style={{fontSize:12,color:"var(--text)"}}>Faturamento caiu <b>{Math.abs(growthRev)}%</b> vs período anterior</div>
                      </div>
                    )}
                    {growthTicket<-5 && (
                      <div className="r-alert r-alert-warn">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth={2}><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                        <div style={{fontSize:12,color:"var(--text)"}}>Ticket médio caiu <b>{Math.abs(growthTicket)}%</b> — revisar preços</div>
                      </div>
                    )}
                    {margin<15 && (
                      <div className="r-alert r-alert-warn">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth={2}><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                        <div style={{fontSize:12,color:"var(--text)"}}>Margem baixa <b>{margin}%</b> — revisar custos</div>
                      </div>
                    )}
                    {totalSales===0 && (
                      <div className="r-alert r-alert-bad">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                        <div style={{fontSize:12,color:"var(--text)"}}>Sem vendas no período selecionado</div>
                      </div>
                    )}
                    {totalSales>0 && margin>=20 && growthRev>=0 && (
                      <div className="r-alert r-alert-ok">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                        <div style={{fontSize:12,color:"var(--text)"}}>Negócio saudável — margem <b>{margin}%</b> e crescimento positivo</div>
                      </div>
                    )}
                    {totalSales>0 && (
                      <div className="r-alert">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <div style={{fontSize:12,color:"var(--text)"}}>Média por venda: <b>{BRL(revenue/totalSales)}</b></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ABA PRODUTOS */}
          {tab==="produtos" && (
            <div className="r-card">
              <div className="r-card-h">
                <div className="r-card-t">Top produtos</div>
                <div className="r-card-s">{products.length} produtos no período</div>
              </div>
              <div style={{padding:"10px 16px"}}>
                {products.length===0 ? <div style={{color:"var(--text-subtle)",fontSize:13,padding:"20px 0",textAlign:"center"}}>Sem dados no período.</div>
                : products.map((p:any,i:number)=>{
                  const maxRev2 = products[0]?.revenue||1
                  const barW = Math.round((Number(p.revenue)/Number(maxRev2))*100)
                  const lucro = Number(p.revenue)*margin/100
                  return (
                    <div key={i} style={{padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:11,color:"var(--text-subtle)",fontWeight:700,width:20}}>#{i+1}</span>
                          <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{p.name}</span>
                        </div>
                        <div style={{display:"flex",gap:16,alignItems:"center"}}>
                          <span style={{fontSize:11,color:"var(--text-subtle)"}}>{p.quantity} un.</span>
                          <span style={{fontSize:13,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--text)"}}>{BRL(Number(p.revenue))}</span>
                          <span style={{fontSize:11,color:"var(--success)",fontFamily:"var(--font-mono)"}}>+{BRL(lucro)} lucro</span>
                        </div>
                      </div>
                      <div style={{height:5,background:"var(--surface-3)",borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${barW}%`,background:"var(--brand)",borderRadius:99}}/>
                      </div>
                      <div style={{fontSize:10,color:"var(--text-subtle)",marginTop:3,textAlign:"right"}}>{barW}% do faturamento</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ABA FINANCEIRO */}
          {tab==="financeiro" && (
            <div className="r-g2">
              <div className="r-card">
                <div className="r-card-h"><div className="r-card-t">Resumo financeiro</div></div>
                <div className="r-card-b">
                  <div className="r-kv"><span className="r-kv-l">Faturamento bruto</span><span className="r-kv-v">{BRL(revenue)}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Lucro estimado</span><span className="r-kv-v" style={{color:"var(--success)"}}>{BRL(profit)}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Custo estimado</span><span className="r-kv-v" style={{color:"var(--danger)"}}>{BRL(revenue-profit)}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Margem de lucro</span><span className="r-kv-v" style={{color:"var(--success)"}}>{margin}%</span></div>
                  <div className="r-kv"><span className="r-kv-l">Total de vendas</span><span className="r-kv-v">{totalSales}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Ticket médio</span><span className="r-kv-v">{BRL(avgTicket)}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Receita/produto</span><span className="r-kv-v">{products.length>0?BRL(revenue/products.reduce((a:any,p:any)=>a+p.quantity,0)):"—"}</span></div>
                </div>
              </div>
              <div className="r-card">
                <div className="r-card-h"><div className="r-card-t">Pagamentos detalhados</div></div>
                <div className="r-card-b">
                  {payMethods.length===0 ? <div style={{color:"var(--text-subtle)",fontSize:13}}>Sem dados.</div>
                  : payMethods.map((p:any,i:number)=>{
                    const payPct = revenue>0?Math.round((Number(p.total)/revenue)*100):0
                    return (
                      <div key={i} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:12,color:"var(--text)"}}>{PAY[p.paymentMethod]||p.paymentMethod}</span>
                          <div style={{display:"flex",gap:12,alignItems:"center"}}>
                            <span style={{fontSize:11,color:"var(--text-subtle)"}}>{p.count} vendas</span>
                            <span style={{fontSize:12,fontWeight:600,fontFamily:"var(--font-mono)"}}>{BRL(Number(p.total))}</span>
                          </div>
                        </div>
                        <div style={{height:5,background:"var(--surface-3)",borderRadius:99,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${payPct}%`,background:"var(--brand)",borderRadius:99}}/>
                        </div>
                        <div style={{fontSize:10,color:"var(--text-subtle)",marginTop:2,textAlign:"right"}}>{payPct}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ABA VENDEDORES */}
          {tab==="vendedores" && (
            <div className="r-card">
              <div className="r-card-h"><div className="r-card-t">Ranking vendedores</div><div className="r-card-s">período selecionado</div></div>
              <div style={{padding:"10px 16px"}}>
                {sellers.length===0 ? <div style={{color:"var(--text-subtle)",fontSize:13,padding:"20px 0",textAlign:"center"}}>Sem dados no período.</div>
                : sellers.map((s:any,i:number)=>{
                  const maxRevS = sellers[0]?.revenue||1
                  const barW = Math.round((Number(s.revenue)/Number(maxRevS))*100)
                  const init = (s.sellerName||s.name||"?").split(" ").map((x:string)=>x[0]).slice(0,2).join("").toUpperCase()
                  const bgs = ["var(--brand)","var(--brand-mid)","var(--surface-3)"]
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                      <span style={{fontSize:11,fontWeight:700,color:"var(--text-subtle)",width:20}}>#{i+1}</span>
                      <div style={{width:36,height:36,borderRadius:"50%",background:bgs[i]||"var(--surface-3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"white",flexShrink:0}}>{init}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:4}}>{s.sellerName||s.name}</div>
                        <div style={{height:5,background:"var(--surface-3)",borderRadius:99,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${barW}%`,background:"var(--brand)",borderRadius:99}}/>
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--text)"}}>{BRL(Number(s.revenue))}</div>
                        <div style={{fontSize:11,color:"var(--text-subtle)",marginTop:2}}>{s.count} vendas</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
