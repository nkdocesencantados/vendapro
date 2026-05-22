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
  const [phone, setPhone] = useState("")

  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")

  const COLORS = ["#1D9E75","#04342C","#D946EF","#E11D48","#2563EB","#F59E0B","#7C3AED","#0EA5E9","#16A34A","#DC2626"]

  useEffect(() => {
    const sc = localStorage.getItem("storeConfig")
    if(sc) {
      try {
        const s = JSON.parse(sc)
        setName(s.name||""); setColor(s.primaryColor||"#1D9E75")
        setGoal(String(s.monthlyGoal||"")); setPhone(s.phone||"")
      } catch{}
    }
    api.get("/stores").then(r => {
      const s = Array.isArray(r.data) ? r.data[0] : r.data
      if(s) {
        setName(s.name||""); setColor(s.primaryColor||"#1D9E75")
        setGoal(s.monthlyGoal ? String(s.monthlyGoal) : "")
        setPhone(s.phone||"")
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
      await api.patch(`/stores/${store.id}`, { name, primaryColor:color, monthlyGoal:+goal||0 })
      localStorage.setItem("storeConfig", JSON.stringify({...store,name,primaryColor:color,monthlyGoal:+goal||0}))
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
    <div style={{padding:28,maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);} .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .vp-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:24px;}
        .vp-tab{padding:9px 16px;font-size:13px;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;transition:all .12s;}
        .vp-tab.active{color:var(--text);border-bottom-color:var(--brand);font-weight:500;}
        .vp-tab:hover{color:var(--text);}
        @media(max-width:1000px){.settings-grid{grid-template-columns:1fr!important;}}
      `}</style>

      <div style={{marginBottom:24}}>
        <h1 style={{margin:0,fontSize:26,fontWeight:600,letterSpacing:"-.02em"}}>Configuracoes</h1>
        <div style={{color:"var(--text-subtle)",fontSize:14,marginTop:4}}>Personalize sua loja e perfil</div>
      </div>

      {saved && (
        <div style={{marginBottom:16,padding:"10px 16px",background:"var(--success-bg)",border:"1px solid var(--success)",borderRadius:10,fontSize:13,color:"var(--success)",fontWeight:500}}>
          ✓ Salvo com sucesso!
        </div>
      )}

      <div className="vp-tabs">
        <div className={`vp-tab${tab==="loja"?" active":""}`} onClick={()=>setTab("loja")}>Minha Loja</div>
        <div className={`vp-tab${tab==="perfil"?" active":""}`} onClick={()=>setTab("perfil")}>Meu Perfil</div>
      </div>

      {tab === "loja" && (
        <div className="settings-grid" style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:18}}>
          {/* FORM */}
          <div className="vp-card" style={{padding:24}}>
            <h3 style={{margin:"0 0 18px",fontSize:15,fontWeight:600}}>Dados da loja</h3>
            <div style={{display:"grid",gap:14}}>
              <div className="vp-field">
                <label>Nome da loja</label>
                <input className="vp-input" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div className="vp-field">
                <label>Telefone / WhatsApp</label>
                <input className="vp-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="vp-field">
                <label>Meta mensal de faturamento (R$)</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:10,color:"var(--text-subtle)",fontSize:13}}>R$</span>
                  <input className="vp-input" type="number" value={goal} onChange={e=>setGoal(e.target.value)} style={{paddingLeft:32}} placeholder="0" />
                </div>
              </div>
              <div className="vp-field">
                <label>Cor principal</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setColor(c)} style={{width:36,height:36,borderRadius:8,background:c,border:color===c?"3px solid var(--text)":"2px solid var(--border)",cursor:"pointer",boxShadow:color===c?"0 0 0 2px var(--bg)":"none",transition:"all .12s"}} title={c} />
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button className="vp-btn vp-btn-primary" onClick={saveStore} disabled={saving}>{saving?"Salvando...":"Salvar alteracoes"}</button>
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          <div>
            <div style={{position:"sticky",top:80}}>
              <div style={{fontSize:12,fontWeight:500,color:"var(--text-subtle)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Pre-visualizacao</div>
              <div className="vp-card" style={{overflow:"hidden"}}>
                <div style={{padding:14,background:color,color:"white"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:9,background:"rgba(255,255,255,0.2)",display:"grid",placeItems:"center",fontSize:14,fontWeight:700}}>{initials}</div>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{name||"Minha Loja"}</div>
                      <div style={{fontSize:11,opacity:0.85}}>Painel principal</div>
                    </div>
                  </div>
                </div>
                <div style={{padding:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:12,color:"var(--text-subtle)"}}>Meta mensal</span>
                    <strong style={{fontFamily:"var(--font-mono)",fontSize:12}}>R$ 0 / R$ {(+goal||0).toLocaleString("pt-BR")}</strong>
                  </div>
                  <div style={{height:8,background:"var(--surface-2)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{width:"1%",height:"100%",background:color,borderRadius:999}} />
                  </div>
                  <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div style={{padding:12,background:"var(--surface-2)",borderRadius:8}}>
                      <div style={{fontSize:11,color:"var(--text-subtle)"}}>Vendas hoje</div>
                      <div style={{fontWeight:600,fontSize:16,marginTop:4,color:color}}>R$ 0</div>
                    </div>
                    <div style={{padding:12,background:"var(--surface-2)",borderRadius:8}}>
                      <div style={{fontSize:11,color:"var(--text-subtle)"}}>Estoque</div>
                      <div style={{fontWeight:600,fontSize:16,marginTop:4}}>—</div>
                    </div>
                  </div>
                  <button className="vp-btn" style={{marginTop:14,width:"100%",justifyContent:"center",background:color,color:"white"}}>Botao da loja</button>
                </div>
              </div>
              <div style={{marginTop:8,fontSize:11,color:"var(--text-subtle)",textAlign:"center"}}>A cor e aplicada em todo o sistema.</div>
            </div>
          </div>
        </div>
      )}

      {tab === "perfil" && (
        <div className="vp-card" style={{padding:24,maxWidth:540}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:color,color:"white",display:"grid",placeItems:"center",fontSize:22,fontWeight:700}}>{userInit}</div>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>{userName||"Usuario"}</div>
              <div style={{fontSize:12,color:"var(--text-subtle)"}}>Proprietario</div>
            </div>
          </div>
          <div style={{display:"grid",gap:14}}>
            <div className="vp-field"><label>Nome completo</label><input className="vp-input" value={userName} onChange={e=>setUserName(e.target.value)} /></div>
            <div className="vp-field"><label>E-mail</label><input className="vp-input" value={userEmail} disabled style={{opacity:0.6}} /></div>
            <div className="vp-field"><label>Nova senha</label><input className="vp-input" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Deixe em branco para nao alterar" /></div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="vp-btn vp-btn-primary" onClick={saveProfile} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
