"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"

const PALETTES = [
  { id:"emerald",  name:"Esmeralda", color:"#1D9E75", desc:"Confiável, equilibrado" },
  { id:"indigo",   name:"Índigo",    color:"#6366F1", desc:"Sério, tecnológico" },
  { id:"amber",    name:"Âmbar",     color:"#F59E0B", desc:"Confeitaria, padaria, café" },
  { id:"crimson",  name:"Carmim",    color:"#E11D48", desc:"Açougue, lanchonete, brechó" },
  { id:"violet",   name:"Violeta",   color:"#8B5CF6", desc:"Ótica, salão, boutique" },
  { id:"ocean",    name:"Oceano",    color:"#0EA5E9", desc:"Papelaria, eletrônicos" },
  { id:"rose",     name:"Rosé",      color:"#EC4899", desc:"Floricultura, pet shop, doceria" },
  { id:"graphite", name:"Grafite",   color:"#94A3B8", desc:"Minimal, foco em dados" },
]

function PaletteBar({ color }: { color: string }) {
  const shades = [color+"CC","#888","#555","#333","#222"]
  return (
    <div style={{display:"flex",gap:2,marginTop:6}}>
      {shades.map((c,i)=>(
        <div key={i} style={{flex:1,height:4,borderRadius:2,background:i===0?color:`${color}${["55","33","22","11"][i-1]}`}}/>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { user: authUser } = useAuthStore()
  const [tab,      setTab]      = useState<"loja"|"perfil">("loja")
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [name,     setName]     = useState("")
  const [palette,  setPalette]  = useState("emerald")
  const [goal,     setGoal]     = useState("")
  const [margin,   setMargin]   = useState("26")
  const [address,  setAddress]  = useState("")
  const [phone,    setPhone]    = useState("")
  const [cnpj,     setCnpj]     = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail,setUserEmail]= useState("")
  const [newPwd,   setNewPwd]   = useState("")
  const [storeId,  setStoreId]  = useState("")

  const activePalette = PALETTES.find(p=>p.id===palette) || PALETTES[0]

  useEffect(()=>{
    const saved = localStorage.getItem("vp-palette") || "emerald"
    setPalette(saved)
    api.get("/stores").then(r=>{
      const s = Array.isArray(r.data)?r.data[0]:r.data
      if(s){
        setName(s.name||""); setGoal(s.monthlyGoal?String(s.monthlyGoal):""); setMargin(String(s.margin||"26")); setAddress(s.address||""); setStoreId(s.id||authUser?.storeId||""); if(s.phone)setPhone(s.phone); if(s.cnpj)setCnpj(s.cnpj)
        if(s.palette){ setPalette(s.palette); applyPalette(s.palette) }
        localStorage.setItem("storeConfig", JSON.stringify(s))
      }
    }).catch(()=>{})
    if(authUser){ setUserName(authUser.name||""); setUserEmail(authUser.email||"") }
  },[authUser])

  function applyPalette(id: string){
    setPalette(id)
    document.documentElement.setAttribute("data-palette", id)
    localStorage.setItem("vp-palette", id)
  }

  async function saveStore(){
    setSaving(true)
    try{
      await api.patch(`/stores/${storeId}`,{ name, palette, monthlyGoal:+goal||0, address, margin:+margin||26, profitMargin:+margin||26, phone, cnpj })
      const sc = localStorage.getItem("storeConfig")
      const store = sc?JSON.parse(sc):{}
      localStorage.setItem("storeConfig", JSON.stringify({...store,name,palette,monthlyGoal:+goal||0,address,margin:+margin||26,profitMargin:+margin||26,phone,cnpj}))
      setSaved(true); setTimeout(()=>setSaved(false),2500)
      window.dispatchEvent(new Event("storeConfigUpdated"))
    }catch(e:any){ alert(e?.response?.data?.message||"Erro ao salvar") }
    finally{ setSaving(false) }
  }

  async function saveProfile(){
    setSaving(true)
    try{
      await api.patch(`/users/${authUser?.id}`,{ name:userName, ...(newPwd?{password:newPwd}:{}) })
      setSaved(true); setTimeout(()=>setSaved(false),2500)
    }catch(e:any){ alert(e?.response?.data?.message||"Erro") }
    finally{ setSaving(false) }
  }

  const initials = name.slice(0,2).toUpperCase()||"ML"
  const userInit = userName.split(" ").map((x:string)=>x[0]).join("").slice(0,2).toUpperCase()||"U"

  return (
    <div style={{maxWidth:960,margin:"0 auto"}}>
      <style>{`
        .st-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:24px;}
        .st-tab{padding:10px 16px;font-size:13px;color:var(--text-subtle);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;transition:var(--transition);}
        .st-tab:hover{color:var(--text);}
        .st-tab.on{color:var(--brand);border-bottom-color:var(--brand);font-weight:600;}
        .st-section{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:24px;margin-bottom:16px;}
        .st-section-title{font-size:13px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;}
        .st-section-sub{font-size:12px;color:var(--text-subtle);margin-bottom:20px;}
        .st-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
        .st-label{font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;}
        .st-input{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r);padding:10px 14px;font-size:13px;color:var(--text);font-family:var(--font);outline:none;width:100%;transition:var(--transition);}
        .st-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-glow);}
        .st-input::placeholder{color:var(--text-subtle);}
        .st-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .palette-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .palette-card{border:2px solid var(--border);border-radius:var(--r-md);padding:14px;cursor:pointer;transition:var(--transition);background:var(--surface-2);}
        .palette-card:hover{border-color:var(--border-strong);transform:translateY(-1px);}
        .palette-card.active{border-width:2px;}
        .palette-dot{width:40px;height:40px;border-radius:var(--r);margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:white;}
        .palette-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;}
        .palette-desc{font-size:10px;color:var(--text-subtle);}
        .preview-box{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px;margin-top:20px;}
        .preview-title{font-size:11px;font-weight:700;color:var(--text-subtle);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px;}
        .preview-kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:16px;flex:1;}
        .save-btn{width:100%;padding:13px;background:var(--brand);color:white;border:none;border-radius:var(--r-md);font-size:14px;font-weight:700;cursor:pointer;transition:var(--transition);font-family:var(--font);margin-top:8px;}
        .save-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
        .save-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
        .success-toast{padding:12px 16px;background:var(--success-bg);border:1px solid var(--brand);border-radius:var(--r);font-size:13px;color:var(--brand);font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
        @media(max-width:768px){.palette-grid{grid-template-columns:repeat(2,1fr);} .st-row{grid-template-columns:1fr;}}
      `}</style>

      {/* HEADER */}
      <div style={{marginBottom:24}}>
        <h1 style={{margin:0,fontSize:"clamp(22px,3vw,30px)",fontWeight:700,letterSpacing:"-.03em",color:"var(--text)"}}>Configurações</h1>
        <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:4}}>Personalize sua loja e experiência</div>
      </div>

      {saved && (
        <div className="success-toast">
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
          Alterações salvas com sucesso!
        </div>
      )}

      {/* TABS */}
      <div className="st-tabs">
        <div className={`st-tab${tab==="loja"?" on":""}`} onClick={()=>setTab("loja")}>Minha Loja</div>
        <div className={`st-tab${tab==="perfil"?" on":""}`} onClick={()=>setTab("perfil")}>Meu Perfil</div>
      </div>

      {tab==="loja" && (
        <>
          {/* INFO DA LOJA */}
          <div className="st-section">
            <div className="st-section-title">Informações da loja</div>
            <div className="st-section-sub">Dados básicos da sua loja</div>

            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,padding:16,background:"var(--surface-2)",borderRadius:12,border:"1px solid var(--border)"}}>
              <div style={{width:56,height:56,borderRadius:14,background:"var(--brand)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"white",flexShrink:0,boxShadow:"var(--shadow-glow)"}}>{initials}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{name||"Minha Loja"}</div>
                <div style={{fontSize:12,color:"var(--text-subtle)",marginTop:3}}>Painel principal</div>
              </div>
            </div>

            <div className="st-field">
              <label className="st-label">Nome da loja</label>
              <input className="st-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Doceria Maria Flor"/>
            </div>

            <div className="st-field">
              <label className="st-label">Endereço</label>
              <input className="st-input" value={address} onChange={e=>setAddress(e.target.value)} placeholder="R. das Flores, 142 — São Paulo/SP"/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div className="st-field" style={{marginBottom:0}}>
                <label className="st-label">CNPJ / CPF</label>
                <input className="st-input" value={cnpj} onChange={e=>setCnpj(e.target.value)} placeholder="00.000.000/0001-00"/>
              </div>
              <div className="st-field" style={{marginBottom:0}}>
                <label className="st-label">Telefone / WhatsApp</label>
                <input className="st-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 9 0000-0000"/>
              </div>
            </div>

            <div className="st-row">
              <div className="st-field">
                <label className="st-label">Meta mensal (R$)</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-subtle)",fontSize:13,pointerEvents:"none"}}>R$</span>
                  <input className="st-input" type="number" value={goal} onChange={e=>setGoal(e.target.value)} style={{paddingLeft:36}} placeholder="0"/>
                </div>
              </div>
              <div className="st-field">
                <label className="st-label">Margem de lucro (%)</label>
                <div style={{position:"relative"}}>
                  <input className="st-input" type="number" min="0" max="100" value={margin} onChange={e=>setMargin(e.target.value)} style={{paddingRight:32}} placeholder="26"/>
                  <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-subtle)",fontSize:13,pointerEvents:"none"}}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* PALETAS */}
          <div className="st-section">
            <div className="st-section-title">Identidade visual</div>
            <div className="st-section-sub">Escolha uma paleta — cada uma traz uma cor principal, profunda e um glow ambiental</div>

            <div className="palette-grid">
              {PALETTES.map(p=>(
                <div key={p.id} className={`palette-card${palette===p.id?" active":""}`}
                  style={{borderColor: palette===p.id ? p.color : undefined}}
                  onClick={()=>applyPalette(p.id)}>
                  <div className="palette-dot" style={{background:p.color}}>
                    {palette===p.id && (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                  </div>
                  <div className="palette-name">{p.name}</div>
                  <div style={{fontSize:10,color:"var(--text-subtle)",fontFamily:"var(--font-mono)",marginBottom:4}}>{p.color}</div>
                  <div className="palette-desc">{p.desc}</div>
                  <PaletteBar color={p.color}/>
                </div>
              ))}
            </div>

            {/* PREVIEW */}
            <div className="preview-box">
              <div className="preview-title">Pré-visualização</div>
              <div style={{background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <div style={{width:32,height:32,borderRadius:8,background:activePalette.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"white"}}>{initials}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{name||"Minha Loja"}</div>
                    <div style={{fontSize:10,color:"var(--text-subtle)"}}>Painel principal</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:10,marginBottom:12}}>
                  <div className="preview-kpi">
                    <div style={{fontSize:10,color:"var(--text-subtle)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Meta mensal</div>
                    <div style={{fontFamily:"var(--font-mono)",fontSize:18,fontWeight:700,color:activePalette.color}}>R$ {goal||"0"}</div>
                  </div>
                  <div className="preview-kpi">
                    <div style={{fontSize:10,color:"var(--text-subtle)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Vendas hoje</div>
                    <div style={{fontFamily:"var(--font-mono)",fontSize:18,fontWeight:700,color:"var(--text)"}}>R$ 0</div>
                  </div>
                </div>
                <button style={{width:"100%",padding:"10px",background:activePalette.color,color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--font)"}}>
                  + Nova venda
                </button>
                <div style={{fontSize:11,color:"var(--text-subtle)",textAlign:"center",marginTop:10}}>A cor é aplicada em todo o sistema da sua loja.</div>
              </div>
            </div>
          </div>

          <button className="save-btn" onClick={saveStore} disabled={saving}>
            {saving?"Salvando...":"Salvar alterações"}
          </button>
        </>
      )}

      {tab==="perfil" && (
        <div className="st-section">
          <div className="st-section-title">Meu perfil</div>
          <div className="st-section-sub">Suas informações pessoais</div>

          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,padding:16,background:"var(--surface-2)",borderRadius:12,border:"1px solid var(--border)"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:"var(--brand)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,flexShrink:0,boxShadow:"var(--shadow-glow)"}}>{userInit}</div>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>{userName||"Usuário"}</div>
              <div style={{fontSize:12,color:"var(--brand)",marginTop:2,fontWeight:600}}>Proprietário</div>
            </div>
          </div>

          <div className="st-field">
            <label className="st-label">Nome completo</label>
            <input className="st-input" value={userName} onChange={e=>setUserName(e.target.value)} placeholder="Seu nome"/>
          </div>
          <div className="st-field">
            <label className="st-label">E-mail</label>
            <input className="st-input" value={userEmail} disabled style={{opacity:0.5,cursor:"not-allowed"}}/>
          </div>
          <div className="st-field">
            <label className="st-label">Nova senha</label>
            <input className="st-input" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Deixe em branco para não alterar"/>
          </div>

          <button className="save-btn" onClick={saveProfile} disabled={saving}>
            {saving?"Salvando...":"Salvar perfil"}
          </button>
        </div>
      )}
    </div>
  )
}
