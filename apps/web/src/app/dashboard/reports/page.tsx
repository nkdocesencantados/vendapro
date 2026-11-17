"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { AlertCircle, AlertTriangle, BarChart3, CheckCircle2, Download, FileText, Info, TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }
function pct(a:number,b:number){ if(!b) return 0; return Math.round(((a-b)/b)*100) }

const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"]
const PAY: Record<string,string> = {cash:"Dinheiro",pix:"PIX",credit_card:"Credito",debit_card:"Debito"}

function exportRepPDF(d:any, d2:any, from:string, to:string, storeName:string, margin:number, cancelRate:number=0, sellerRanking:any[]=[]) {
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
      <td style="padding:10px 14px;text-align:right;font-weight:600;color:#1F8A47;font-size:12px;border-bottom:1px solid #E5EDE9;">${Number(lucro).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;">
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="flex:1;height:6px;background:#E5EDE9;border-radius:999px;overflow:hidden;">
            <div style="height:6px;background:#1F8A47;border-radius:999px;width:${pct2}%"></div>
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
      <td style="padding:8px 14px;text-align:center;font-size:12px;border-bottom:1px solid #E5EDE9;">${p.count||0}</td>
      <td style="padding:8px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${Number(p.total).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
      <td style="padding:8px 14px;text-align:right;font-size:12px;color:#888;border-bottom:1px solid #E5EDE9;">${payPct}%</td>
    </tr>`
  }).join('')

  const growthPct = pct(rev, prevRev)
  const growthStr = prevRev>0 ? (growthPct>=0?`+${growthPct}%`:`${growthPct}%`) : 'N/A'
  const growthColor = growthPct>=0?'#1F8A47':'#ef4444'

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Relatorio VendaPro</title>
  <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:13px;}
  h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#555;margin:20px 32px 10px;padding-bottom:8px;border-bottom:2px solid #E5EDE9;}
  table{width:100%;border-collapse:collapse;}th{background:#1F8A47;color:white;padding:10px 14px;text-align:left;font-size:11px;font-weight:700;}
  </style></head><body>

  <div style="background:#04130F;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:40px;height:40px;background:#1F8A47;border-radius:10px;display:flex;align-items:center;justify-content:center;">
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
    ${kpiCard('Faturamento',`${Number(rev).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,`vs anterior: ${growthStr}`,growthPct>=0?'#1F8A47':'#ef4444')}
    ${kpiCard('Lucro estimado',`${Number(prof).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,`${margin}% margem`,'#1F8A47')}
    ${kpiCard('Ticket médio',`${Number(avg).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,`${tot} vendas`,'#1a1a1a')}
    ${kpiCard('Total vendas',String(tot),`${rev>0?Math.round(rev/tot):0} R$/venda`,'#1a1a1a')}
    ${kpiCard('Crescimento',growthStr,'vs período anterior',growthColor)}
  </div>


  <h3>Indicadores Chave</h3>
  <div style="padding:0 32px 16px;">
    <table style="border-collapse:collapse;width:100%;">
      <tbody>
        <tr style="background:#F8FAF9"><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Dias com venda</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${activeDays} dias</td></tr>
        <tr><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Média por dia ativo</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;color:#1F8A47;border-bottom:1px solid #E5EDE9;">${activeDays>0?Number(rev/activeDays).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—'}</td></tr>
        <tr style="background:#F8FAF9"><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Maior venda</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;color:#1F8A47;border-bottom:1px solid #E5EDE9;">${Number(maxSale||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>
        <tr><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Ticket médio</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${Number(avg).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>
        <tr style="background:#F8FAF9"><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Lucro estimado</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;color:#1F8A47;border-bottom:1px solid #E5EDE9;">${Number(prof).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>
        <tr><td style="padding:9px 14px;font-size:12px;color:#555;border-bottom:1px solid #E5EDE9;">Margem</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${margin}%</td></tr>
        <tr style="background:#F8FAF9"><td style="padding:9px 14px;font-size:12px;color:#555;">Taxa cancelamento</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;color:${cancelRate>10?'#ef4444':'#1a1a1a'}">${cancelRate}%</td></tr>
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
    <div style="font-size:11px;color:#1F8A47;font-weight:700;">${storeName}</div>
  </div>

  </body></html>`

  // Inserir tabela de vendedores antes do fechamento
  const sellerRows = sellerRanking.map((s:any, i:number) => {
    const bg = i%2===0?'#fff':'#F9FBFA'
    return `<tr style="background:${bg}"><td style="padding:9px 14px;color:#888;font-size:12px;border-bottom:1px solid #E5EDE9;">#${i+1}</td><td style="padding:9px 14px;font-weight:600;font-size:12px;border-bottom:1px solid #E5EDE9;">${s.name||s.sellerName||'—'}</td><td style="padding:9px 14px;text-align:center;font-size:12px;border-bottom:1px solid #E5EDE9;">${s.count||s.salesCount||0}</td><td style="padding:9px 14px;text-align:right;font-weight:600;font-size:12px;color:#1F8A47;border-bottom:1px solid #E5EDE9;">${Number(s.total||s.revenue||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>`
  }).join('')

  const sellersSection = sellerRanking.length > 0 ? `<h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#555;margin:20px 32px 10px;padding-bottom:8px;border-bottom:2px solid #E5EDE9;">Vendedores</h3><div style="padding:0 32px 20px;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#1F8A47;"><th style="color:white;padding:9px 14px;text-align:left;font-size:11px;">Rank</th><th style="color:white;padding:9px 14px;text-align:left;font-size:11px;">Vendedor</th><th style="color:white;padding:9px 14px;text-align:center;font-size:11px;">Vendas</th><th style="color:white;padding:9px 14px;text-align:right;font-size:11px;">Receita</th></tr></thead><tbody>${sellerRows}</tbody></table></div>` : ''

  const finalHtml = html.replace('</body></html>', sellersSection + '</body></html>')
  const w = window.open('','_blank')
  if(w){w.document.write(finalHtml);w.document.close();w.focus();setTimeout(()=>w.print(),600)}
}


