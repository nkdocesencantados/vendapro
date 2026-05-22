"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"

export default function SettingsPage() {
  const { user: authUser } = useAuthStore()
  const [tab, setTab] = useState<"loja"|"perfil">("loja")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName]   = useState("")
  const [color, setColor] = useState("#1D9E75")
  const [goal, setGoal]   = useState("")
  const [lowStock, setLowStock] = useState("5")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [newPwd, setNewPwd] = useState("")

  const COLORS = ["#1D9E75","#04342C","#D946EF","#E11D48","#2563EB","#F59E0B","#7C3AED","#0EA5E9","#16A34A","#DC2626"]

  useEffect(() => {
    const sc = localStorage.getItem("storeConfig")
    if(sc) {
      try {
        const s = JSON.parse(sc)
        setName(s.name||""); setColor(s.primaryColor||"#1D9E75"); setGoal(String(s.monthlyGoal||"")); setLowStock(String(s.lowStockThreshold||"5"))
      } catch{}
    }
    api.get("/stores").then(r => {
      const s = Array.isArray(r.data) ? r.data[0] : r.data
      if(s) {
        setName(s.name||""); setColor(s.primaryColor||"#1D9E75"); setGoal(s.monthlyGoal?String(s.monthlyGoal):""); setLowStock(String(s.lowStockThreshold||"5"))
        localStorage.setItem("storeConfig", JSON.stringify(s))
      }
    }).catch(()=>{})
    if(authUser) { setUserName(authUser.name||""); setUserEmail(authUser.email||"") }
  }, [authUser])

  async function saveStore() {
    setSaving(true)
    try {
      const sc = localStorage.getItem("storeConfig")
      const store = sc ? JSON.parse(sc) : {}
      await api.patch(`/stores/${store.id}`, { name, primaryColor:color, monthlyGoal:+goal||0, lowStockThreshold:+lowStock||5 })
      localStorage.setItem("storeConfig", JSON.stringify({...store,name,primaryColor:color,monthlyGoal:+goal||0,lowStockThreshold:+lowStock||5}))
      setSaved(true); setTimeout(()=>setSaved(false),2500)
      window.dispatchEvent(new Event("storeConfigUpdated"))
    } catch(e:any){ alert(e?.response?.data?.message||"Erro ao salvar") }
    finally { setSaving(false) }
  }

  async function saveProfile() {
    setSaving(true)
    try {
      await api.patch(`/users/${authUser?.id}`, { name: userName, ...(newPwd?{password:newPwd}:{}) })
      setSaved(true); setTimeout(()=>setSaved(false),2500)
    } catch(e:any){ alert(e?.response?.data?.message||"Erro") }
    finally { setSaving(false) }
  }

  const initials = name.slice(0,2).toUpperCase() || "ML"
  const userInit = userName.split(" ").map((x:string)=>x[0]).join("").slice(0,2).toUpperCase() || "U"

  return (
    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:800,margin:"0 auto"}}>
      <style>{`
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand,#1D9E75);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand,#1D9E75);box-shadow:0 0 0 3px rgba(29,158,117,0.12);}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;}
        .tab-row{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:16px;}
        .tab{padding:9px 14px;font-size:13px;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;}
        .tab.on{color:var(--text);border-bottom-color:var(--brand,#1D9E75);font-weight:500;}
        .setting-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border);}
        .setting-row:last-child{border:none;}
        .toggle{width:36px;height:20px;border-radius:999px;flex-shrink:0;position:relative;cursor:pointer;}
        .toggle.on{background:var(--brand,#1D9E75);}
        .toggle.off{background:var(--surface-3);}
        .toggle::after{content:"";position:absolute;top:3px;width:14px;height:14px;border-radius:50%;background:white;}
        .toggle.on::after{right:3px;}
        .toggle.off::after{left:3px;}
        .save-btn{width:100%;padding:12px;background:var(--brand,#1D9E75);color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;}
        .save-btn:disabled{background:var(--text-subtle);}
      `}</style>

      <div style={{marginBottom:16}}>
        <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Configurações</h1>
        <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>Personalize sua loja e perfil</div>
      </div>

      {saved && (
        <div style={{marginBottom:14,padding:"10px 14px",background:"rgba(29,158,117,0.1)",border:"1px solid #1D9E75",borderRadius:10,fontSize:13,color:"#1D9E75",fontWeight:500}}>
          Salvo com sucesso!
        </div>
      )}

      <div className="tab-row">
        <div className={`tab${tab==="loja"?" on":""}`} onClick={()=>setTab("loja")}>Minha Loja</div>
        <div className={`tab${tab==="perfil"?" on":""}`} onClick={()=>setTab("perfil")}>Meu Perfil</div>
      </div>

      {tab === "loja" && (
        <>
          <div className="card">
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:52,height:52,borderRadius:12,background:color,display:"grid",placeItems:"center",fontSize:16,fontWeight:700,color:"white",flexShrink:0}}>{initials}</div>
              <div>
                <div style={{fontSize:15,fontWeight:600,color:"var(--text)"}}>{name||"Minha Loja"}</div>
                <div style={{fontSize:12,color:"var(--text-subtle)",marginTop:2}}>Proprietário</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div className="vp-field"><label>Nome da loja</label><input className="vp-input" value={name} onChange={e=>setName(e.target.value)} /></div>
              <div className="vp-field">
                <label>Meta mensal (R$)</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:10,color:"var(--text-subtle)",fontSize:13}}>R$</span>
                  <input className="vp-input" type="number" value={goal} onChange={e=>setGoal(e.target.value)} style={{paddingLeft:32}} placeholder="0" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{fontSize:12,fontWeight:500,color:"var(--text-muted)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Cor principal</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COLORS.map(c=>(
                <button key={c} onClick={()=>setColor(c)} style={{width:38,height:38,borderRadius:9,background:c,border:color===c?"3px solid var(--text)":"2px solid transparent",cursor:"pointer",transition:"all .12s"}} title={c}/>
              ))}
            </div>
            <div style={{marginTop:12,padding:12,background:"var(--surface-2)",borderRadius:8,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:8,background:color,display:"grid",placeItems:"center",fontSize:12,fontWeight:700,color:"white"}}>{initials}</div>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:"var(--text)"}}>{name||"Minha Loja"}</div>
                <div style={{fontSize:11,color:"var(--text-subtle)"}}>Preview da cor</div>
              </div>
              <div style={{marginLeft:"auto",padding:"6px 12px",background:color,color:"white",borderRadius:8,fontSize:11,fontWeight:600}}>Botao</div>
            </div>
          </div>

          <button className="save-btn" onClick={saveStore} disabled={saving}>{saving?"Salvando...":"Salvar alterações"}</button>
        </>
      )}

      {tab === "perfil" && (
        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:color,color:"white",display:"grid",placeItems:"center",fontSize:18,fontWeight:700}}>{userInit}</div>
            <div>
              <div style={{fontWeight:600,fontSize:15,color:"var(--text)"}}>{userName||"Usuário"}</div>
              <div style={{fontSize:12,color:"var(--text-subtle)"}}>Proprietário</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div className="vp-field"><label>Nome completo</label><input className="vp-input" value={userName} onChange={e=>setUserName(e.target.value)} /></div>
            <div className="vp-field"><label>E-mail</label><input className="vp-input" value={userEmail} disabled style={{opacity:0.6}} /></div>
            <div className="vp-field"><label>Nova senha</label><input className="vp-input" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Deixe em branco para não alterar" /></div>
          </div>
          <button className="save-btn" onClick={saveProfile} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
        </div>
      )}
    </div>
  )
}


