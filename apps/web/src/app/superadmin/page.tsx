"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { BarChart3, Building2, Check, CreditCard, LogOut, Plus, ShieldCheck, Trash2, X } from "lucide-react"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

const PLAN_LABEL: Record<string,string> = { trial:"Trial", basic:"Basic", starter:"Basic", pro:"Pro", business:"Business" }
const PLAN_CHIP: Record<string,string> = { trial:"info", basic:"grey", starter:"grey", pro:"ok", business:"ok" }

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

export default function SuperAdminPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState("empresas")
  const [filter, setFilter]       = useState("all")
  const [planModal, setPlanModal] = useState<any>(null)
  const [pwdModal, setPwdModal]   = useState<any>(null)
  const [newPwd, setNewPwd]       = useState("")
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState("")
  const [showNew, setShowNew]      = useState(false)
  const [newForm, setNewForm]      = useState({name:"",email:"",password:"",plan:"pro"})
  const [newSaving, setNewSaving]  = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try { const r = await api.get("/companies"); setCompanies(r.data) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }

  function showToast(msg:string) { setToast(msg); setTimeout(()=>setToast(""),3000) }

  async function createCompany() {
    if(!newForm.name||!newForm.email||!newForm.password) return alert("Preencha todos os campos")
    setNewSaving(true)
    try {
      await api.post("/companies", newForm)
      setShowNew(false)
      setNewForm({name:"",email:"",password:"",plan:"pro"})
      showToast("Empresa criada com sucesso!")
      const r = await api.get("/companies"); setCompanies(r.data)
    } catch(e:any) { alert(e?.response?.data?.message||"Erro ao criar empresa") }
    finally { setNewSaving(false) }
  }

  async function toggleStatus(c:any) {
    const next = c.status==="active" ? "inactive" : "active"
    try {
      await api.patch(`/companies/${c.id}/status`, { status: next })
      setCompanies(prev => prev.map(x => x.id===c.id ? {...x,status:next} : x))
      showToast(next==="active" ? "Empresa reativada" : "Empresa bloqueada")
    } catch(e){ console.error(e) }
  }

  async function deleteCompany(c:any) {
    if(!confirm(`Excluir "${c.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await api.delete(`/companies/${c.id}`)
      setCompanies(prev => prev.filter(x => x.id!==c.id))
      showToast("Empresa excluida")
    } catch(e){ console.error(e) }
  }

  async function savePlan(companyId:string, plan:string) {
    try {
      await api.patch(`/companies/${companyId}/plan`, { plan })
      setCompanies(prev => prev.map(x => x.id===companyId ? {...x,plan} : x))
      setPlanModal(null); showToast("Plano atualizado")
    } catch(e){ console.error(e) }
  }

  async function resetPassword() {
    if(!newPwd||newPwd.length<6) return alert("Senha deve ter ao menos 6 caracteres")
    setSaving(true)
    try {
      await api.patch(`/companies/${pwdModal.id}/reset-password`, { password: newPwd })
      setPwdModal(null); setNewPwd(""); showToast("Senha redefinida")
    } catch(e){ console.error(e) }
    finally { setSaving(false) }
  }

  const filtered = companies.filter(c => {
    if(filter==="active")  return c.status==="active"
    if(filter==="trial")   return c.plan==="trial"
    if(filter==="inactive") return c.status==="inactive"
    return true
  })

  const stats = {
    total:   companies.length,
    active:  companies.filter(c=>c.status==="active").length,
    trial:   companies.filter(c=>c.plan==="trial").length,
    blocked: companies.filter(c=>c.status==="inactive").length,
  }

  const mrr = companies.filter(c=>c.status==="active").reduce((a,c)=>a+({basic:150,starter:150,pro:150,business:200}[(c.plan||'').toLowerCase()]||0),0)

  const NAV: [string,string,any][] = [["empresas","Empresas",Building2],["assinaturas","Assinaturas",CreditCard],["relatórios","Relatórios",BarChart3]]
  const planChip = (p:string) => <span className={`pg-chip ${PLAN_CHIP[p]||"grey"}`}>{PLAN_LABEL[p]||p}</span>

  return (
    <div className="sa-root">
      <style dangerouslySetInnerHTML={{ __html: PG_CSS + `
        .sa-root{min-height:100vh;background:var(--bg);color:var(--text);font-family:var(--font)}
        .sa-shell{display:flex;min-height:100vh}
        .sa-aside{width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:20px;padding:20px 14px;border-right:1px solid var(--border);background:var(--bg-elevated)}
        .sa-brand{display:flex;align-items:center;gap:10px;padding:4px 8px}
        .sa-logo{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;background:linear-gradient(180deg,var(--brand),var(--brand-mid));color:var(--bg)}
        .sa-nav{display:flex;flex-direction:column;gap:2px;flex:1}
        .sa-nav button,.sa-out{display:flex;align-items:center;gap:10px;min-height:40px;padding:0 12px;border-radius:10px;border:0;background:transparent;color:var(--text-muted);font:inherit;font-size:14px;font-weight:500;cursor:pointer;text-align:left;transition:var(--transition)}
        .sa-nav button:hover,.sa-out:hover{color:var(--text);background:var(--surface-2)}
        .sa-nav button[aria-current="page"]{color:var(--text);font-weight:600;background:color-mix(in srgb,var(--brand) 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 28%,transparent)}
        .sa-main{flex:1;min-width:0}
        .sa-tabs{display:none}
        .sa-acts{display:inline-flex;gap:6px;flex-wrap:nowrap}
        .sa-toast{position:fixed;top:16px;right:16px;z-index:999;display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;border:1px solid color-mix(in srgb,var(--brand) 40%,transparent);background:var(--bg-elevated);color:var(--text);font-size:14px;box-shadow:var(--shadow-lg)}
        .sa-plan{padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--surface-2);cursor:pointer;text-align:left;font:inherit;color:inherit;transition:var(--transition)}
        .sa-plan:hover{border-color:color-mix(in srgb,var(--brand) 50%,transparent)}
        .sa-plan[aria-pressed="true"]{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 10%,var(--surface-2))}
        .sa-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px}
        .pg-chip.info{background:var(--info-bg);color:var(--info)}
        @media(max-width:760px){
          .sa-shell{flex-direction:column}
          .sa-aside{width:auto;flex-direction:row;align-items:center;justify-content:space-between;padding:12px 16px;border-right:0;border-bottom:1px solid var(--border)}
          .sa-nav{display:none}
          .sa-tabs{display:inline-flex}
        }
      ` }} />

      {toast && (
        <div className="sa-toast" role="status"><Check size={16} color="var(--brand-soft)" aria-hidden/>{toast}</div>
      )}

      <div className="sa-shell">
        <aside className="sa-aside">
          <div className="sa-brand">
            <div className="sa-logo"><ShieldCheck size={18} aria-hidden/></div>
            <div style={{lineHeight:1.15}}>
              <div style={{fontSize:16,fontWeight:700,letterSpacing:"-0.3px"}}>Venda<span style={{color:"var(--brand)"}}>Pro</span></div>
              <div style={{fontSize:11,color:"var(--text-muted)",letterSpacing:".08em",textTransform:"uppercase"}}>Super Admin</div>
            </div>
          </div>
          <nav className="sa-nav" aria-label="Seções">
            {NAV.map(([id,lbl,Ico])=>(
              <button key={id} type="button" aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)}><Ico size={16} aria-hidden/>{lbl}</button>
            ))}
          </nav>
          <button type="button" className="sa-out" onClick={()=>router.push("/login")}><LogOut size={16} aria-hidden/>Sair</button>
        </aside>

        <main className="sa-main pg">
          <header className="pg-head">
            <div>
              <h1 className="pg-title">{tab==="empresas"?"Empresas":tab==="assinaturas"?"Assinaturas":"Relatórios"}</h1>
              <div className="pg-sub">{stats.total} empresas cadastradas · {stats.active} ativas</div>
            </div>
            <div className="pg-actions">
              <button className="vp-btn vp-btn-primary" onClick={()=>setShowNew(true)}><Plus size={16} aria-hidden/>Nova empresa</button>
            </div>
          </header>

          <div className="pg-seg sa-tabs" role="tablist" aria-label="Seções" style={{alignSelf:"flex-start"}}>
            {NAV.map(([id,lbl])=>(
              <button key={id} type="button" role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{lbl}</button>
            ))}
          </div>

          <section className="pg-kpis" aria-label="Indicadores">
            {[
              {lbl:"Total de empresas",val:stats.total,col:undefined},
              {lbl:"Ativas",val:stats.active,col:"var(--brand-soft)"},
              {lbl:"Em trial",val:stats.trial,col:undefined},
              {lbl:"Bloqueadas",val:stats.blocked,col:stats.blocked?"var(--danger)":undefined},
            ].map(s=>(
              <div key={s.lbl} className="pg-kpi">
                <span className="pg-kpi-l">{s.lbl}</span>
                <span className="pg-kpi-v" style={{color:s.col}}>{loading?"—":s.val}</span>
              </div>
            ))}
          </section>

          {tab === "empresas" && (
            <section className="pg-card">
              <div className="pg-card-h" style={{alignItems:"center"}}>
                <h2 className="pg-card-t">Todas as empresas</h2>
                <div className="pg-seg" role="group" aria-label="Filtrar empresas" style={{marginLeft:"auto"}}>
                  {[["all","Todas"],["active","Ativas"],["trial","Trial"],["inactive","Bloqueadas"]].map(([v,l])=>(
                    <button key={v} type="button" aria-pressed={filter===v} onClick={()=>setFilter(v)}>{l}</button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{padding:"4px 20px 20px",display:"flex",flexDirection:"column",gap:10}} aria-busy="true" aria-label="Carregando empresas">
                  {[0,1,2,3].map(i=><div key={i} className="vp-skeleton" style={{height:44}}/>)}
                </div>
              ) : filtered.length===0 ? (
                <div className="pg-empty">
                  <div className="pg-empty-i"><Building2 size={22} aria-hidden/></div>
                  <div className="pg-empty-t">{companies.length===0?"Nenhuma empresa ainda":"Nenhuma empresa neste filtro"}</div>
                  <div className="pg-empty-s">{companies.length===0?"Crie a primeira empresa com o e-mail do proprietário e o plano contratado.":"Troque o filtro para ver as outras empresas."}</div>
                  {companies.length===0
                    ? <button className="vp-btn vp-btn-primary" onClick={()=>setShowNew(true)}><Plus size={16} aria-hidden/>Criar primeira empresa</button>
                    : <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>setFilter("all")}>Ver todas</button>}
                </div>
              ) : (
                <div className="pg-scroll">
                  <table className="pg-tbl" style={{minWidth:820}}>
                    <thead>
                      <tr><th>Empresa</th><th>E-mail</th><th>Plano</th><th>Status</th><th>Cadastro</th><th className="pg-r">Ações</th></tr>
                    </thead>
                    <tbody>
                      {filtered.map((c:any)=>(
                        <tr key={c.id}>
                          <td style={{fontWeight:500}}>{c.name}</td>
                          <td className="pg-muted" style={{fontSize:13}}>{c.email||"—"}</td>
                          <td>{planChip(c.plan)}</td>
                          <td>
                            <span className={`pg-chip ${c.status==="active"?"ok":"bad"}`}>
                              <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}}/>
                              {c.status==="active"?"Ativa":"Bloqueada"}
                            </span>
                          </td>
                          <td className="pg-num pg-muted" style={{fontSize:13}}>{c.createdAt?new Date(c.createdAt).toLocaleDateString("pt-BR"):"—"}</td>
                          <td className="pg-r">
                            <div className="sa-acts">
                              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setPlanModal(c)}>Plano</button>
                              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>{setPwdModal(c);setNewPwd("")}}>Senha</button>
                              <button className={`vp-btn vp-btn-sm ${c.status==="active"?"vp-btn-secondary":"vp-btn-primary"}`} style={c.status==="active"?{color:"var(--warning)"}:undefined} onClick={()=>toggleStatus(c)}>
                                {c.status==="active"?"Bloquear":"Ativar"}
                              </button>
                              <button className="vp-icon-btn" style={{color:"var(--danger)"}} onClick={()=>deleteCompany(c)} aria-label={`Excluir ${c.name}`} title="Excluir"><Trash2 size={14} aria-hidden/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {tab === "assinaturas" && (
            <>
              <section className="pg-kpis" aria-label="Receita recorrente">
                {[
                  {lbl:"MRR",val:BRL(mrr),col:"var(--brand-soft)"},
                  {lbl:"ARR projetado",val:BRL(mrr*12),col:undefined},
                  {lbl:"Ticket médio",val:BRL(stats.active?mrr/stats.active:0),col:undefined},
                  {lbl:"Empresas pagas",val:String(stats.active),col:undefined},
                ].map(s=>(
                  <div key={s.lbl} className="pg-kpi">
                    <span className="pg-kpi-l">{s.lbl}</span>
                    <span className="pg-kpi-v" style={{color:s.col}}>{s.val}</span>
                  </div>
                ))}
              </section>
              <section className="pg-card">
                <div className="pg-card-h"><h2 className="pg-card-t">Distribuição por plano</h2></div>
                <div style={{padding:"0 20px 20px"}} className="sa-grid2">
                  {["basic","pro","business","trial"].map(p=>{
                    const count = companies.filter(c=>c.plan===p||c.plan==="starter"&&p==="basic").length
                    return (
                      <div key={p} style={{padding:16,background:"var(--surface-2)",borderRadius:12,border:"1px solid var(--border)",display:"flex",flexDirection:"column",gap:8,alignItems:"flex-start"}}>
                        {planChip(p)}
                        <div className="pg-num" style={{fontSize:24,color:"var(--text)"}}>{count}</div>
                        <div style={{fontSize:12,color:"var(--text-muted)"}}>empresas</div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </>
          )}

          {tab === "relatórios" && (
            <section className="pg-card">
              <div className="pg-card-h"><h2 className="pg-card-t">Resumo geral</h2></div>
              <div style={{padding:"0 20px 12px",columnGap:32}} className="sa-grid2">
                {[
                  ["Total empresas",stats.total],
                  ["Empresas ativas",stats.active],
                  ["Em trial",stats.trial],
                  ["Bloqueadas",stats.blocked],
                  ["MRR",BRL(mrr)],
                  ["ARR projetado",BRL(mrr*12)],
                ].map(([lbl,val])=>(
                  <div key={lbl} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"12px 0",borderTop:"1px solid var(--border)",fontSize:14}}>
                    <span style={{color:"var(--text-muted)"}}>{lbl}</span>
                    <strong className="pg-num" style={{fontWeight:500,color:"var(--text)"}}>{val}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* MODAL PLANO */}
          {planModal && (
            <div className="vp-modal-bg" onClick={()=>setPlanModal(null)}>
              <div className="vp-modal" role="dialog" aria-modal="true" aria-labelledby="sa-plan-t" style={{width:"min(560px,100%)"}} onClick={e=>e.stopPropagation()}>
                <div className="vp-modal-head">
                  <h2 id="sa-plan-t">Alterar plano — {planModal.name}</h2>
                  <button className="pg-x" onClick={()=>setPlanModal(null)} aria-label="Fechar"><X size={16} aria-hidden/></button>
                </div>
                <div className="vp-modal-body">
                  <div className="sa-grid2">
                    {[
                      {id:"trial",name:"Trial",price:"Grátis",sub:"7 dias"},
                      {id:"basic",name:"Basic",price:"R$ 100",sub:"/mês"},
                      {id:"pro",name:"Pro",price:"R$ 150",sub:"/mês"},
                      {id:"business",name:"Business",price:"R$ 200",sub:"/mês"},
                    ].map(p=>(
                      <button key={p.id} type="button" className="sa-plan" aria-pressed={planModal.plan===p.id} onClick={()=>savePlan(planModal.id,p.id)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                          <div>
                            <div style={{fontWeight:600,fontSize:14}}>{p.name}</div>
                            <div style={{marginTop:6}}>
                              <span className="pg-num" style={{fontSize:20}}>{p.price}</span>
                              <span style={{fontSize:12,color:"var(--text-muted)"}}> {p.sub}</span>
                            </div>
                          </div>
                          {planModal.plan===p.id && <span className="pg-chip ok"><Check size={12} aria-hidden/>Atual</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL SENHA */}
          {pwdModal && (
            <div className="vp-modal-bg" onClick={()=>setPwdModal(null)}>
              <div className="vp-modal" role="dialog" aria-modal="true" aria-labelledby="sa-pwd-t" onClick={e=>e.stopPropagation()}>
                <div className="vp-modal-head">
                  <h2 id="sa-pwd-t">Redefinir senha — {pwdModal.name}</h2>
                  <button className="pg-x" onClick={()=>setPwdModal(null)} aria-label="Fechar"><X size={16} aria-hidden/></button>
                </div>
                <div className="vp-modal-body">
                  <div className="vp-field">
                    <label htmlFor="sa-pwd">Nova senha</label>
                    <input id="sa-pwd" className="vp-input" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Mínimo de 6 caracteres" />
                  </div>
                </div>
                <div className="vp-modal-foot">
                  <button className="vp-btn vp-btn-ghost" onClick={()=>setPwdModal(null)}>Cancelar</button>
                  <button className="vp-btn vp-btn-primary" onClick={resetPassword} disabled={saving}>{saving?"Salvando...":"Redefinir senha"}</button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL NOVA EMPRESA */}
          {showNew && (
            <div className="vp-modal-bg" onClick={()=>setShowNew(false)}>
              <div className="vp-modal" role="dialog" aria-modal="true" aria-labelledby="sa-new-t" onClick={e=>e.stopPropagation()}>
                <div className="vp-modal-head">
                  <h2 id="sa-new-t">Nova empresa</h2>
                  <button className="pg-x" onClick={()=>setShowNew(false)} aria-label="Fechar"><X size={16} aria-hidden/></button>
                </div>
                <div className="vp-modal-body">
                  <div className="vp-field"><label htmlFor="sa-n-name">Nome da empresa</label>
                    <input id="sa-n-name" className="vp-input" value={newForm.name} onChange={e=>setNewForm({...newForm,name:e.target.value})} placeholder="Ex: Mercadinho da Maria"/></div>
                  <div className="vp-field"><label htmlFor="sa-n-email">E-mail do proprietário</label>
                    <input id="sa-n-email" className="vp-input" value={newForm.email} onChange={e=>setNewForm({...newForm,email:e.target.value})} placeholder="email@exemplo.com" type="email"/></div>
                  <div className="vp-field"><label htmlFor="sa-n-pwd">Senha inicial</label>
                    <input id="sa-n-pwd" className="vp-input" value={newForm.password} onChange={e=>setNewForm({...newForm,password:e.target.value})} placeholder="Senha de acesso" type="password"/></div>
                  <div className="vp-field"><label htmlFor="sa-n-plan">Plano</label>
                    <select id="sa-n-plan" className="vp-select" value={newForm.plan} onChange={e=>setNewForm({...newForm,plan:e.target.value})}>
                      <option value="pro">Pro — R$ 150/mês</option>
                      <option value="business">Business — R$ 200/mês</option>
                      <option value="trial">Trial — 7 dias grátis</option>
                    </select></div>
                </div>
                <div className="vp-modal-foot">
                  <button className="vp-btn vp-btn-ghost" onClick={()=>setShowNew(false)}>Cancelar</button>
                  <button className="vp-btn vp-btn-primary" onClick={createCompany} disabled={newSaving}>{newSaving?"Criando...":"Criar empresa"}</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
