"use client"
import { VendaProLogo } from "@/components/logo"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"
import { useRouter } from "next/navigation"

export default function SuperAdminPage() {
  const { user, isAuthenticated, loadUser, logout } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState("empresas")
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:"", email:"", phone:"", document:"", plan:"basic", password:"" })
  const [stats, setStats] = useState({ total:0, active:0, blocked:0, trial:0 })
  const [resetModal, setResetModal] = useState<{companyId:string, name:string}|null>(null)
  const [planModal, setPlanModal] = useState<{companyId:string, name:string, plan:string}|null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [resetting, setResetting] = useState(false)

  useEffect(() => { if (!isAuthenticated) loadUser(); loadCompanies() }, [])

  async function loadCompanies() {
    try {
      const r = await api.get("/companies")
      setCompanies(r.data)
      setStats({
        total: r.data.length,
        active: r.data.filter((c:any) => c.status==="active").length,
        blocked: r.data.filter((c:any) => c.status==="blocked").length,
        trial: r.data.filter((c:any) => c.plan==="trial").length,
      })
    } catch {} finally { setLoading(false) }
  }

  async function createCompany() {
    if (!form.name || !form.email || !form.password) return alert("Preencha nome, email e senha")
    try {
      await api.post("/companies", form)
      setShowForm(false)
      setForm({ name:"", email:"", phone:"", document:"", plan:"basic", password:"" })
      loadCompanies()
      alert("Empresa criada! O cliente ja pode fazer login.")
    } catch (e:any) { alert("Erro: " + (e?.response?.data?.message || "verifique o console")) }
  }

  async function changePlan(plan: string) {
    if (!planModal) return
    try {
      await api.patch(`/companies/${planModal.companyId}/plan`, { plan })
      setPlanModal(null)
      loadCompanies()
    } catch { alert("Erro ao alterar plano") }
  }

  async function resetPassword() {
    if (!newPassword || newPassword.length < 6) return alert("Senha deve ter ao menos 6 caracteres")
    if (!resetModal) return
    setResetting(true)
    try {
      await api.patch(`/companies/${resetModal.companyId}/reset-password`, { password: newPassword })
      alert("Senha redefinida com sucesso!")
      setResetModal(null)
      setNewPassword("")
    } catch { alert("Erro ao redefinir senha") }
    finally { setResetting(false) }
  }

  async function toggleStatus(id: string, status: string) {
    const newStatus = status==="active" ? "blocked" : "active"
    if (!confirm(newStatus==="blocked" ? "Bloquear esta empresa?" : "Reativar esta empresa?")) return
    try { await api.patch(`/companies/${id}/plan`, { status: newStatus }); loadCompanies() } catch { alert("Erro") }
  }

  async function deleteCompany(id: string, name: string) {
    if (!confirm(`Excluir a empresa "${name}"? Esta acao nao pode ser desfeita.`)) return
    try { await api.delete(`/companies/${id}`); loadCompanies() } catch { alert("Erro ao excluir") }
  }

  const planLabel: any = { trial:"Trial", basic:"Basic", pro:"Pro", enterprise:"Enterprise" }
  const planColor: any = { trial:"#f59e0b", basic:"#3b82f6", pro:"#8b5cf6", enterprise:"#1D9E75" }
  const navItems = ["Empresas","Assinaturas","Relatorios"]

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"DM Sans, sans-serif",background:"#f5f4f0"}}>
      <aside style={{width:"220px",background:"#04342C",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:"10px"}}>
          <VendaProLogo size={32} />
        </div>
        <nav style={{flex:1,padding:"12px 8px"}}>
          {navItems.map(item => (
            <div key={item} onClick={() => setTab(item.toLowerCase())} style={{padding:"9px 12px",borderRadius:"8px",color:tab===item.toLowerCase()?"white":"rgba(255,255,255,0.5)",fontSize:"13px",cursor:"pointer",background:tab===item.toLowerCase()?"#1D9E75":"transparent",marginBottom:"2px",fontWeight:tab===item.toLowerCase()?500:400}}>{item}</div>
          ))}
        </nav>
        <div style={{padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"30px",height:"30px",background:"#1D9E75",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"12px",fontWeight:600}}>{user?.name?.charAt(0)||"A"}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:"12px",fontWeight:500,color:"white"}}>{user?.name}</div>
            <div style={{fontSize:"10px",color:"#9FE1CB",opacity:0.6}}>Super Admin</div>
          </div>
          <button onClick={()=>{logout();router.push("/login")}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:"12px"}}>sair</button>
        </div>
      </aside>

      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 24px",height:"54px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontSize:"15px",fontWeight:500}}>Painel Administrativo</div>
            <div style={{fontSize:"11px",color:"#888"}}>Gestao de empresas e assinaturas</div>
          </div>
          {tab==="empresas" && <button onClick={()=>setShowForm(true)} style={{background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:500}}>+ Liberar Empresa</button>}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"24px"}}>

          {/* ABA EMPRESAS */}
          {tab==="empresas" && <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"24px"}}>
              {[
                { label:"Total de Empresas", value:stats.total, color:"#3b82f6" },
                { label:"Empresas Ativas", value:stats.active, color:"#1D9E75" },
                { label:"Em Trial", value:stats.trial, color:"#f59e0b" },
                { label:"Bloqueadas", value:stats.blocked, color:"#ef4444" },
              ].map(s => (
                <div key={s.label} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px 20px"}}>
                  <div style={{fontSize:"11px",color:"#888",marginBottom:"10px"}}>{s.label}</div>
                  <div style={{fontSize:"32px",fontWeight:700,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>

            {showForm && (
              <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
                  <h3 style={{fontWeight:500,fontSize:"15px",margin:0}}>Liberar Nova Empresa</h3>
                  <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#888",fontSize:"20px"}}>x</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
                  {[["Nome da Empresa *","name","text"],["Email *","email","email"],["Senha *","password","password"],["Telefone","phone","text"],["CNPJ/CPF","document","text"]].map(([label,field,type]) => (
                    <div key={field}><label style={{fontSize:"12px",color:"#666",display:"block",marginBottom:"4px"}}>{label}</label><input type={type} value={(form as any)[field]} onChange={e=>setForm({...form,[field]:e.target.value})} style={{width:"100%",padding:"9px",border:"1px solid #e5e7eb",borderRadius:"7px",fontSize:"13px",boxSizing:"border-box"}} /></div>
                  ))}
                  <div><label style={{fontSize:"12px",color:"#666",display:"block",marginBottom:"4px"}}>Plano</label><select value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})} style={{width:"100%",padding:"9px",border:"1px solid #e5e7eb",borderRadius:"7px",fontSize:"13px"}}><option value="trial">Trial (15 dias)</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></div>
                </div>
                <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
                  <button onClick={()=>setShowForm(false)} style={{padding:"9px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
                  <button onClick={createCompany} style={{padding:"9px 20px",background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:500}}>Liberar Acesso</button>
                </div>
              </div>
            )}

            <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:"0.5px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:"14px",fontWeight:500}}>Empresas Cadastradas</div>
                <div style={{fontSize:"12px",color:"#888"}}>{companies.length} empresa(s)</div>
              </div>
              {loading ? (
                <div style={{padding:"60px",textAlign:"center",color:"#888"}}>Carregando...</div>
              ) : companies.length===0 ? (
                <div style={{padding:"60px",textAlign:"center",color:"#888"}}>Nenhuma empresa cadastrada</div>
              ) : (
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:"#f9fafb"}}>
                      {["Empresa","Email","Telefone","Plano","Status","Cadastro","Acoes"].map(h => (
                        <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:"11px",color:"#888",fontWeight:500,borderBottom:"0.5px solid #e5e7eb"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((co:any) => (
                      <tr key={co.id} style={{borderBottom:"0.5px solid #f3f4f6"}}>
                        <td style={{padding:"14px 16px",fontSize:"14px",fontWeight:500}}>{co.name}</td>
                        <td style={{padding:"14px 16px",fontSize:"13px",color:"#666"}}>{co.email||"-"}</td>
                        <td style={{padding:"14px 16px",fontSize:"13px",color:"#666"}}>{co.phone||"-"}</td>
                        <td style={{padding:"14px 16px"}}><span style={{background:planColor[co.plan]+"22",color:planColor[co.plan],padding:"3px 10px",borderRadius:"20px",fontSize:"12px",fontWeight:500}}>{planLabel[co.plan]||co.plan}</span></td>
                        <td style={{padding:"14px 16px"}}><span style={{background:co.status==="active"?"#E1F5EE":"#fee2e2",color:co.status==="active"?"#1D9E75":"#ef4444",padding:"3px 10px",borderRadius:"20px",fontSize:"12px",fontWeight:500}}>{co.status==="active"?"Ativa":"Bloqueada"}</span></td>
                        <td style={{padding:"14px 16px",fontSize:"12px",color:"#888"}}>{new Date(co.createdAt).toLocaleDateString("pt-BR")}</td>
                        <td style={{padding:"14px 16px",display:"flex",gap:"6px"}}>
                          <button onClick={()=>toggleStatus(co.id,co.status)} style={{padding:"6px 12px",border:"1px solid",borderColor:co.status==="active"?"#ef4444":"#1D9E75",color:co.status==="active"?"#ef4444":"#1D9E75",background:"white",borderRadius:"7px",fontSize:"12px",cursor:"pointer",fontWeight:500}}>
                            {co.status==="active"?"Bloquear":"Reativar"}
                          </button>
                          <button onClick={()=>deleteCompany(co.id,co.name)} style={{padding:"6px 12px",border:"1px solid #ef4444",color:"white",background:"#ef4444",borderRadius:"7px",fontSize:"12px",cursor:"pointer",fontWeight:500}}>Excluir</button>
                          <button onClick={()=>{setResetModal({companyId:co.id,name:co.name});setNewPassword("")}} style={{padding:"6px 12px",border:"1px solid #f59e0b",color:"#f59e0b",background:"white",borderRadius:"7px",fontSize:"12px",cursor:"pointer",fontWeight:500}}>Senha</button>
                          <button onClick={()=>setPlanModal({companyId:co.id,name:co.name,plan:co.plan||"basic"})} style={{padding:"6px 12px",border:"1px solid #3b82f6",color:"#3b82f6",background:"white",borderRadius:"7px",fontSize:"12px",cursor:"pointer",fontWeight:500}}>Plano</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>}

          {/* ABA ASSINATURAS */}
          {tab==="assinaturas" && (
            <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:"0.5px solid #e5e7eb"}}>
                <div style={{fontSize:"14px",fontWeight:500}}>Assinaturas</div>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#f9fafb"}}>
                    {["Empresa","Plano","Status","Cadastro"].map(h => (
                      <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:"11px",color:"#888",fontWeight:500,borderBottom:"0.5px solid #e5e7eb"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companies.map((co:any) => (
                    <tr key={co.id} style={{borderBottom:"0.5px solid #f3f4f6"}}>
                      <td style={{padding:"14px 16px",fontSize:"14px",fontWeight:500}}>{co.name}</td>
                      <td style={{padding:"14px 16px"}}><span style={{background:planColor[co.plan]+"22",color:planColor[co.plan],padding:"3px 10px",borderRadius:"20px",fontSize:"12px",fontWeight:500}}>{planLabel[co.plan]||co.plan}</span></td>
                      <td style={{padding:"14px 16px"}}><span style={{background:co.status==="active"?"#E1F5EE":"#fee2e2",color:co.status==="active"?"#1D9E75":"#ef4444",padding:"3px 10px",borderRadius:"20px",fontSize:"12px",fontWeight:500}}>{co.status==="active"?"Ativa":"Bloqueada"}</span></td>
                      <td style={{padding:"14px 16px",fontSize:"12px",color:"#888"}}>{new Date(co.createdAt).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ABA RELATORIOS */}
          {tab==="relatorios" && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
              {[
                { label:"Total de Empresas", value:stats.total, color:"#3b82f6" },
                { label:"Ativas", value:stats.active, color:"#1D9E75" },
                { label:"Bloqueadas", value:stats.blocked, color:"#ef4444" },
                { label:"Em Trial", value:stats.trial, color:"#f59e0b" },
                { label:"Plano Basic", value:companies.filter(c=>c.plan==="basic").length, color:"#3b82f6" },
                { label:"Plano Pro", value:companies.filter(c=>c.plan==="pro").length, color:"#8b5cf6" },
              ].map(s => (
                <div key={s.label} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px"}}>
                  <div style={{fontSize:"12px",color:"#888",marginBottom:"10px"}}>{s.label}</div>
                  <div style={{fontSize:"36px",fontWeight:700,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {planModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:"12px",padding:"24px",width:"380px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontWeight:500,marginBottom:"8px"}}>Alterar Plano</h3>
            <p style={{fontSize:"13px",color:"#888",marginBottom:"20px"}}>Empresa: <strong>{planModal.name}</strong></p>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"20px"}}>
              {[
                {value:"trial",label:"Trial — 7 dias gratis",desc:"Acesso completo por 7 dias",color:"#f59e0b"},{value:"basic",label:"Basic — R$ 100/mes",desc:"Funcionalidades essenciais",color:"#6b7280"},
                
                {value:"pro",label:"Pro — R$ 150/mes",desc:"Ate 5 vendedores, ranking e metas",color:"#8b5cf6"},
                {value:"business",label:"Business — R$ 200/mes",desc:"Vendedores ilimitados, tudo liberado",color:"#1D9E75"},
              ].map(p => (
                <div key={p.value} onClick={()=>setPlanModal({...planModal,plan:p.value})} style={{padding:"12px 16px",border:`2px solid ${planModal.plan===p.value?p.color:"#e5e7eb"}`,borderRadius:"10px",cursor:"pointer",background:planModal.plan===p.value?"#f9fafb":"white"}}>
                  <div style={{fontWeight:500,fontSize:"14px",color:p.color}}>{p.label}</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{p.desc}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
              <button onClick={()=>setPlanModal(null)} style={{padding:"9px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
              <button onClick={()=>changePlan(planModal.plan)} style={{padding:"9px 16px",background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:500}}>Salvar Plano</button>
            </div>
          </div>
        </div>
      )}
      {resetModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:"12px",padding:"24px",width:"360px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontWeight:500,marginBottom:"8px"}}>Redefinir Senha</h3>
            <p style={{fontSize:"13px",color:"#888",marginBottom:"16px"}}>Empresa: <strong>{resetModal.name}</strong></p>
            <label style={{fontSize:"12px",color:"#666",display:"block",marginBottom:"4px"}}>Nova senha</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Minimo 6 caracteres" style={{width:"100%",padding:"10px",border:"1px solid #e5e7eb",borderRadius:"8px",fontSize:"13px",marginBottom:"16px",boxSizing:"border-box"}} />
            <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
              <button onClick={()=>{setResetModal(null);setNewPassword("")}} style={{padding:"9px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
              <button onClick={resetPassword} disabled={resetting} style={{padding:"9px 16px",background:resetting?"#9ca3af":"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:500}}>{resetting?"Salvando...":"Redefinir"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



