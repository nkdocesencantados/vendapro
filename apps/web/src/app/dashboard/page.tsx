"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Plus, SlidersHorizontal, Download, MessageCircle, Pencil, Check, X, Target, HandCoins, ArrowRight, Receipt } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"

function BRL(v:number){ return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]
const PAY: Record<string,string> = { cash:"Dinheiro", pix:"PIX", credit_card:"Crédito", debit_card:"Débito", fiado:"Fiado", credit:"Fiado", store_credit:"Fiado" }
const PAY_PILL: Record<string,string> = { pix:"vp-pill-brand", credit_card:"vp-pill-info", debit_card:"vp-pill-info", fiado:"vp-pill-warn", credit:"vp-pill-warn", store_credit:"vp-pill-warn" }

type Goal = { month:string; target:number; achieved:number; percent:number; remaining:number; daysLeft:number; perDay:number }
type Receivable = { saleId:string; customerId:string; customerName:string; customerPhone?:string|null; total:number; paidAmount:number; balance:number; saleDate:string; dueDate?:string|null; status:string }

const DAY = 86_400_000
function daysUntil(iso?: string|null) {
  if (!iso) return null
  const d = new Date(iso); if (isNaN(d.getTime())) return null
  const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0)
  return Math.round((d.getTime() - today.getTime()) / DAY)
}
function dueLabel(r: Receivable): { text:string; color:string } {
  const n = daysUntil(r.dueDate)
  if (n === null) return { text:"Sem vencimento", color:"var(--text-muted)" }
  if (n < 0)  return { text:`Atrasado ${-n} dia${n===-1?"":"s"}`, color:"var(--danger)" }
  if (n === 0) return { text:"Vence hoje", color:"var(--warning)" }
  if (n === 1) return { text:"Vence amanhã", color:"var(--warning)" }
  if (n <= 7) return { text:`Vence em ${n} dias`, color:"var(--text-muted)" }
  return { text:`Vence ${new Date(r.dueDate!).toLocaleDateString("pt-BR")}`, color:"var(--text-muted)" }
}
// wa.me exige DDI; aceita telefone salvo com ou sem 55 na frente
function waLink(phone: string, text: string) {
  let d = phone.replace(/\D/g, "")
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2)
  return d.length >= 10 ? `https://wa.me/55${d}?text=${encodeURIComponent(text)}` : null
}
function initials(name: string) { return (name||"?").split(" ").filter(Boolean).slice(0,2).map(p=>p[0]).join("").toUpperCase() }

function Skel({ h=16, w="100%", r=8 }: { h?:number; w?:number|string; r?:number }) {
  return <div className="vp-skeleton" style={{height:h,width:w,borderRadius:r}} aria-hidden/>
}

function Empty({ icon, title, text, action }: { icon:React.ReactNode; title:string; text:string; action?:React.ReactNode }) {
  return (
    <div className="vp-empty" style={{padding:"28px 12px"}}>
      <div className="vp-empty-icon">{icon}</div>
      <div className="vp-empty-title">{title}</div>
      <div className="vp-empty-sub">{text}</div>
      {action && <div style={{marginTop:10}}>{action}</div>}
    </div>
  )
}

