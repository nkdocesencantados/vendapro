"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"
import { useRouter } from "next/navigation"

export default function SuperAdminPage() {
  const { user, isAuthenticated, loadUser, logout } = useAuthStore()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:"", email:"", phone:"", document:"", plan:"trial", password:"" })
  const [stats, setStats] = useState({ total:0, active:0, blocked:0, trial:0 })

  useEffect(() => {
    if (!isAuthenticated) loadUser()
    loadCompanies()
  }, [])

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
    if (!form.name || !form.email) return alert("Preencha nome e email")
    try {
      await api.post("/companies", form)
      setShowForm(false)
      setForm({ name:"", email:"", phone:"", document:"", plan:"trial", password:"" })
      loadCompanies()
      alert("Empresa criada com sucesso!")
    } catch { alert("Erro ao criar empresa") }
  }

  async function toggleStatus(id: string, status: string) {
    const newStatus = status==="active" ? "blocked" : "active"
    const msg = newStatus==="blocked" ? "Bloquear esta empresa?" : "Reativar esta empresa?"
    if (!confirm(msg)) return
    try { await api.patch(`/companies/${id}/status`, { status: newStatus }); loadCompanies() } catch { alert("Erro") }
  }

  const planLabel: any = { trial:"Trial", basic:"Basic", pro:"Pro", enterprise:"Enterprise" }
  const planColor: any = { trial:"#f59e0b", basic:"#3b82f6", pro:"#8b5cf6", enterprise:"#1D9E75" }

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"DM Sans, sans-serif",background:"#f5f4f0"}}>
      <aside style={{width:"220px",background:"#04342C",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"36px",height:"36px",background:"#1D9E75",borderRadius:"9px",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:"13px"}}>SA</div>
          <div>
            <div style={{fontSize:"15px",fontWeight:600,color:"white"}}>VendaPro</div>
            <div style={{fontSize:"10px",color:"#9FE1CB",opacity:0.6}}>Super Admin</div>
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 8px"}}>
          {[
            { label:"Empresas", active:true },
            { label:"Assinaturas", active:false },
            { label:"Relatorios", active:false },
          ].map(item => (
            <div key={item.label} style={{padding:"9px 12px",borderRadius:"8px",color:item.active?"white":"rgba(255,255,255,0.5)",fontSize:"13px",cursor:"pointer",background:item.active?"#1D9E75":"transparent",marginBottom:"2px",fontWeight:item.active?500:400}}>{item.label}</div>
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
          <button onClick={()=>setShowForm(true)} style={{background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:500}}>+ Liberar Empresa</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"24px"}}>
            {[
              { label:"Total de Empresas", value:stats.total, color:"#3b82f6", bg:"#eff6ff" },
              { label:"Empresas Ativas", value:stats.active, color:"#1D9E75", bg:"#E1F5EE" },
              { label:"Em Trial", value:stats.trial, color:"#f59e0b", bg:"#fffbeb" },
              { label:"Bloqueadas", value:stats.blocked, color:"#ef4444", bg:"#fee2e2" },
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
                {[["Nome da Empresa *","name"],["Email *","email"],["Senha *","password"],["Telefone","phone"],["CNPJ/CPF","document"]].map(([label,field]) => (
                  <div key={field}><label style={{fontSize:"12px",color:"#666",display:"block",marginBottom:"4px"}}>{label}</label><input value={(form as any)[field]} onChange={e=>setForm({...form,[field]:e.target.value})} style={{width:"100%",padding:"9px",border:"1px solid #e5e7eb",borderRadius:"7px",fontSize:"13px"}} /></div>
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
              <div style={{padding:"60px",textAlign:"center",color:"#888"}}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>🏢</div>
                <div style={{fontWeight:500,marginBottom:"4px"}}>Nenhuma empresa cadastrada</div>
                <div style={{fontSize:"13px"}}>Clique em "Liberar Empresa" para comecar</div>
              </div>
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
                      <td style={{padding:"14px 16px"}}>
                        <span style={{background:planColor[co.plan]+"22",color:planColor[co.plan],padding:"3px 10px",borderRadius:"20px",fontSize:"12px",fontWeight:500}}>{planLabel[co.plan]||co.plan}</span>
                      </td>
                      <td style={{padding:"14px 16px"}}>
                        <span style={{background:co.status==="active"?"#E1F5EE":"#fee2e2",color:co.status==="active"?"#1D9E75":"#ef4444",padding:"3px 10px",borderRadius:"20px",fontSize:"12px",fontWeight:500}}>{co.status==="active"?"Ativa":"Bloqueada"}</span>
                      </td>
                      <td style={{padding:"14px 16px",fontSize:"12px",color:"#888"}}>{new Date(co.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td style={{padding:"14px 16px"}}>
                        <button onClick={()=>toggleStatus(co.id,co.status)} style={{padding:"6px 12px",border:"1px solid",borderColor:co.status==="active"?"#ef4444":"#1D9E75",color:co.status==="active"?"#ef4444":"#1D9E75",background:"white",borderRadius:"7px",fontSize:"12px",cursor:"pointer",fontWeight:500}}>
                          {co.status==="active"?"Bloquear":"Reativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}