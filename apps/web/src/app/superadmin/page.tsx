"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"
import { useRouter } from "next/navigation"

export default function SuperAdminPage() {
  const { user, isAuthenticated, loadUser, logout } = useAuthStore()
  const router = useRouter()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:"", email:"", phone:"", document:"", plan:"basic" })
  const [stats, setStats] = useState({ total:0, active:0, blocked:0, trial:0 })

  useEffect(() => {
    if (!isAuthenticated) loadUser()
    loadCompanies()
  }, [])

  async function loadCompanies() {
    try {
      const r = await api.get("/companies")
      setCompanies(r.data)
      const total = r.data.length
      const active = r.data.filter((c:any) => c.status==="active").length
      const blocked = r.data.filter((c:any) => c.status==="blocked").length
      const trial = r.data.filter((c:any) => c.plan==="trial").length
      setStats({ total, active, blocked, trial })
    } catch {} finally { setLoading(false) }
  }

  async function createCompany() {
    try { await api.post("/companies", form); setShowForm(false); setForm({ name:"", email:"", phone:"", document:"", plan:"basic" }); loadCompanies(); alert("Empresa criada!") } catch { alert("Erro ao criar empresa") }
  }

  async function toggleStatus(id: string, status: string) {
    const newStatus = status==="active" ? "blocked" : "active"
    try { await api.patch("/companies/"+id+"/status", { status: newStatus }); loadCompanies() } catch { alert("Erro") }
  }

  const statusColor: any = { active:"#1D9E75", blocked:"#ef4444", suspended:"#f59e0b" }
  const statusLabel: any = { active:"Ativa", blocked:"Bloqueada", suspended:"Suspensa" }

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"DM Sans, sans-serif"}}>
      <aside style={{width:"220px",background:"#04342C",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"16px",borderBottom:"1px solid rgba(255,255,255,0.08)+display:"flex",alignItems:"center",gap:"9px"}}>
          <div style={{width:"32px",height:"32px",background:"#1D9E75",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:"12px"}}>SA</div>
          <div>
            <div style={{fontSize:"14px",fontWeight:600,color:"white"}}>VendaPro</div>
            <div style={{fontSize:"10px",color:"#9FE1CB",opacity:0.6}}>Super Admin</div>
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 8px"}}>
          {[{label:"Empresas",icon:"Empresas"},{label:"Assinaturas",icon:"Assinaturas"},{label:"Relatorios",icon:"Relatorios"}].map(item=>(
            <div key={item.label} style={{padding:"8px 10px",borderRadius:"7px",color:"rgba(255,255,255,0.7)",fontSize:"13px",cursor:"pointer",marginBottom:"2px"}}>{item.label}</div>
          ))}
        </nav>
        <div style={{padding:"12px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"28px",height:"28px",background:"#1D9E75",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"11px"}}>{user?.name?.charAt(0)||"A"}</div>
          <div style={{flex:1,color:"white",fontSize:"12px"}}>{user?.name}</div>
          <button onClick={()=>{logout();router.push("/login")}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:"12px"}}>sair</button>
        </div>
      </aside>
      <main style={{flex:1,display:"flex",flexDirection:"column",background:"#f5f4f0",overflow:"hidden"}}>
        <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 24px",height:"54px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:"15px",fontWeight:500}}>Painel Administrativo</div>
          <button onClick={()=>setShowForm(true)} style={{background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",cursor:"pointer"}}>+ Nova Empresa</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"20px"}}>
            {[{label:"Total de Empresas",value:stats.total,color:"#3b82f6"},{label:"Ativas",value:stats.active,color:"#1D9E75"},{label:"Bloqueadas",value:stats.blocked,color:"#ef4444"},{label:"Em Trial",value:stats.trial,color:"#f59e0b"}].map(s=>(
              <div key={s.label} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
                <div style={{fontSize:"11px",color:"#888",marginBottom:"8px"}}>{s.label}</div>
                <div style={{fontSize:"28px",fontWeight:600,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>
          {showForm && (
            <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
              <h3 style={{fontWeight:500,marginBottom:"16px"}}>Nova Empresa</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
                {[["Nome da Empresa","name"],["Email","email"],["Telefone","phone"],["CNPJ/CPF","document"]].map(([label,field])=>(
                  <div key={field}><label style={{fontSize:"12px",color:"#666"}}>{label}</label><input value={(form as any)[field]} onChange={e=>setForm({...form,[field]:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}} /></div>
                ))}
                <div><label style={{fontSize:"12px",color:"#666"}}>Plano</label><select value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}}><option value="trial">Trial</option><option value="basic">Basic</option><option value="pro">Pro</option></select></div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
                <button onClick={()=>setShowForm(false)} style={{padding:"8px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
                <button onClick={createCompany} style={{padding:"8px 16px",background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Criar Empresa</button>
              </div>
            </div>
          )}
          <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:"0.5px solid #e5e7eb",fontSize:"13px",fontWeight:500}}>Empresas Cadastradas</div>
            {loading ? <div style={{padding:"40px",textAlign:"center",color:"#888"}}>Carregando...</div> : companies.length===0 ? (
              <div style={{padding:"60px",textAlign:"center",color:"#888"}}>Nenhuma empresa cadastrada.</div>
            ) : (
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"#f9fafb"}}>{["Empresa","Email","Plano","Status","Criada em","Acoes"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:"11px",color:"#888",fontWeight:500,borderBottom:"0.5px solid #e5e7eb"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {(companies as any[]).map((co:any)=>(
                    <tr key={co.id} style={{borderBottom:"0.5px solid #f3f4f6"}}>
                      <td style={{padding:"12px 16px",fontSize:"13px",fontWeight:500}}>{co.name}</td>
                      <td style={{padding:"12px 16px",fontSize:"13px",color:"#888"}}>{co.email}</td>
                      <td style={{padding:"12px 16px"}}>
                        <span style={{background:"#E1F5EE",color:"#0F6E56",padding:"3px 8px",borderRadius:"20px",fontSize:"11px"}}>{co.plan}</span>
                      </td>
                      <td style={{padding:"12px 16px"}}>
                        <span style={{background:co.status==="active"?"#E1F5EE":"#fee2e2",color:statusColor[co.status]||"#888",padding:"3px 8px",borderRadius:"20px",fontSize:"11px"}}>{statusLabel[co.status]||co.status}</span>
                      </td>
                      <td style={{padding:"12px 16px",fontSize:"12px",color:"#888"}}>{new Date(co.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td style={{padding:"12px 16px"}}>
                        <button onClick={()=>toggleStatus(co.id,co.status)} style={{padding:"5px 10px",border:"1px solid",borderColor:co.status==="active"?"#ef4444":"#1D9E75",color:co.status==="active"?"#ef4444":"#1D9E75",background:"white",borderRadius:"6px",fontSize:"12px",cursor:"pointer"}}>{co.status==="active"?"Bloquear":"Ativar"}</button>
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
