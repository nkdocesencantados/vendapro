"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export default function TeamPage() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [primary, setPrimary] = useState("#1D9E75")
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"seller", phone:"", commissionRate:15 })
  const [editCommission, setEditCommission] = useState(null)

  useEffect(() => {
    loadTeam()
    try {
      const c = localStorage.getItem("storeConfig")
      if (c) { const p = JSON.parse(c); if (p.primaryColor) setPrimary(p.primaryColor) }
    } catch {}
  }, [])

  async function loadTeam() {
    try { const r = await api.get("/users"); setTeam(r.data) } catch {} finally { setLoading(false) }
  }

  async function saveUser() {
    try {
      await api.post("/users", form)
      setShowForm(false)
      setForm({ name:"", email:"", password:"", role:"seller", phone:"", commissionRate:15 })
      loadTeam()
      alert("Funcionario salvo!")
    } catch { alert("Erro ao salvar") }
  }

  async function saveCommission() {
    if (!editCommission) return
    try {
      await api.patch("/users/" + editCommission.id, { commissionRate: Number(editCommission.rate) })
      setEditCommission(null)
      loadTeam()
    } catch { alert("Erro ao salvar comissao") }
  }

  const roleLabel = { seller:"Vendedor", manager:"Gerente", admin:"Admin", store_owner:"Dono da Loja", super_admin:"Super Admin" }
  const filtered = team.filter((u) => u.role !== "super_admin")

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {editCommission && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:"12px",padding:"24px",width:"320px"}}>
            <h3 style={{fontWeight:500,marginBottom:"8px"}}>Editar Comissao</h3>
            <p style={{fontSize:"13px",color:"#888",marginBottom:"16px"}}>{editCommission.name}</p>
            <label style={{fontSize:"12px",color:"#666",display:"block",marginBottom:"4px"}}>Comissao (%)</label>
            <input type="number" min="0" max="100" value={editCommission.rate} onChange={e=>setEditCommission({...editCommission,rate:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginBottom:"16px",boxSizing:"border-box"}} />
            <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
              <button onClick={()=>setEditCommission(null)} style={{padding:"8px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
              <button onClick={saveCommission} style={{padding:"8px 16px",background:primary,color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:500}}>Salvar</button>
            </div>
          </div>
        </div>
      )}
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 20px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500}}>Equipe</div>
        <button onClick={()=>setShowForm(true)} style={{background:primary,color:"white",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"13px",cursor:"pointer"}}>+ Novo Funcionario</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
        {showForm && (
          <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
            <h3 style={{marginBottom:"16px",fontWeight:500}}>Novo Funcionario</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              {[["Nome","name","text"],["Email","email","email"],["Senha","password","password"],["Telefone","phone","text"],["Comissao %","commissionRate","number"]].map(([label,field,type]) => (
                <div key={field}><label style={{fontSize:"12px",color:"#666"}}>{label}</label><input type={type} value={form[field]} onChange={e=>setForm({...form,[field]:type==="number"?+e.target.value:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px",boxSizing:"border-box"}} /></div>
              ))}
              <div><label style={{fontSize:"12px",color:"#666"}}>Cargo</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}}><option value="seller">Vendedor</option><option value="manager">Gerente</option><option value="admin">Admin</option></select></div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
              <button onClick={()=>setShowForm(false)} style={{padding:"8px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
              <button onClick={saveUser} style={{padding:"8px 16px",background:primary,color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Salvar</button>
            </div>
          </div>
        )}
        {loading ? <div style={{textAlign:"center",color:"#888",padding:"40px"}}>Carregando...</div> : filtered.length===0 ? (
          <div style={{textAlign:"center",color:"#888",padding:"60px"}}>Nenhum funcionario cadastrado.</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {filtered.map((u) => (
              <div key={u.id} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"10px",padding:"14px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"36px",height:"36px",background:primary,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:600,flexShrink:0}}>{u.name?.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:500,fontSize:"14px"}}>{u.name}</div>
                  <div style={{fontSize:"12px",color:"#888"}}>{u.email}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"12px",background:"#E1F5EE",color:"#0F6E56",padding:"3px 8px",borderRadius:"20px",marginBottom:"4px"}}>{roleLabel[u.role]||u.role}</div>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",justifyContent:"flex-end"}}>
                    <span style={{fontSize:"11px",color:"#1D9E75",fontWeight:500}}>{u.commissionRate ? u.commissionRate+"% comissao" : "Sem comissao"}</span>
                    <button onClick={()=>setEditCommission({id:u.id,name:u.name,rate:String(u.commissionRate||0)})} style={{fontSize:"10px",color:"#888",background:"none",border:"0.5px solid #e5e7eb",borderRadius:"4px",padding:"1px 6px",cursor:"pointer"}}>editar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}