// Estilos de página no padrão aprovado (cartões 16px, rótulos uppercase, valores mono). Só tokens de globals.css.
const PG_CSS = `
  .pg{padding:clamp(16px,3vw,32px);max-width:1440px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
  .pg-head{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px}
  .pg-title{margin:0;font-size:28px;font-weight:600;letter-spacing:-0.6px;line-height:1.15;color:var(--text)}
  .pg-sub{font-size:13px;color:var(--text-muted);margin-top:4px}
  .pg-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-left:auto}
  .pg-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(170px,100%),1fr));gap:16px}
  .pg-kpi{padding:18px;border-radius:16px;border:1px solid var(--border);background:var(--surface);display:flex;flex-direction:column;gap:10px;min-width:0}
  .pg-kpi-l{font-size:12.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em}
  .pg-kpi-v{font-family:var(--font-mono);font-size:clamp(18px,4.6vw,28px);font-weight:500;letter-spacing:-0.02em;line-height:1.1;color:var(--text);overflow-wrap:anywhere}
  .pg-kpi-s{font-size:12.5px;color:var(--text-muted)}
  .pg-card{border-radius:16px;border:1px solid var(--border);background:var(--surface);min-width:0;overflow:hidden}
  .pg-card-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;padding:16px 20px}
  .pg-card-t{margin:0;font-size:16px;font-weight:600;color:var(--text)}
  .pg-card-s{font-size:13px;color:var(--text-muted);margin-left:auto}
  .pg-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .pg-tbl{width:100%;border-collapse:collapse;font-size:14px}
  .pg-tbl th{padding:10px 20px;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);text-align:left;white-space:nowrap}
  .pg-tbl td{padding:12px 20px;border-top:1px solid var(--border);color:var(--text);vertical-align:middle}
  .pg-tbl tbody tr:hover td{background:var(--surface-2)}
  .pg-num{font-family:var(--font-mono);letter-spacing:-0.02em;white-space:nowrap}
  .pg-r{text-align:right!important}
  .pg-muted{color:var(--text-muted)!important}
  .pg-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:3px 8px;border-radius:6px;white-space:nowrap}
  .pg-chip.ok{background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--brand-soft)}
  .pg-chip.warn{background:var(--warning-bg);color:var(--warning)}
  .pg-chip.bad{background:var(--danger-bg);color:var(--danger)}
  .pg-chip.grey{background:var(--surface-2);color:var(--text-muted)}
  .pg-empty{padding:48px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
  .pg-empty-i{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--brand) 12%,transparent);color:var(--brand-soft);margin-bottom:4px}
  .pg-empty-t{font-size:15px;font-weight:600;color:var(--text)}
  .pg-empty-s{font-size:13px;line-height:1.5;color:var(--text-muted);max-width:44ch;margin-bottom:8px}
  .pg-seg{display:inline-flex;flex-wrap:wrap;gap:4px;padding:4px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
  .pg-seg button{min-height:36px;padding:0 14px;border:0;border-radius:8px;background:transparent;color:var(--text-muted);font:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:var(--transition)}
  .pg-seg button:hover{color:var(--text)}
  .pg-seg button[aria-pressed="true"],.pg-seg button[aria-selected="true"]{background:color-mix(in srgb,var(--brand) 16%,transparent);color:var(--text);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 30%,transparent)}
  .pg button:focus-visible,.pg select:focus-visible,.pg input:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
  .pg .vp-modal-head h2{margin:0}
  .pg-x{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer}
  .pg-x:hover{color:var(--text);background:var(--surface-2)}
  @media(max-width:640px){.pg-actions{margin-left:0;width:100%}.pg-tbl th,.pg-tbl td{padding-left:16px;padding-right:16px}.pg-card-h{padding:14px 16px}}
`

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
  const sellers: any[]     = data?.sellerRanking||[]
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
  const activeDays = data?.activeDays || (data?.dailyChart||[]).filter((d:any)=>d.value>0).length || 0

  const storeName = store?.name||"Minha Loja"

  const tabs = [["geral","Visão geral"],["produtos","Produtos"],["financeiro","Financeiro"],["vendedores","Vendedores"]]

  // A API devolve os dias do mais recente para o mais antigo; o gráfico lê da esquerda (antigo) para a direita.
  const chartData = [...dailyChart].reverse()
  const delta = (g:number, has:boolean) => has
    ? <span className="pg-kpi-s" style={{color:g>=0?"var(--brand-soft)":"var(--danger)"}}>{g>=0?"+":"−"}{Math.abs(g)}% vs período anterior</span>
    : <span className="pg-kpi-s">Sem comparativo</span>
  const PAY_COLORS = ["var(--brand-soft)","var(--brand)","var(--warning)","var(--text-muted)","var(--info)"]
  const Empty = ({t,s}:{t:string,s:string}) => (
    <div className="pg-empty" style={{padding:"32px 20px"}}>
      <div className="pg-empty-i"><BarChart3 size={22} aria-hidden/></div>
      <div className="pg-empty-t">{t}</div>
      <div className="pg-empty-s">{s}</div>
    </div>
  )

  return (
    <div className="pg">
      <style dangerouslySetInnerHTML={{ __html: PG_CSS + `
        .r-g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}
        .r-b{padding:0 20px 20px}
        .r-kv{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--border);font-size:14px}
        .r-kv:first-child{border-top:0}
        .r-kv-l{color:var(--text-muted)}
        .r-kv-v{font-family:var(--font-mono);letter-spacing:-0.02em;color:var(--text);white-space:nowrap}
        .r-bar{height:6px;border-radius:6px;background:var(--surface-2);overflow:hidden}
        .r-bar span{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,var(--brand-mid),var(--brand-soft))}
        .r-alert{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:12px;background:var(--surface-2);font-size:13px;line-height:1.45;color:var(--text)}
        .r-alert+.r-alert{margin-top:8px}
        .r-alert svg{flex-shrink:0;margin-top:1px}
        .r-alert.ok{background:color-mix(in srgb,var(--brand) 10%,transparent)}
        .r-alert.warn{background:var(--warning-bg)}
        .r-alert.bad{background:var(--danger-bg)}
        .r-date{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .r-date .vp-input{width:auto;min-width:150px;min-height:38px;color-scheme:dark}
        .r-av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:600;flex-shrink:0;background:color-mix(in srgb,var(--brand) 14%,var(--surface-2));color:var(--brand-soft)}
        @media(max-width:960px){.r-g2{grid-template-columns:1fr}}
      ` }} />

      {/* HEADER */}
      <header className="pg-head">
        <div>
          <h1 className="pg-title">Relatórios</h1>
          <div className="pg-sub">{storeName} · desempenho de vendas, lucro e pagamentos no período</div>
        </div>
        <div className="pg-actions">
          <div className="r-date">
            <input className="vp-input" type="date" aria-label="Data inicial" value={from} onChange={e=>setFrom(e.target.value)}/>
            <span style={{color:"var(--text-muted)",fontSize:13}}>até</span>
            <input className="vp-input" type="date" aria-label="Data final" value={to} onChange={e=>setTo(e.target.value)}/>
          </div>
          <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>{
            const rows = products.map((p:any)=>[p.name,p.quantity,Number(p.revenue).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),Number(p.revenue*margin/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})])
            const lines = [['Produto','Qtd','Receita','Lucro Est.'],...rows].map(r=>r.join(';')).join('\n')
            const blob = new Blob(['﻿'+lines],{type:'text/csv;charset=utf-8'})
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href=url; a.download=`relatorio-${from}-${to}.csv`; a.click()
            URL.revokeObjectURL(url)
          }}><Download size={14} aria-hidden/>Exportar Excel</button>
          <button className="vp-btn vp-btn-primary" onClick={()=>exportRepPDF(data,prevData,from,to,storeName,margin,data?.cancelRate||0,data?.sellerRanking||[])}>
            <FileText size={16} aria-hidden/>Exportar PDF
          </button>
        </div>
      </header>

      {/* KPIs */}
      <section className="pg-kpis" aria-label="Indicadores do período">
        <div className="pg-kpi"><span className="pg-kpi-l">Faturamento</span><span className="pg-kpi-v">{loading?"—":BRL(revenue)}</span>{delta(growthRev,prevRev>0)}</div>
        <div className="pg-kpi"><span className="pg-kpi-l">Lucro estimado</span><span className="pg-kpi-v">{loading?"—":BRL(profit)}</span><span className="pg-kpi-s">{margin}% de margem</span></div>
        <div className="pg-kpi"><span className="pg-kpi-l">Ticket médio</span><span className="pg-kpi-v">{loading?"—":BRL(avgTicket)}</span>{delta(growthTicket,prevTicket>0)}</div>
        <div className="pg-kpi"><span className="pg-kpi-l">Total de vendas</span><span className="pg-kpi-v">{loading?"—":totalSales}</span>{delta(growthSales,prevSales>0)}</div>
      </section>

      {/* TABS */}
      <div className="pg-seg" role="tablist" aria-label="Seções do relatório" style={{alignSelf:"flex-start",maxWidth:"100%"}}>
        {tabs.map(([id,lbl])=>(
          <button key={id} type="button" role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {loading ? (
        <div className="r-g2" aria-busy="true" aria-label="Carregando relatório">
          <div className="vp-skeleton" style={{height:280,borderRadius:16}}/>
          <div className="vp-skeleton" style={{height:280,borderRadius:16}}/>
        </div>
      ) : (
        <>
          {/* ABA VISÃO GERAL */}
          {tab==="geral" && (
            <>
              <section className="pg-card">
                <div className="pg-card-h">
                  <h2 className="pg-card-t">Faturamento por dia</h2>
                  <span className="pg-card-s pg-num" style={{color:"var(--brand-soft)"}}>{BRL(revenue)}</span>
                </div>
                {chartData.length===0 ? (
                  <Empty t="Sem vendas no período" s="Escolha outro intervalo de datas ou registre vendas para ver a evolução diária."/>
                ) : (
                  <div style={{height:240,padding:"0 12px 16px 0"}} role="img" aria-label={`Gráfico de faturamento diário com ${chartData.length} dias`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{top:8,right:8,left:8,bottom:0}}>
                        <defs>
                          <linearGradient id="repArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="var(--brand)" stopOpacity={0.45}/>
                            <stop offset="1" stopColor="var(--brand)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false}/>
                        <XAxis dataKey="day" tick={{fill:"var(--text-muted)",fontSize:12}} axisLine={false} tickLine={false} minTickGap={16}/>
                        <YAxis tick={{fill:"var(--text-muted)",fontSize:12}} axisLine={false} tickLine={false} width={64} tickFormatter={(v:number)=>BRLshort(v)}/>
                        <Tooltip
                          cursor={{stroke:"var(--border-strong)"}}
                          contentStyle={{background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:12,color:"var(--text)",fontSize:13}}
                          labelStyle={{color:"var(--text-muted)"}}
                          formatter={(v:any,_n:any,item:any)=>[`${BRL(Number(v))} · ${item?.payload?.count||0} vendas`,"Faturamento"]}
                        />
                        <Area type="monotone" dataKey="value" stroke="var(--brand-soft)" strokeWidth={2.5} fill="url(#repArea)" activeDot={{r:5,fill:"var(--brand-soft)",stroke:"var(--bg)"}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <div className="r-g2">
                {/* Comparativo */}
                <section className="pg-card">
                  <div className="pg-card-h">
                    <h2 className="pg-card-t">Comparativo de períodos</h2>
                    <span className="pg-card-s">{prevRev>0?"vs período anterior":"período atual"}</span>
                  </div>
                  <div className="r-b" style={{display:"flex",flexDirection:"column",gap:14}}>
                    {[["Atual",revenue,100,growthRev],["Anterior",prevRev,revenue>0?Math.min(Math.round(prevRev/revenue*100),100):0,null]].map(([l,v,w,g])=>(
                      <div key={l as string}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:13,marginBottom:6}}>
                          <span style={{color:"var(--text-muted)"}}>{l}</span>
                          <span className="pg-num" style={{color:"var(--text)"}}>
                            {BRL(v as number)}
                            {g!==null && prevRev>0 && <span style={{marginLeft:8,color:(g as number)>=0?"var(--brand-soft)":"var(--danger)"}}>{(g as number)>=0?"+":""}{g}%</span>}
                          </span>
                        </div>
                        <div className="r-bar"><span style={{width:`${w}%`,opacity:g===null?0.5:1}}/></div>
                      </div>
                    ))}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12,paddingTop:14,borderTop:"1px solid var(--border)"}}>
                      {[["Vendas",String(totalSales)],["Ticket",BRLshort(avgTicket)],["Margem",`${margin}%`]].map(([l,v])=>(
                        <div key={l}>
                          <div className="pg-kpi-l" style={{fontSize:12}}>{l}</div>
                          <div className="pg-num" style={{fontSize:16,color:"var(--text)",marginTop:4}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Indicadores chave */}
                <section className="pg-card">
                  <div className="pg-card-h"><h2 className="pg-card-t">Indicadores chave</h2></div>
                  <div className="r-b">
                    <div className="r-kv"><span className="r-kv-l">Dias com venda</span><span className="r-kv-v">{activeDays || (dailyChart.filter((d:any)=>d.value>0).length)} dias</span></div>
                    <div className="r-kv"><span className="r-kv-l">Média por dia ativo</span><span className="r-kv-v">{BRL(activeDays>0?revenue/activeDays:(dailyChart.filter((d:any)=>d.value>0).length>0?revenue/dailyChart.filter((d:any)=>d.value>0).length:0))}</span></div>
                    <div className="r-kv"><span className="r-kv-l">Maior venda</span><span className="r-kv-v" style={{color:"var(--brand-soft)"}}>{BRL(maxSale||0)}</span></div>
                    <div className="r-kv"><span className="r-kv-l">Taxa de cancelamento</span><span className="r-kv-v" style={{color:(cancelRate||0)>10?"var(--danger)":undefined}}>{cancelRate||0}%</span></div>
                    <div className="r-kv"><span className="r-kv-l">Lucro estimado</span><span className="r-kv-v" style={{color:"var(--brand-soft)"}}>{BRL(profit)}</span></div>
                  </div>
                </section>
              </div>

              <div className="r-g2">
                <section className="pg-card">
                  <div className="pg-card-h"><h2 className="pg-card-t">Formas de pagamento</h2><span className="pg-card-s">{totalSales} vendas</span></div>
                  <div className="r-b">
                    {payMethods.length===0 ? <div style={{color:"var(--text-muted)",fontSize:13}}>Nenhum pagamento registrado no período.</div>
                    : payMethods.map((p:any,i:number)=>{
                      const payPct = revenue>0?Math.round((Number(p.total)/revenue)*100):0
                      return (
                        <div key={i} className="r-kv" style={{alignItems:"center"}}>
                          <span style={{display:"flex",alignItems:"center",gap:10,color:"var(--text)"}}><span style={{width:8,height:8,borderRadius:"50%",background:PAY_COLORS[i]||"var(--brand)"}}/>{PAY[p.paymentMethod]||p.paymentMethod}</span>
                          <span className="r-kv-v">{BRL(Number(p.total))} <span className="pg-muted" style={{display:"inline-block",minWidth:40,textAlign:"right"}}>{payPct}%</span></span>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section className="pg-card">
                  <div className="pg-card-h"><h2 className="pg-card-t">Alertas e insights</h2></div>
                  <div className="r-b">
                    {growthRev>=10 && (
                      <div className="r-alert ok"><TrendingUp size={16} color="var(--brand-soft)" aria-hidden/><div>Faturamento cresceu <b>{growthRev}%</b> vs período anterior</div></div>
                    )}
                    {growthRev<0 && (
                      <div className="r-alert bad"><TrendingDown size={16} color="var(--danger)" aria-hidden/><div>Faturamento caiu <b>{Math.abs(growthRev)}%</b> vs período anterior</div></div>
                    )}
                    {growthTicket<-5 && (
                      <div className="r-alert warn"><AlertTriangle size={16} color="var(--warning)" aria-hidden/><div>Ticket médio caiu <b>{Math.abs(growthTicket)}%</b> — revise preços e combos</div></div>
                    )}
                    {margin<15 && (
                      <div className="r-alert warn"><AlertTriangle size={16} color="var(--warning)" aria-hidden/><div>Margem baixa (<b>{margin}%</b>) — revise custos</div></div>
                    )}
                    {totalSales===0 && (
                      <div className="r-alert bad"><AlertCircle size={16} color="var(--danger)" aria-hidden/><div>Sem vendas no período selecionado</div></div>
                    )}
                    {totalSales>0 && margin>=20 && growthRev>=0 && (
                      <div className="r-alert ok"><CheckCircle2 size={16} color="var(--brand-soft)" aria-hidden/><div>Negócio saudável — margem de <b>{margin}%</b> e crescimento positivo</div></div>
                    )}
                    {totalSales>0 && (
                      <div className="r-alert"><Info size={16} color="var(--text-muted)" aria-hidden/><div>Média por venda: <b className="pg-num">{BRL(revenue/totalSales)}</b></div></div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ABA PRODUTOS */}
          {tab==="produtos" && (
            <section className="pg-card">
              <div className="pg-card-h">
                <h2 className="pg-card-t">Produtos mais vendidos</h2>
                <span className="pg-card-s">{products.length} produtos no período</span>
              </div>
              {products.length===0 ? <Empty t="Nenhum produto vendido no período" s="Quando houver vendas, os produtos aparecem aqui ordenados por faturamento."/>
              : (
                <div className="pg-scroll">
                  <table className="pg-tbl" style={{minWidth:640}}>
                    <thead><tr><th>#</th><th>Produto</th><th className="pg-r">Qtd</th><th className="pg-r">Receita</th><th className="pg-r">Lucro est.</th><th style={{width:160}}>Participação</th></tr></thead>
                    <tbody>
                      {products.map((p:any,i:number)=>{
                        const maxRev2 = products[0]?.revenue||1
                        const barW = Math.round((Number(p.revenue)/Number(maxRev2))*100)
                        const lucro = Number(p.revenue)*margin/100
                        return (
                          <tr key={i}>
                            <td className="pg-num pg-muted">{i+1}</td>
                            <td style={{fontWeight:500}}>{p.name}</td>
                            <td className="pg-num pg-r">{p.quantity}</td>
                            <td className="pg-num pg-r">{BRL(Number(p.revenue))}</td>
                            <td className="pg-num pg-r" style={{color:"var(--brand-soft)"}}>{BRL(lucro)}</td>
                            <td>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div className="r-bar" style={{flex:1}}><span style={{width:`${barW}%`}}/></div>
                                <span className="pg-num pg-muted" style={{fontSize:12,width:36,textAlign:"right"}}>{barW}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ABA FINANCEIRO */}
          {tab==="financeiro" && (
            <div className="r-g2">
              <section className="pg-card">
                <div className="pg-card-h"><h2 className="pg-card-t">Resumo financeiro</h2></div>
                <div className="r-b">
                  <div className="r-kv"><span className="r-kv-l">Faturamento bruto</span><span className="r-kv-v">{BRL(revenue)}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Lucro estimado</span><span className="r-kv-v" style={{color:"var(--brand-soft)"}}>{BRL(profit)}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Custo estimado</span><span className="r-kv-v" style={{color:"var(--danger)"}}>{BRL(revenue-profit)}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Margem de lucro</span><span className="r-kv-v">{margin}%</span></div>
                  <div className="r-kv"><span className="r-kv-l">Total de vendas</span><span className="r-kv-v">{totalSales}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Ticket médio</span><span className="r-kv-v">{BRL(avgTicket)}</span></div>
                  <div className="r-kv"><span className="r-kv-l">Receita por unidade vendida</span><span className="r-kv-v">{products.length>0?BRL(revenue/products.reduce((a:any,p:any)=>a+p.quantity,0)):"—"}</span></div>
                </div>
              </section>
              <section className="pg-card">
                <div className="pg-card-h"><h2 className="pg-card-t">Pagamentos detalhados</h2></div>
                <div className="r-b" style={{display:"flex",flexDirection:"column",gap:14}}>
                  {payMethods.length===0 ? <div style={{color:"var(--text-muted)",fontSize:13}}>Nenhum pagamento registrado no período.</div>
                  : payMethods.map((p:any,i:number)=>{
                    const payPct = revenue>0?Math.round((Number(p.total)/revenue)*100):0
                    return (
                      <div key={i}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:6,fontSize:13}}>
                          <span style={{color:"var(--text)"}}>{PAY[p.paymentMethod]||p.paymentMethod} <span className="pg-muted">· {p.count} vendas</span></span>
                          <span className="pg-num" style={{color:"var(--text)"}}>{BRL(Number(p.total))} <span className="pg-muted">{payPct}%</span></span>
                        </div>
                        <div className="r-bar"><span style={{width:`${payPct}%`}}/></div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ABA VENDEDORES */}
          {tab==="vendedores" && (
            <section className="pg-card">
              <div className="pg-card-h"><h2 className="pg-card-t">Ranking de vendedores</h2><span className="pg-card-s">período selecionado</span></div>
              {sellers.length===0 ? <Empty t="Nenhuma venda de vendedor no período" s="Vendas feitas por vendedores da equipe aparecem aqui, ordenadas por faturamento."/>
              : sellers.map((s:any,i:number)=>{
                const maxRevS = sellers[0]?.revenue||1
                const barW = Math.round((Number(s.revenue)/Number(maxRevS))*100)
                const init = (s.sellerName||s.name||"?").split(" ").map((x:string)=>x[0]).slice(0,2).join("").toUpperCase()
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderTop:"1px solid var(--border)"}}>
                    <span className="pg-num pg-muted" style={{fontSize:13,width:20}}>{i+1}</span>
                    <div className="r-av" aria-hidden>{init}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:"var(--text)",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.sellerName||s.name}</div>
                      <div className="r-bar"><span style={{width:`${barW}%`}}/></div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div className="pg-num" style={{fontSize:14,color:"var(--text)"}}>{BRL(Number(s.revenue))}</div>
                      <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{s.count} vendas</div>
                    </div>
                  </div>
                )
              })}
            </section>
          )}
        </>
      )}
    </div>
  )
}
