"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [form, setForm] = useState({ name:user?.name||"", email:user?.email||"", currentPassword:"", newPassword:"" })
  const [saved, setSaved] = useState(false)

  async function saveProfile() {
    try { await api.patch("/users/profile", { name:form.name }); setSaved(true); setTimeout(()=>setSaved(false),3000) } catch { alert("Erro ao salvar") }
  }

  async function changePassword() {
    if (!form.currentPassword || !form.newPassword) return alert("Preencha as senhas")
    try { await api.patch("/users/password", { currentPassword:form.currentPassword, newPassword:form.newPassword }); setForm({...form,currentPassword:"",newPassword:""}); alert("Senha alterada!") } catch { alert("Senha atual incorreta") }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 20px",height:"50px",display:"flex",alignItems:"center",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500}}>Configuracoes</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px",maxWidth:"600px"}}>
        <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px",marginBottom:"16px"}}>
          <h3 style={{fontWeight:500,marginBottom:"16px"}}>Meu Perfil</h3>
          {saved && <div style={{background:"#E1F5EE",color:"#0F6E56",padding:"10px",borderRadius:"8px",marginBottom:"12px",fontSize:"13px"}}>Perfil salvo com sucesso!</div>}
          <div style={{marginBottom:"12px"}}>
            <label style={{fontSize:"12px",color:"#666"}}>Nome</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}} />
          </div>
          <div style={{marginBottom:"16px"}}>
            <label style={{fontSize:"12px",color:"#666"}}>Email</label>
            <input value={form.email} disabled style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px",background:"#f9f9f9",color:"#888"}} />
          </div>
          <button onClick={saveProfile} style={{padding:"8px 16px",background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Salvar Perfil</button>
        </div>
        <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px"}}>
          <h3 style={{fontWeight:500,marginBottom:"16px"}}>Alterar Senha</h3>
          {[["Senha atual","currentPassword"],["Nova senha","newPassword"]].map(([label,field])=>(
            <div key={field} style={{marginBottom:"12px"}}>
              <label style={{fontSize:"12px",color:"#666"}}>{label}</label>
              <input type="password" value={(form as any)[field]} onChange={e=>setForm({...form,[field]:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}} />
            </div>
          ))}
          <button onClick={changePassword} style={{padding:"8px 16px",background:"#04342C",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Alterar Senha</button>
        </div>
      </div>
    </div>
  )
}