function ChartTip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null
  const v = Number(payload[0].value) || 0
  return (
    <div style={{background:"var(--bg-elevated)",border:"1px solid var(--border-strong)",borderRadius:10,padding:"8px 12px",boxShadow:"var(--shadow-md)"}}>
      <div style={{fontSize:12,color:"var(--text-muted)"}}>{label}</div>
      <div className="vp-num" style={{fontSize:14,color:"var(--text-strong)",marginTop:2}}>{mode==="count" ? `${v} venda${v===1?"":"s"}` : BRL(v)}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user: authUser } = useAuthStore()
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [store,   setStore]   = useState<any>(null)
  const [chartMode, setChartMode] = useState<"revenue"|"count">("revenue")

  const [goal, setGoal] = useState<Goal|null>(null)
  const [goalState, setGoalState] = useState<"loading"|"ok"|"error">("loading")
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState("")
  const [goalSaving, setGoalSaving] = useState(false)
  const [goalError, setGoalError] = useState("")

  const [recv, setRecv] = useState<Receivable[]>([])
  const [recvState, setRecvState] = useState<"loading"|"ok"|"error">("loading")

  const now = new Date()
  const monthLabel = MONTHS[now.getMonth()]

  const loaded = React.useRef(false)
  useEffect(() => {
    // Carregar do cache primeiro para evitar flash vazio
    try {
      const cached = sessionStorage.getItem("vp-dashboard")
      if (cached) { setData(JSON.parse(cached)); setLoading(false) }
    } catch(e) {}

    if (loaded.current) return
    loaded.current = true
    api.get("/stores").then(r=>{ const s=Array.isArray(r.data)?r.data[0]:r.data; if(s) setStore(s) }).catch(()=>{})
    api.get("/reports/dashboard").then(r=>{
      if(r.data) {
        setData(r.data)
        try { sessionStorage.setItem("vp-dashboard", JSON.stringify(r.data)) } catch(e) {}
      }
    }).catch(()=>{}).finally(()=>setLoading(false))
    // Endpoints novos: falha (404 etc.) vira estado vazio, nunca quebra a página
    api.get("/goals/current").then(r=>{ setGoal(r.data && typeof r.data.target === "number" ? r.data : null); setGoalState("ok") }).catch(()=>setGoalState("error"))
    api.get("/receivables", { params:{ status:"open" } }).then(r=>{
      const list = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.items) ? r.data.items : []
      setRecv(list); setRecvState("ok")
    }).catch(()=>setRecvState("error"))
  }, [])

  const WIDGETS: [string,string][] = [["kpis","Indicadores"],["chart","Gráfico de vendas"],["meta","Meta do mês"],["last","Últimas vendas"],["fiado","Fiado vencendo"]]
  const [hidden, setHidden] = useState<Record<string,boolean>>({})
  const [custom, setCustom] = useState(false)
  useEffect(() => {
    try { const h = localStorage.getItem("vp-dash-hidden"); if (h) setHidden(JSON.parse(h)) } catch(e) {}
  }, [])
  function toggleWidget(k: string) {
    setHidden(prev => {
      const next = { ...prev, [k]: !prev[k] }
      try { localStorage.setItem("vp-dash-hidden", JSON.stringify(next)) } catch(e) {}
      return next
    })
  }
  const show = (k: string) => !hidden[k]

  const storeName  = store?.name || "sua loja"
  const firstName  = (authUser?.name||"").split(" ")[0]
  const hour       = now.getHours()
  const greeting   = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
  const dateLine   = now.toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" })
  const fat        = data?.monthSales     || 0
  const today      = data?.todaySales     || 0
  const lucro      = data?.profit         || 0
  const margem     = fat>0 ? Math.round((lucro/fat)*100) : 0
  const ticket     = data?.avgTicket      || 0
  const totalV     = data?.monthSalesCount|| 0
  const chart      = (data?.weeklyChart||[]).map((d:any) => ({ day: d.day, v: chartMode==="revenue" ? Number(d.value)||0 : Number(d.count)||0 }))
  const chartTotal = chart.reduce((s:number,d:any)=>s+d.v,0)
  const recentSales:any[]= data?.recentSales || []
  const lowStock:any[]   = data?.lowStock    || []

  // Meta: endpoint novo; se ainda não existir, usa a meta antiga da loja
  const legacyTarget = Number(store?.monthlyGoal || data?.monthGoal || 0)
  const g: Goal|null = goal && goal.target > 0 ? goal
    : (goalState === "error" && legacyTarget > 0) ? (() => {
        const daysLeft = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate() - now.getDate() + 1
        const remaining = Math.max(legacyTarget - fat, 0)
        return { month:"", target:legacyTarget, achieved:fat, percent:Math.round((fat/legacyTarget)*100), remaining, daysLeft, perDay: daysLeft>0 ? remaining/daysLeft : remaining }
      })()
    : null

  const recvSorted = [...recv].filter(r => Number(r.balance) > 0).sort((a,b) => (daysUntil(a.dueDate) ?? 9999) - (daysUntil(b.dueDate) ?? 9999))
  const recvTotal  = recvSorted.reduce((s,r)=>s+(Number(r.balance)||0),0)
  const dueSoon    = recvSorted.filter(r => { const n = daysUntil(r.dueDate); return n !== null && n <= 7 }).length

  function startEditGoal() { setGoalInput(g?.target ? String(g.target) : ""); setGoalError(""); setEditingGoal(true) }
  async function saveGoal(e?: React.FormEvent) {
    e?.preventDefault()
    // "20.000,50" (pt-BR) ou "20000.50"
    const raw = goalInput.trim()
    const target = Number(raw.includes(",") ? raw.replace(/\./g,"").replace(",",".") : raw)
    if (!isFinite(target) || target <= 0) { setGoalError("Informe um valor maior que zero."); return }
    setGoalSaving(true); setGoalError("")
    try {
      const r = await api.put("/goals/current", { target })
      setGoal(r.data); setGoalState("ok"); setEditingGoal(false)
    } catch {
      setGoalError("Não foi possível salvar a meta agora. Tente de novo em instantes.")
    } finally { setGoalSaving(false) }
  }

  function chargeMessage(r: Receivable) {
    const due = r.dueDate ? `, com vencimento em ${new Date(r.dueDate).toLocaleDateString("pt-BR")}` : ""
    const name = (r.customerName||"").split(" ")[0]
    return `Olá${name?`, ${name}`:""}! Tudo bem? Passando para lembrar do seu fiado de ${BRL(r.balance)} na ${store?.name || "loja"}${due}. Quando puder acertar, me avisa por aqui. Obrigado!`
  }

  if (loading) return (
    <div aria-busy="true" aria-label="Carregando dashboard" style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",flexDirection:"column",gap:8}}><Skel h={14} w={160}/><Skel h={30} w={240}/></div>
      <div className="d-kpis">{[0,1,2,3].map(i=><div key={i} className="vp-kpi" style={{display:"flex",flexDirection:"column",gap:12}}><Skel h={12} w="50%"/><Skel h={28} w="70%"/><Skel h={12} w="40%"/></div>)}</div>
      <div className="d-row"><div className="vp-card" style={{padding:20}}><Skel h={240}/></div><div className="vp-card" style={{padding:20,display:"flex",flexDirection:"column",gap:12}}><Skel h={16} w="50%"/><Skel h={34} w="40%"/><Skel h={10}/><Skel h={40}/></div></div>
      <DashStyles/>
    </div>
  )

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <DashStyles/>

      {/* HEADER */}
      <header style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginRight:"auto"}}>
          <span style={{fontSize:13,color:"var(--text-muted)",textTransform:"capitalize"}}>{dateLine}</span>
          <h1 className="vp-page-title">{greeting}{firstName ? `, ${firstName}` : ""}</h1>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="vp-btn vp-btn-ghost" onClick={()=>setCustom(c=>!c)} aria-pressed={custom}>
            <SlidersHorizontal size={16} aria-hidden/> Personalizar
          </button>
          <Link href="/dashboard/reports" className="vp-btn vp-btn-secondary"><Download size={16} aria-hidden/> Exportar</Link>
          <Link href="/dashboard/sales" className="vp-btn vp-btn-primary"><Plus size={16} strokeWidth={2.4} aria-hidden/> Nova venda</Link>
        </div>
      </header>

      {custom && (
        <div className="d-custom">
          <span style={{fontSize:13,fontWeight:600,marginRight:4}}>Mostrar no resumo:</span>
          {WIDGETS.map(([k,label])=>(
            <button key={k} className={`d-chip${show(k)?" on":""}`} aria-pressed={show(k)} onClick={()=>toggleWidget(k)}>
              {show(k) ? <Check size={14} aria-hidden/> : <Plus size={14} aria-hidden/>} {label}
            </button>
          ))}
          <span style={{fontSize:12,color:"var(--text-muted)",marginLeft:"auto"}}>Ranking, produtos e pagamentos estão em Relatórios</span>
        </div>
      )}

      {/* KPIs */}
      {show("kpis") && (
        <section aria-label="Indicadores" className="d-kpis">
          <div className="vp-kpi">
            <div className="vp-kpi-label">Vendas hoje</div>
            <div className="vp-kpi-value">{BRL(today)}</div>
            <div className={`vp-kpi-delta${today>0?" up":""}`}>{today>0?"Com vendas hoje":"Nenhuma venda ainda hoje"}</div>
          </div>
          <div className="vp-kpi">
            <div className="vp-kpi-label">Faturamento do mês</div>
            <div className="vp-kpi-value">{BRL(fat)}</div>
            <div className="vp-kpi-delta">{totalV} venda{totalV===1?"":"s"} · lucro {BRL(lucro)} ({margem}%)</div>
          </div>
          <div className="vp-kpi">
            <div className="vp-kpi-label">Ticket médio</div>
            <div className="vp-kpi-value">{BRL(ticket)}</div>
            <div className="vp-kpi-delta">Por venda no mês</div>
          </div>
          <div className="vp-kpi">
            <div className="vp-kpi-label">Fiado a receber</div>
            <div className="vp-kpi-value">{recvState==="ok" ? BRL(recvTotal) : recvState==="loading" ? <Skel h={28} w="70%"/> : "—"}</div>
            <div className={`vp-kpi-delta${dueSoon>0?" warn":""}`}>
              {recvState==="error" ? "Sem dados de fiado" : dueSoon>0 ? `${dueSoon} vence${dueSoon===1?"":"m"} em até 7 dias` : recvSorted.length>0 ? `${recvSorted.length} em aberto` : "Nada em aberto"}
            </div>
          </div>
          <Link href="/dashboard/inventory" className="vp-kpi" style={{textDecoration:"none",color:"inherit"}}>
            <div className="vp-kpi-label">Estoque baixo</div>
            <div className="vp-kpi-value">{lowStock.length} {lowStock.length===1?"item":"itens"}</div>
            <div className={`vp-kpi-delta${lowStock.length>0?" warn":" up"}`}>{lowStock.length>0 ? `Repor: ${lowStock.slice(0,2).map((p:any)=>p.name).join(", ")}${lowStock.length>2?"…":""}` : "Tudo abastecido"}</div>
          </Link>
        </section>
      )}

      {/* GRÁFICO + META */}
      {(show("chart") || show("meta")) && (
        <section className="d-row" style={{gridTemplateColumns: show("chart")&&show("meta") ? undefined : "1fr"}}>
          {show("chart") && (
            <div className="vp-card d-pad">
              <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12}}>
                <h2 className="vp-card-title">Vendas por dia · {monthLabel}</h2>
                <span className="vp-num" style={{fontSize:13,color:"var(--brand-neon)"}}>{chartMode==="revenue" ? BRL(chartTotal) : `${chartTotal} vendas`}</span>
                <div role="group" aria-label="Métrica do gráfico" style={{display:"flex",gap:4,marginLeft:"auto"}}>
                  <button className={`vp-btn vp-btn-sm ${chartMode==="revenue"?"vp-btn-secondary":"vp-btn-ghost"}`} aria-pressed={chartMode==="revenue"} onClick={()=>setChartMode("revenue")}>Receita</button>
                  <button className={`vp-btn vp-btn-sm ${chartMode==="count"?"vp-btn-secondary":"vp-btn-ghost"}`} aria-pressed={chartMode==="count"} onClick={()=>setChartMode("count")}>Quantidade</button>
                </div>
              </div>
              {chartTotal > 0 ? (
                <div style={{height:240,marginTop:8}} role="img" aria-label={`Gráfico de ${chartMode==="revenue"?"faturamento":"quantidade de vendas"} por dia em ${monthLabel}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart} margin={{top:12,right:8,left:0,bottom:0}}>
                      <defs>
                        <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="var(--brand)" stopOpacity={0.45}/>
                          <stop offset="1" stopColor="var(--brand)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fill:"var(--text-muted)",fontSize:11}} minTickGap={16}/>
                      <YAxis tickLine={false} axisLine={false} width={56} allowDecimals={chartMode!=="count"} tick={{fill:"var(--text-muted)",fontSize:11,fontFamily:"var(--font-mono)"}}
                        tickFormatter={(n:number)=> chartMode==="count" ? String(n) : n>=1000 ? `R$${(n/1000).toFixed(n%1000===0?0:1)}k` : `R$${n}`}/>
                      <Tooltip content={<ChartTip mode={chartMode}/>} cursor={{stroke:"var(--border-strong)"}}/>
                      <Area type="monotone" dataKey="v" stroke="var(--brand-neon)" strokeWidth={2.5} fill="url(#dashArea)"
                        activeDot={{r:5,fill:"var(--brand-neon)",stroke:"var(--bg)",strokeWidth:2}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty icon={<Receipt size={20}/>} title="Sem vendas neste mês ainda" text="Registre a primeira venda e o gráfico aparece aqui."
                  action={<Link href="/dashboard/sales" className="vp-btn vp-btn-secondary vp-btn-sm"><Plus size={14} aria-hidden/> Nova venda</Link>}/>
              )}
            </div>
          )}

          {show("meta") && (
            <div className="vp-card glow d-pad" style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <h2 className="vp-card-title" style={{textTransform:"none"}}>Meta de {monthLabel}</h2>
                {g && !editingGoal && (
                  <button className="vp-btn vp-btn-ghost vp-btn-sm" style={{marginLeft:"auto"}} onClick={startEditGoal}><Pencil size={13} aria-hidden/> Ajustar</button>
                )}
              </div>

              {goalState==="loading" && !editingGoal ? (
                <><Skel h={34} w="45%"/><Skel h={10}/><Skel h={36}/></>
              ) : editingGoal ? (
                <form onSubmit={saveGoal} style={{display:"flex",flexDirection:"column",gap:10}}>
                  <label htmlFor="goal-input" style={{fontSize:13,color:"var(--text-soft)"}}>Quanto você quer vender este mês?</label>
                  <div style={{position:"relative"}}>
                    <span className="vp-num" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",fontSize:14}}>R$</span>
                    <input id="goal-input" className="vp-input vp-num" inputMode="decimal" autoFocus value={goalInput} onChange={e=>setGoalInput(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Escape") setEditingGoal(false) }} placeholder="20000" style={{paddingLeft:42,fontSize:16}} aria-invalid={!!goalError} aria-describedby={goalError?"goal-err":undefined}/>
                  </div>
                  {goalError && <span id="goal-err" role="alert" style={{fontSize:12.5,color:"var(--danger)"}}>{goalError}</span>}
                  <div style={{display:"flex",gap:8}}>
                    <button type="submit" className="vp-btn vp-btn-primary vp-btn-sm" disabled={goalSaving}><Check size={14} aria-hidden/> {goalSaving?"Salvando…":"Salvar meta"}</button>
                    <button type="button" className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setEditingGoal(false)}><X size={14} aria-hidden/> Cancelar</button>
                  </div>
                </form>
              ) : g ? (
                <>
                  <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                    <span className="vp-num" style={{fontSize:34,color:"var(--text-strong)",lineHeight:1}}>{Math.round(g.percent)}%</span>
                    <span style={{fontSize:13,color:"var(--text-muted)"}}>de <span className="vp-num">{BRL(g.target)}</span></span>
                  </div>
                  <div className="vp-progress" style={{height:10}} role="progressbar" aria-valuenow={Math.round(g.percent)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da meta">
                    <div className="vp-progress-fill" style={{width:`${Math.min(100, Math.max(0, g.percent))}%`}}/>
                  </div>
                  <p style={{fontSize:13.5,lineHeight:1.55,color:"var(--text-soft)"}}>
                    {g.remaining <= 0
                      ? <>Meta batida! Você vendeu <strong className="vp-num" style={{color:"var(--text)"}}>{BRL(g.achieved)}</strong> este mês.</>
                      : <>Faltam <strong className="vp-num" style={{color:"var(--text)"}}>{BRL(g.remaining)}</strong> em {g.daysLeft} dia{g.daysLeft===1?"":"s"}, cerca de <strong className="vp-num" style={{color:"var(--text)"}}>{BRL(g.perDay)}/dia</strong>.</>}
                  </p>
                </>
              ) : (
                <Empty icon={<Target size={20}/>} title="Defina sua meta do mês" text="Com uma meta, o VendaPro mostra quanto falta e quanto vender por dia."
                  action={<button className="vp-btn vp-btn-primary vp-btn-sm" onClick={startEditGoal}><Target size={14} aria-hidden/> Definir meta</button>}/>
              )}
            </div>
          )}
        </section>
      )}

      {/* ÚLTIMAS VENDAS + FIADO */}
      {(show("last") || show("fiado")) && (
        <section className="d-row" style={{gridTemplateColumns: show("last")&&show("fiado") ? undefined : "1fr"}}>
          {show("last") && (
            <div className="vp-card d-pad" style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",alignItems:"center"}}>
                <h2 className="vp-card-title">Últimas vendas</h2>
                <Link href="/dashboard/sales" className="d-link" style={{marginLeft:"auto"}}>Ver todas <ArrowRight size={14} aria-hidden/></Link>
              </div>
              {recentSales.length === 0 ? (
                <Empty icon={<Receipt size={20}/>} title="Nenhuma venda registrada" text="Suas vendas mais recentes aparecem aqui."/>
              ) : (
                <div style={{overflowX:"auto"}}>
                  <table className="d-table">
                    <thead><tr><th>Cliente</th><th>Pagamento</th><th>Hora</th><th style={{textAlign:"right"}}>Valor</th></tr></thead>
                    <tbody>
                      {recentSales.slice(0,5).map((s:any)=>(
                        <tr key={s.id}>
                          <td>{s.customerName||"Cliente balcão"}{s.sellerName && <span style={{color:"var(--text-muted)",fontSize:12}}> · {s.sellerName.split(" ")[0]}</span>}</td>
                          <td><span className={`vp-pill ${PAY_PILL[s.paymentMethod]||"vp-pill-grey"}`}>{PAY[s.paymentMethod]||s.paymentMethod||"—"}</span></td>
                          <td className="vp-num" style={{color:"var(--text-muted)"}}>{s.createdAt ? new Date(s.createdAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                          <td className="vp-num" style={{textAlign:"right",color:"var(--text-strong)"}}>{BRL(s.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {show("fiado") && (
            <div className="vp-card d-pad" style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <h2 className="vp-card-title">Fiado vencendo</h2>
                {dueSoon>0 && <span className="d-count">{dueSoon}</span>}
                {recvSorted.length>0 && <Link href="/dashboard/receivables" className="d-link" style={{marginLeft:"auto"}}>Ver todos <ArrowRight size={14} aria-hidden/></Link>}
              </div>
              {recvState==="loading" ? (
                [0,1,2].map(i=>(
                  <div key={i} className="d-fiado"><Skel h={36} w={36} r={18}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><Skel h={13} w="60%"/><Skel h={11} w="40%"/></div><Skel h={36} w={36} r={10}/></div>
                ))
              ) : recvSorted.length === 0 ? (
                <Empty icon={<HandCoins size={20}/>} title={recvState==="error" ? "Fiado indisponível no momento" : "Nenhum fiado em aberto"}
                  text={recvState==="error" ? "Não conseguimos carregar as contas a receber. Tente de novo mais tarde." : "Quando você vender fiado, as cobranças próximas aparecem aqui."}/>
              ) : (
                recvSorted.slice(0,5).map(r => {
                  const due = dueLabel(r)
                  const link = r.customerPhone ? waLink(r.customerPhone, chargeMessage(r)) : null
                  return (
                    <div key={r.saleId} className="d-fiado">
                      <span className="d-av" aria-hidden>{initials(r.customerName)}</span>
                      <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
                        <span style={{fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.customerName||"Cliente"}</span>
                        <span style={{fontSize:12,color:due.color}}>{due.text}</span>
                      </div>
                      <span className="vp-num" style={{marginLeft:"auto",fontSize:14,whiteSpace:"nowrap"}}>{BRL(r.balance)}</span>
                      {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="d-wa" aria-label={`Cobrar ${r.customerName} pelo WhatsApp`} title="Cobrar pelo WhatsApp"><MessageCircle size={16} aria-hidden/></a>
                      ) : (
                        <span className="d-wa is-off" title="Cliente sem telefone cadastrado" aria-label="Cliente sem telefone cadastrado"><MessageCircle size={16} aria-hidden/></span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function DashStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .d-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;}
      .d-row{display:grid;grid-template-columns:minmax(0,2fr) minmax(300px,1fr);gap:16px;}
      .d-pad{padding:20px;}
      .d-link{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:500;color:var(--brand-neon);text-decoration:none;}
      .d-link:hover{text-decoration:underline;}
      .d-table{width:100%;border-collapse:collapse;font-size:14px;min-width:480px;}
      .d-table th{padding:8px 0;font-size:12px;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;text-align:left;}
      .d-table td{padding:12px 12px 12px 0;border-top:1px solid var(--border);}
      .d-table td:last-child{padding-right:0;}
      .d-count{font-size:11px;font-weight:700;color:#060A08;background:var(--warning);padding:2px 7px;border-radius:6px;}
      .d-fiado{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--border);}
      .d-av{width:36px;height:36px;border-radius:50%;background:var(--surface-3);color:var(--brand-neon);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;}
      .d-wa{width:36px;height:36px;border-radius:10px;border:1px solid var(--border-strong);background:var(--surface-2);color:var(--brand-neon);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .18s,border-color .18s;}
      .d-wa:hover{background:var(--surface-3);border-color:var(--brand);}
      .d-wa.is-off{color:var(--text-subtle);cursor:not-allowed;}
      .d-wa.is-off:hover{background:var(--surface-2);border-color:var(--border-strong);}
      .d-custom{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:16px 20px;border-radius:var(--r-lg);background:var(--surface);border:1px solid var(--border-strong);}
      .d-chip{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border-radius:17px;border:1px solid var(--border-strong);background:transparent;color:var(--text-muted);font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:var(--transition);}
      .d-chip.on{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--text);}
      a.vp-kpi:hover{border-color:var(--border-strong);}
      @media(max-width:1100px){.d-row{grid-template-columns:1fr;}}
      @media(max-width:640px){.d-kpis{grid-template-columns:1fr 1fr;gap:12px;} .d-pad{padding:16px;}}
      @media(max-width:380px){.d-kpis{grid-template-columns:1fr;}}
    ` }} />
  )
}
