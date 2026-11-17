"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { PIX_TYPES, pixKeyError } from "@/lib/pix"
import { useAuthStore } from "@/contexts/auth.store"

// abas que o lojista pode esconder (ids iguais aos do menu em dashboard/layout.tsx)
const MODULES = [
  { id:"vendas",     label:"Vendas",      desc:"Registrar vendas" },
  { id:"clientes",   label:"Clientes",    desc:"Cadastro de clientes" },
  { id:"fiado",      label:"Fiado",       desc:"Vendas a prazo e cobranças" },
  { id:"pix",        label:"Cobrar PIX",  desc:"QR Code e PIX copia e cola" },
  { id:"estoque",    label:"Estoque",     desc:"Produtos e quantidades" },
  { id:"caixa",      label:"Caixa",       desc:"Abertura e fechamento", business:true },
  { id:"recibos",    label:"Recibos",     desc:"Comprovantes de venda" },
  { id:"relatórios", label:"Relatórios",  desc:"Gráficos e exportação" },
  { id:"comissoes",  label:"Comissões",   desc:"Comissão de vendedores", business:true },
  { id:"equipe",     label:"Equipe",      desc:"Usuários da loja", business:true },
]

const PALETTES = [
  { id:"emerald",  name:"Verde Haux (padrão)", color:"#2DBE60", desc:"Identidade padrão" },
  { id:"indigo",   name:"Índigo",    color:"#6366F1", desc:"Sério, tecnológico" },
  { id:"amber",    name:"Âmbar",     color:"#F59E0B", desc:"Confeitaria, padaria, café" },
  { id:"crimson",  name:"Carmim",    color:"#E11D48", desc:"Açougue, lanchonete, brechó" },
  { id:"violet",   name:"Violeta",   color:"#8B5CF6", desc:"Ótica, salão, boutique" },
  { id:"ocean",    name:"Oceano",    color:"#0EA5E9", desc:"Papelaria, eletrônicos" },
  { id:"rose",     name:"Rosé",      color:"#EC4899", desc:"Floricultura, pet shop, doceria" },
  { id:"graphite", name:"Grafite",   color:"#94A3B8", desc:"Minimal, foco em dados" },
]
const THEMES: Record<string,{brand:string,brandDeep:string,brandGlow:string}> = {
  emerald: { brand:"#2DBE60", brandDeep:"#0B3A1F", brandGlow:"#7EE8A8" },
  amber:   { brand:"#F59E0B", brandDeep:"#3F1D04", brandGlow:"#FCD34D" },
  crimson: { brand:"#E11D48", brandDeep:"#3F0612", brandGlow:"#FB7185" },
  violet:  { brand:"#8B5CF6", brandDeep:"#2A1065", brandGlow:"#C4B5FD" },
  ocean:   { brand:"#0EA5E9", brandDeep:"#082F49", brandGlow:"#7DD3FC" },
  indigo:  { brand:"#6366F1", brandDeep:"#1E1B4B", brandGlow:"#A5B4FC" },
  rose:    { brand:"#F43F5E", brandDeep:"#4C0519", brandGlow:"#FDA4AF" },
  graphite:{ brand:"#64748B", brandDeep:"#0F172A", brandGlow:"#CBD5E1" },
}

const PIX_PLACEHOLDER: Record<string,string> = { cpf:"000.000.000-00", cnpj:"00.000.000/0000-00", email:"voce@email.com", phone:"(11) 9 0000-0000", random:"123e4567-e89b-12d3-a456-426614174000" }


