"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

const PLAN_LABEL: Record<string,string> = { trial:"Trial", basic:"Basic", starter:"Basic", pro:"Pro", business:"Business" }
const PLAN_COLOR: Record<string,string> = {
  trial:"#1E40AF", basic:"#57534E", starter:"#57534E", pro:"#1D9E75", business:"#04342C"
}
const PLAN_BG: Record<string,string> = {
  trial:"#DBEAFE", basic:"#F5F5F4", starter:"#F5F5F4", pro:"#E7F5EF", business:"linear-gradient(135deg,#04342C,#1D9E75)"
}

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

  useEffect(() => { load() }, [])

  async function load() {
    try { const r = await api.get("/companies"); setCompanies(r.data) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }

  function showToast(msg:string) { setToast(msg); setTimeout(()=>setToast(""),3000) }

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

  const mrr = companies.filter(c=>c.status==="active").reduce((a,c)=>a+({basic:100,starter:100,pro:150,business:200}[(c.plan||'').toLowerCase()]||0),0)

  return (
    <div style={{minHeight:"100vh",background:"#04130F",color:"#E5F2EC",fontFamily:'"Geist",ui-sans-serif,system-ui,sans-serif'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;}
        .sa-card{background:#0F1B18;border:1px solid #1F3A33;border-radius:14px;}
        .sa-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;}
        .sa-tbl th{text-align:left;font-weight:500;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#7A8480;padding:10px 16px;border-bottom:1px solid #1F3A33;background:#0A1412;}
        .sa-tbl td{padding:13px 16px;border-bottom:1px solid #1F3A33;vertical-align:middle;color:#E5F2EC;}
        .sa-tbl tr:last-child td{border-bottom:0;}
        .sa-tbl tr:hover td{background:rgba(29,158,117,0.04);}
        .sa-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;font-family:inherit;}
        .sa-btn-primary{background:#1D9E75;color:white;border-color:#1D9E75;}
        .sa-btn-primary:hover{background:#178A65;}
        .sa-btn-ghost{background:transparent;color:#A8B3AF;border-color:#1F3A33;}
        .sa-btn-ghost:hover{background:#142421;color:#E5F2EC;}
        .sa-btn-danger{background:rgba(185,28,28,0.15);color:#EF4444;border-color:rgba(185,28,28,0.2);}
        .sa-btn-danger:hover{background:#B91C1C;color:white;}
        .sa-btn-warn{background:rgba(180,83,9,0.15);color:#F59E0B;border-color:rgba(180,83,9,0.2);}
        .sa-btn-warn:hover{background:#B45309;color:white;}
        .sa-btn-sm{padding:4px 10px;font-size:11px;border-radius:6px;}
        .sa-input{background:#0A1412;border:1px solid #1F3A33;border-radius:8px;padding:8px 12px;font-size:13px;outline:none;color:#E5F2EC;width:100%;font-family:inherit;transition:border-color .12s;}
        .sa-input:focus{border-color:#1D9E75;box-shadow:0 0 0 3px rgba(29,158,117,0.1);}
        .sa-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;}
        .sa-modal{width:min(560px,94vw);background:#0F1B18;border:1px solid #1F3A33;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,0.6);}
        .sa-modal-head{padding:18px 22px;border-bottom:1px solid #1F3A33;display:flex;align-items:center;justify-content:space-between;}
        .sa-modal-head h2{margin:0;font-size:17px;font-weight:600;color:#F0F7F4;}
        .sa-modal-body{padding:22px;}
        .sa-modal-foot{padding:14px 22px;border-top:1px solid #1F3A33;display:flex;gap:8px;justify-content:flex-end;background:#0A1412;border-radius:0 0 16px 16px;}
        .sa-tabs{display:flex;gap:2px;border-bottom:1px solid #1F3A33;margin-bottom:24px;}
        .sa-tab{padding:10px 18px;font-size:13px;color:#7A8480;border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;transition:all .12s;}
        .sa-tab.active{color:#F0F7F4;border-bottom-color:#1D9E75;font-weight:500;}
        .sa-tab:hover{color:#E5F2EC;}
        .plan-card{padding:16px;border:2px solid #1F3A33;border-radius:12px;cursor:pointer;transition:all .15s;background:#0A1412;}
        .plan-card:hover{border-color:#1D9E75;background:rgba(29,158,117,0.05);}
        .plan-card.selected{border-color:#1D9E75;background:rgba(29,158,117,0.1);}
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",top:16,right:16,zIndex:999,background:"#0F1B18",border:"1px solid #1D9E75",borderRadius:10,padding:"12px 18px",fontSize:13,color:"#34D399",fontWeight:500,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
          ✓ {toast}
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{display:"flex",height:"100vh"}}>
        <aside style={{width:240,background:"#04130F",borderRight:"1px solid #1F3A33",display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"18px 16px 14px",borderBottom:"1px solid #1F3A33"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,background:"#0E2620",border:"1px solid #1F3A33"}}>
              <div style={{width:32,height:32,borderRadius:8,background:"#1D9E75",display:"grid",placeItems:"center",flexShrink:0}}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#F0F7F4"}}>VendaPro</div>
                <div style={{fontSize:11,color:"#7A9990"}}>Super Admin</div>
              </div>
            </div>
          </div>
          <nav style={{padding:"10px 8px",flex:1}}>
            {[["empresas","Empresas","🏢"],["assinaturas","Assinaturas","💳"],["relatórios","Relatórios","📊"]].map(([id,lbl,ico])=>(
              <div key={id} onClick={()=>setTab(id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,fontSize:13.5,color:tab===id?"#fff":"#8DA39A",cursor:"pointer",background:tab===id?"rgba(29,158,117,0.18)":"transparent",fontWeight:tab===id?500:400,marginBottom:1,transition:"all .12s"}}>
                <span>{ico}</span><span>{lbl}</span>
              </div>
            ))}
          </nav>
          <div style={{padding:"10px 12px",borderTop:"1px solid #1F3A33"}}>
            <div onClick={()=>router.push("/login")}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,fontSize:13,color:"#8DA39A",cursor:"pointer",transition:"all .12s"}}
              onMouseEnter={e=>(e.currentTarget.style.background="#0E2620")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              <span>↩</span><span>Sair</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{flex:1,overflowY:"auto",padding:28}}>
          {/* STATS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
            {[
              {lbl:"Total de empresas",val:stats.total,col:"#E5F2EC"},
              {lbl:"Empresas ativas",val:stats.active,col:"#34D399"},
              {lbl:"Em trial",val:stats.trial,col:"#60A5FA"},
              {lbl:"Bloqueadas",val:stats.blocked,col:"#EF4444"},
            ].map(s=>(
              <div key={s.lbl} className="sa-card" style={{padding:18}}>
                <div style={{fontSize:12,color:"#7A8480",fontWeight:500,marginBottom:8}}>{s.lbl}</div>
                <div style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",color:s.col}}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div className="sa-tabs">
            {[["empresas","Empresas"],["assinaturas","Assinaturas"],["relatórios","Relatórios"]].map(([id,lbl])=>(
              <div key={id} className={`sa-tab${tab===id?" active":""}`} onClick={()=>setTab(id)}>{lbl}</div>
            ))}
          </div>

          {tab === "empresas" && (
            <div className="sa-card">
              {/* FILTROS */}
              <div style={{padding:"14px 18px",borderBottom:"1px solid #1F3A33",display:"flex",gap:6}}>
                {[["all","Todas"],["active","Ativas"],["trial","Trial"],["inactive","Bloqueadas"]].map(([v,l])=>(
                  <button key={v} className={`sa-btn sa-btn-sm ${filter===v?"sa-btn-primary":"sa-btn-ghost"}`} onClick={()=>setFilter(v)}>{l}</button>
                ))}
              </div>

              {loading ? (
                <div style={{textAlign:"center",padding:48,color:"#7A8480"}}>Carregando...</div>
              ) : (
                <table className="sa-tbl">
                  <thead>
                    <tr><th>Empresa</th><th>Email</th><th>Plano</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((c:any)=>(
                      <tr key={c.id}>
                        <td style={{fontWeight:500}}>{c.name}</td>
                        <td style={{color:"#A8B3AF",fontSize:12}}>{c.email||"—"}</td>
                        <td>
                          <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:500,background:PLAN_BG[c.plan]||"#F5F5F4",color:PLAN_COLOR[c.plan]||"#57534E"}}>
                            {PLAN_LABEL[c.plan]||c.plan}
                          </span>
                        </td>
                        <td>
                          <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:500,background:c.status==="active"?"rgba(29,158,117,0.14)":"rgba(185,28,28,0.14)",color:c.status==="active"?"#34D399":"#EF4444"}}>
                            <span style={{width:5,height:5,borderRadius:"50%",background:"currentColor",display:"inline-block"}}/>
                            {c.status==="active"?"Ativa":"Bloqueada"}
                          </span>
                        </td>
                        <td style={{color:"#7A8480",fontSize:12}}>{c.createdAt?new Date(c.createdAt).toLocaleDateString("pt-BR"):"—"}</td>
                        <td>
                          <div style={{display:"flex",gap:4}}>
                            <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={()=>setPlanModal(c)}>Plano</button>
                            <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={()=>{setPwdModal(c);setNewPwd("")}}>Senha</button>
                            <button className={`sa-btn sa-btn-sm ${c.status==="active"?"sa-btn-warn":"sa-btn-primary"}`} onClick={()=>toggleStatus(c)}>
                              {c.status==="active"?"Bloquear":"Ativar"}
                            </button>
                            <button className="sa-btn sa-btn-danger sa-btn-sm" onClick={()=>deleteCompany(c)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "assinaturas" && (
            <div style={{display:"grid",gap:16}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                {[
                  {lbl:"MRR",val:BRL(mrr),col:"#34D399"},
                  {lbl:"ARR projetado",val:BRL(mrr*12),col:"#E5F2EC"},
                  {lbl:"Ticket médio",val:BRL(stats.active?mrr/stats.active:0),col:"#E5F2EC"},
                  {lbl:"Empresas pagas",val:String(stats.active),col:"#E5F2EC"},
                ].map(s=>(
                  <div key={s.lbl} className="sa-card" style={{padding:18}}>
                    <div style={{fontSize:12,color:"#7A8480",fontWeight:500,marginBottom:8}}>{s.lbl}</div>
                    <div style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:s.col,fontFamily:'"Geist Mono",monospace'}}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div className="sa-card">
                <div style={{padding:"14px 18px",borderBottom:"1px solid #1F3A33",fontSize:14,fontWeight:600,color:"#F0F7F4"}}>Distribuicao por plano</div>
                <div style={{padding:18,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                  {["basic","pro","business","trial"].map(p=>{
                    const count = companies.filter(c=>c.plan===p||c.plan==="starter"&&p==="basic").length
                    return (
                      <div key={p} style={{padding:14,background:"#0A1412",borderRadius:10,border:"1px solid #1F3A33"}}>
                        <span style={{display:"inline-flex",padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:500,background:PLAN_BG[p],color:PLAN_COLOR[p]}}>{PLAN_LABEL[p]}</span>
                        <div style={{fontSize:24,fontWeight:600,marginTop:8,color:"#E5F2EC"}}>{count}</div>
                        <div style={{fontSize:11,color:"#7A8480"}}>empresas</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "relatórios" && (
            <div className="sa-card" style={{padding:24}}>
              <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:600,color:"#F0F7F4"}}>Resumo geral</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                {[
                  ["Total empresas",stats.total],
                  ["Empresas ativas",stats.active],
                  ["Em trial",stats.trial],
                  ["Bloqueadas",stats.blocked],
                  ["MRR",BRL(mrr)],
                  ["ARR projetado",BRL(mrr*12)],
                ].map(([lbl,val])=>(
                  <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #1F3A33",fontSize:13}}>
                    <span style={{color:"#A8B3AF"}}>{lbl}</span>
                    <strong style={{color:"#E5F2EC",fontFamily:'"Geist Mono",monospace'}}>{val}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PLANO */}
      {planModal && (
        <div className="sa-modal-bg" onClick={()=>setPlanModal(null)}>
          <div className="sa-modal" onClick={e=>e.stopPropagation()}>
            <div className="sa-modal-head">
              <h2>Alterar plano — {planModal.name}</h2>
              <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={()=>setPlanModal(null)}>✕</button>
            </div>
            <div className="sa-modal-body">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {id:"trial",name:"Trial",price:"Gratis",sub:"7 dias"},
                  {id:"basic",name:"Basic",price:"R$ 100",sub:"/mês"},
                  {id:"pro",name:"Pro",price:"R$ 150",sub:"/mês"},
                  {id:"business",name:"Business",price:"R$ 200",sub:"/mês"},
                ].map(p=>(
                  <div key={p.id} className={`plan-card${planModal.plan===p.id?" selected":""}`} onClick={()=>savePlan(planModal.id,p.id)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,color:"#F0F7F4"}}>{p.name}</div>
                        <div style={{marginTop:4}}>
                          <span style={{fontSize:20,fontWeight:600,letterSpacing:"-0.02em",color:"#F0F7F4",fontFamily:'"Geist Mono",monospace'}}>{p.price}</span>
                          <span style={{fontSize:12,color:"#7A8480"}}>{p.sub}</span>
                        </div>
                      </div>
                      <span style={{display:"inline-flex",padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:500,background:PLAN_BG[p.id],color:PLAN_COLOR[p.id]}}>{p.name}</span>
                    </div>
                    {planModal.plan===p.id && <div style={{marginTop:8,fontSize:11,color:"#1D9E75",fontWeight:500}}>✓ Plano atual</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SENHA */}
      {pwdModal && (
        <div className="sa-modal-bg" onClick={()=>setPwdModal(null)}>
          <div className="sa-modal" onClick={e=>e.stopPropagation()}>
            <div className="sa-modal-head">
              <h2>Redefinir senha — {pwdModal.name}</h2>
              <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={()=>setPwdModal(null)}>✕</button>
            </div>
            <div className="sa-modal-body">
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:12,fontWeight:500,color:"#A8B3AF"}}>Nova senha</label>
                <input className="sa-input" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Min. 6 caracteres" />
              </div>
            </div>
            <div className="sa-modal-foot">
              <button className="sa-btn sa-btn-ghost" onClick={()=>setPwdModal(null)}>Cancelar</button>
              <button className="sa-btn sa-btn-primary" onClick={resetPassword} disabled={saving}>{saving?"Salvando...":"Redefinir"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