export default function SettingsPage() {
  const { user: authUser } = useAuthStore()
  const [tab,      setTab]      = useState<"loja"|"perfil">("loja")
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [name,     setName]     = useState("")
  const [palette,  setPalette]  = useState("emerald")
  const [pixKeyType, setPixKeyType] = useState("cpf")
  const [pixKey,     setPixKey]     = useState("")
  const [pixName,    setPixName]    = useState("")
  const [pixCity,    setPixCity]    = useState("")
  const [goal,     setGoal]     = useState("")
  const [margin,   setMargin]   = useState("26")
  const [address,  setAddress]  = useState("")
  const [phone,    setPhone]    = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail,setUserEmail]= useState("")
  const [newPwd,   setNewPwd]   = useState("")
  const [storeId,  setStoreId]  = useState("")
  const [logo,     setLogo]     = useState("")
  const [logoMsg,  setLogoMsg]  = useState("")
  const [hidden,   setHidden]   = useState<string[]>([])
  const [plan,     setPlan]     = useState("business")
  const [modMsg,   setModMsg]   = useState("")

  async function toggleModule(id: string){
    const prev = hidden
    const next = hidden.includes(id) ? hidden.filter(m=>m!==id) : [...hidden, id]
    setHidden(next); setModMsg("Salvando…")
    try{
      await api.patch(`/stores/${storeId}`,{ hiddenModules: next })
      setModMsg("Menu atualizado.")
      window.dispatchEvent(new Event("storeConfigUpdated"))
    }catch(e:any){ setHidden(prev); setModMsg(e?.response?.data?.message || "Não foi possível salvar.") }
  }

  // reduz para 256px no navegador: a logo vira um data URL pequeno salvo junto da loja
  async function onLogoFile(file?: File){
    if(!file) return
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)){ setLogoMsg("Use uma imagem PNG, JPG ou WEBP."); return }
    try{
      const bmp = await createImageBitmap(file)
      const k = Math.min(1, 256/Math.max(bmp.width,bmp.height))
      const c = document.createElement("canvas"); c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k)
      c.getContext("2d")!.drawImage(bmp,0,0,c.width,c.height)
      const url = c.toDataURL("image/webp",0.85)
      await saveLogo(url.startsWith("data:image/webp") ? url : c.toDataURL("image/png"))
    }catch{ setLogoMsg("Não foi possível ler essa imagem.") }
  }
  async function saveLogo(url: string){
    setLogoMsg("Salvando…")
    try{
      await api.patch(`/stores/${storeId}`,{ logoUrl: url || null })
      setLogo(url); setLogoMsg(url ? "Logo salva." : "Logo removida.")
      window.dispatchEvent(new Event("storeConfigUpdated"))
    }catch(e:any){ setLogoMsg(e?.response?.data?.message || "Não foi possível salvar a logo.") }
  }

  const pixErr = pixKeyError(pixKeyType, pixKey)

  useEffect(()=>{
    applyPalette(localStorage.getItem("vp-palette") || "emerald")
    api.get("/stores").then(r=>{
      const s = Array.isArray(r.data)?r.data[0]:r.data
      if(s){
        setName(s.name||""); setGoal(s.monthlyGoal?String(s.monthlyGoal):""); setMargin(String(s.margin||"26")); setAddress(s.address||""); setStoreId(s.id||authUser?.storeId||""); if(s.phone)setPhone(s.phone); setLogo(s.logoUrl||""); setHidden(s.settings?.hiddenModules||[]); setPlan(s.plan||"business")
        setPixKeyType(s.pixKeyType||"cpf"); setPixKey(s.pixKey||""); setPixName(s.pixMerchantName||""); setPixCity(s.pixCity||"")
        localStorage.setItem("storeConfig", JSON.stringify(s))
      }
    }).catch(()=>{})
    if(authUser){ setUserName(authUser.name||""); setUserEmail(authUser.email||"") }
  },[authUser])

  function applyPalette(id: string){
    setPalette(id)
    localStorage.setItem("vp-palette", id)
    const r = document.documentElement
    r.setAttribute("data-palette", id)
    // Aplicar variáveis CSS imediatamente sem precisar recarregar
    const t = THEMES[id] || THEMES.emerald
    r.style.setProperty("--brand",      t.brand)
    r.style.setProperty("--brand-deep", t.brandDeep)
    r.style.setProperty("--brand-glow", t.brandGlow)
  }

  async function saveStore(){
    if(pixErr) return alert(pixErr)
    if(pixKey.trim() && (!pixName.trim() || !pixCity.trim())) return alert("Informe nome do recebedor e cidade para o PIX")
    setSaving(true)
    const pix = { pixKeyType, pixKey:pixKey.trim()||null, pixMerchantName:pixName.trim().slice(0,25)||null, pixCity:pixCity.trim().slice(0,15)||null }
    try{
      await api.patch(`/stores/${storeId}`,{ name, palette, monthlyGoal:+goal||0, address, margin:+margin||26, profitMargin:+margin||26, phone, ...pix })
      const sc = localStorage.getItem("storeConfig")
      const store = sc?JSON.parse(sc):{}
      localStorage.setItem("storeConfig", JSON.stringify({...store,name,palette,monthlyGoal:+goal||0,address,margin:+margin||26,profitMargin:+margin||26,phone,...pix}))
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
      <style dangerouslySetInnerHTML={{ __html: `
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
        .save-btn{width:100%;padding:13px;background:var(--brand);color:white;border:none;border-radius:var(--r-md);font-size:14px;font-weight:700;cursor:pointer;transition:var(--transition);font-family:var(--font);margin-top:8px;}
        .save-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
        .save-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
        .success-toast{padding:12px 16px;background:var(--success-bg);border:1px solid var(--brand);border-radius:var(--r);font-size:13px;color:var(--brand);font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
        .palette-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .palette-card{border:2px solid var(--border);border-radius:var(--r-md);padding:14px;cursor:pointer;transition:var(--transition);background:var(--surface-2);text-align:left;color:inherit;font:inherit;}
        .palette-card:hover{border-color:var(--border-strong);transform:translateY(-1px);}
        .palette-dot{width:40px;height:40px;border-radius:var(--r);margin-bottom:8px;display:flex;align-items:center;justify-content:center;}
        .palette-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;}
        .palette-desc{font-size:10px;color:var(--text-subtle);}
        @media(max-width:768px){.palette-grid{grid-template-columns:repeat(2,1fr);} .st-row{grid-template-columns:1fr;}}
      ` }} />

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

            <div className="st-field">
              <label className="st-label">Telefone / WhatsApp</label>
              <input className="st-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 9 0000-0000"/>
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

          {/* LOGO */}
          <div className="st-section" data-tour="logo">
            <div className="st-section-title">Logo da loja</div>
            <div className="st-section-sub">Aparece no menu lateral e nos recibos. PNG, JPG ou WEBP; reduzimos o tamanho automaticamente.</div>
            <div style={{display:"flex",alignItems:"center",gap:14,marginTop:12,flexWrap:"wrap"}}>
              <div style={{width:64,height:64,borderRadius:12,border:"1px dashed var(--border-strong)",background:"var(--surface-2)",display:"grid",placeItems:"center",overflow:"hidden",color:"var(--text-subtle)",fontSize:11}}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo ? <img src={logo} alt="Logo atual" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "Sem logo"}
              </div>
              <label className="vp-btn vp-btn-secondary vp-btn-sm" style={{cursor:"pointer"}}>
                {logo ? "Trocar logo" : "Enviar logo"}
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{onLogoFile(e.target.files?.[0]); e.target.value=""}}/>
              </label>
              {logo && <button type="button" className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>saveLogo("")}>Remover</button>}
              {logoMsg && <span role="status" style={{fontSize:12,color:"var(--text-muted)"}}>{logoMsg}</span>}
            </div>
          </div>

          {/* ABAS DO MENU */}
          <div className="st-section" data-tour="abas" id="abas">
            <div className="st-section-title">Abas do menu</div>
            <div className="st-section-sub">Desligue o que sua loja não usa. Nada é apagado: ligue de novo quando quiser e a aba volta com todos os dados.</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,marginTop:12}}>
              {MODULES.map(m=>{
                const locked = m.business && plan!=="business"
                const on = !hidden.includes(m.id) && !locked
                return (
                  <label key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"1px solid var(--border)",borderRadius:"var(--r-md)",background:"var(--surface-2)",cursor:locked?"not-allowed":"pointer",opacity:locked?.55:1}}>
                    <input type="checkbox" role="switch" checked={on} disabled={locked||!storeId} onChange={()=>toggleModule(m.id)} style={{accentColor:"var(--brand)",width:18,height:18}}/>
                    <span style={{display:"flex",flexDirection:"column",minWidth:0}}>
                      <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{m.label}</span>
                      <span style={{fontSize:11,color:"var(--text-subtle)"}}>{locked ? "Disponível no Plano Business" : m.desc}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {modMsg && <div role="status" style={{fontSize:12,color:"var(--text-muted)",marginTop:8}}>{modMsg}</div>}
          </div>

          {/* PALETAS */}
          <div className="st-section">
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div>
                <div className="st-section-title">Cores da loja</div>
                <div className="st-section-sub">Escolha a paleta do seu painel. A cor é aplicada na hora em todo o sistema.</div>
              </div>
              <button type="button" className="vp-btn vp-btn-secondary vp-btn-sm" disabled={palette==="emerald"} onClick={()=>applyPalette("emerald")}>Restaurar padrão</button>
            </div>
            <div className="palette-grid" role="radiogroup" aria-label="Paleta de cores">
              {PALETTES.map(p=>(
                <button type="button" key={p.id} role="radio" aria-checked={palette===p.id} className="palette-card"
                  style={{borderColor: palette===p.id ? p.color : undefined}}
                  onClick={()=>applyPalette(p.id)}>
                  <div className="palette-dot" style={{background:p.color}}>
                    {palette===p.id && <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <div className="palette-name">{p.name}</div>
                  <div className="palette-desc">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* PIX */}
          <div className="st-section">
            <div className="st-section-title">Recebimento PIX</div>
            <div className="st-section-sub">Usado para gerar o QR Code e o código copia e cola nos recibos e cobranças de fiado</div>

            <div className="st-row">
              <div className="st-field">
                <label className="st-label" htmlFor="pix-type">Tipo de chave</label>
                <select id="pix-type" className="st-input" value={pixKeyType} onChange={e=>setPixKeyType(e.target.value)}>
                  {PIX_TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="st-field">
                <label className="st-label" htmlFor="pix-key">Chave PIX</label>
                <input id="pix-key" className="st-input" value={pixKey} onChange={e=>setPixKey(e.target.value)} placeholder={PIX_PLACEHOLDER[pixKeyType]} aria-invalid={!!pixErr}/>
                {pixErr && <span style={{fontSize:12,color:"var(--danger)"}}>{pixErr}</span>}
              </div>
            </div>
            <div className="st-row">
              <div className="st-field">
                <label className="st-label" htmlFor="pix-name">Nome do recebedor</label>
                <input id="pix-name" className="st-input" maxLength={25} value={pixName} onChange={e=>setPixName(e.target.value)} placeholder="Como aparece no app do banco"/>
              </div>
              <div className="st-field">
                <label className="st-label" htmlFor="pix-city">Cidade</label>
                <input id="pix-city" className="st-input" maxLength={15} value={pixCity} onChange={e=>setPixCity(e.target.value)} placeholder="São Paulo"/>
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
