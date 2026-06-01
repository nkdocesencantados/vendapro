"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/contexts/auth.store"

const PALETTES = [
  { id:"emerald", color:"#1D9E75", name:"Esmeralda", desc:"Confiável, equilibrado" },
  { id:"ocean",   color:"#0EA5E9", name:"Oceano",    desc:"Papelaria, eletrônicos" },
  { id:"violet",  color:"#8B5CF6", name:"Violeta",   desc:"Ótica, salão, boutique" },
  { id:"crimson", color:"#E11D48", name:"Carmim",    desc:"Açougue, lanchonete" },
  { id:"amber",   color:"#F59E0B", name:"Âmbar",     desc:"Confeitaria, padaria" },
  { id:"indigo",  color:"#6366F1", name:"Índigo",    desc:"Sério, tecnológico" },
  { id:"rose",    color:"#EC4899", name:"Rosé",      desc:"Floricultura, doceria" },
  { id:"graphite",color:"#94A3B8", name:"Grafite",   desc:"Minimal, foco em dados" },
]

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

const Logo = ({ size = 32, color = "#1D9E75" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="32" height="32" rx="8" ry="8" fill={color}/>
    <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="#fff">
      <path d="M16 8 L24 22 L8 22 Z" fill="none"/>
      <circle cx="16" cy="8"  r="2.4"/>
      <circle cx="24" cy="22" r="2.4"/>
      <circle cx="8"  cy="22" r="2.4"/>
    </g>
  </svg>
)

const BAR_HEIGHTS = [46, 60, 52, 78, 66, 84, 70]
const DAYS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]
const BAR_OPACITIES = [0.25, 0.30, 0.25, 0.50, 0.35, 0.55, 0.40]

function MockupCard({ color }: { color: string }) {
  const rgb = hexToRgb(color)
  const palName = PALETTES.find(p => p.color === color)?.name?.toLowerCase() || "paleta"

  return (
    <div style={{
      background:`radial-gradient(ellipse at 60% 0%, ${color}22 0%, transparent 60%),
                  radial-gradient(ellipse at 20% 80%, ${color}15 0%, transparent 55%),
                  #0a1628`,
      border:`1px solid ${color}30`,
      borderRadius:16,
      overflow:"hidden",
      boxShadow:`0 0 0 1px ${color}15, 0 24px 60px rgba(0,0,0,0.6), 0 0 80px ${color}10`,
      backdropFilter:"blur(12px)",
      position:"relative",
    }}>
      {/* aurora orb */}
      <div style={{
        position:"absolute",top:"-30%",right:"-10%",
        width:"55%",height:"70%",
        background:`radial-gradient(circle, ${color}40 0%, transparent 65%)`,
        filter:"blur(40px)",
        pointerEvents:"none",
      }}/>

      {/* titlebar */}
      <div style={{
        background:"rgba(0,0,0,0.3)",
        backdropFilter:"blur(8px)",
        padding:"9px 14px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        borderBottom:`1px solid ${color}20`,
        position:"relative",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:"#FF5F57",boxShadow:"0 0 4px #FF5F5788"}}/>
          <div style={{width:9,height:9,borderRadius:"50%",background:"#FFBD2E",boxShadow:"0 0 4px #FFBD2E88"}}/>
          <div style={{width:9,height:9,borderRadius:"50%",background:"#28C840",boxShadow:"0 0 4px #28C84088"}}/>
        </div>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"monospace",letterSpacing:"-.01em"}}>
          vendapro.com.br/{palName}
        </span>
        <div style={{width:50}}/>
      </div>

      {/* body */}
      <div style={{padding:"14px 16px 12px",position:"relative"}}>
        {/* KPI + mini linha */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".09em",marginBottom:3}}>FATURAMENTO HOJE</div>
            <div style={{fontFamily:"'Geist Mono','Courier New',monospace",fontSize:22,fontWeight:700,color:"white",lineHeight:1,letterSpacing:"-.02em",
              textShadow:`0 0 20px ${color}66`}}>
              R$&nbsp;<span style={{color,filter:`drop-shadow(0 0 6px ${color}88)`}}>{`4.872`}</span>
            </div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.38)",marginTop:3}}>▲ 18%&nbsp;vs ontem</div>
          </div>
          <svg viewBox="0 0 100 44" style={{width:120,height:44,flexShrink:0,filter:`drop-shadow(0 0 4px ${color}66)`}}>
            <defs>
              <linearGradient id="lg-line" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{stopColor:color,stopOpacity:0.35}}/>
                <stop offset="100%" style={{stopColor:color,stopOpacity:0.02}}/>
              </linearGradient>
            </defs>
            <polygon points="0,44 0,34 17,27 33,31 50,18 67,24 83,11 100,4 100,44" fill="url(#lg-line)"/>
            <polyline points="0,34 17,27 33,31 50,18 67,24 83,11 100,4" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        </div>

        {/* curva de receita animada */}
        <div style={{marginTop:12,height:120,position:"relative"}}>
          <svg viewBox="0 0 500 180" preserveAspectRatio="none" style={{width:"100%",height:"100%",display:"block",overflow:"visible"}}>
            <defs>
              <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.38"/>
                <stop offset="100%" stopColor={color} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <g stroke={`${color}18`} strokeWidth="1">
              <line x1="0" y1="20" x2="500" y2="20"/>
              <line x1="0" y1="65" x2="500" y2="65"/>
              <line x1="0" y1="110" x2="500" y2="110"/>
              <line x1="0" y1="155" x2="500" y2="155"/>
            </g>
            <path fill='url(#curve-fill)' d="M0,150 L45,118 L90,140 L135,82 L180,112 L225,58 L270,98 L315,44 L360,80 L405,30 L450,62 L500,22 L500,180 L0,180 Z"/>
            <path id="login-curve" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
              style={{filter:`drop-shadow(0 0 6px ${color}bb)`,strokeDasharray:9999,strokeDashoffset:9999,animation:"lcdraw 2.4s cubic-bezier(.4,0,.2,1) forwards"}}
              d="M0,150 L45,118 L90,140 L135,82 L180,112 L225,58 L270,98 L315,44 L360,80 L405,30 L450,62 L500,22"/>
            <circle cx="135" cy="82" r="3" fill="#fff" stroke={color} strokeWidth="2" style={{filter:`drop-shadow(0 0 5px ${color})`}}/>
            <circle cx="315" cy="44" r="3" fill="#fff" stroke={color} strokeWidth="2" style={{filter:`drop-shadow(0 0 5px ${color})`}}/>
            <circle cx="405" cy="30" r="3" fill="#fff" stroke={color} strokeWidth="2" style={{filter:`drop-shadow(0 0 5px ${color})`}}/>
            <circle r="7" fill={`${color}55`}>
              <animateMotion dur="3.2s" repeatCount="indefinite" rotate="auto"><mpath xlinkHref="#login-curve"/></animateMotion>
            </circle>
            <circle r="3.5" fill="#fff" style={{filter:`drop-shadow(0 0 8px ${color}) drop-shadow(0 0 3px #fff)`}}>
              <animateMotion dur="3.2s" repeatCount="indefinite" rotate="auto"><mpath xlinkHref="#login-curve"/></animateMotion>
            </circle>
          </svg>
          <style>{'@keyframes lcdraw { to { stroke-dashoffset: 0; } }'}</style>
        </div>

        {/* pills */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <span style={{
            background:`${color}22`,border:`1px solid ${color}55`,
            borderRadius:99,padding:"3px 10px",fontSize:9.5,color,fontWeight:600,
            boxShadow:`0 0 8px ${color}22`,
          }}>Meta 84%</span>
          <span style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:99,padding:"3px 10px",fontSize:9.5,color:"rgba(255,255,255,0.45)"}}>● 24 vendas</span>
          <span style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:99,padding:"3px 10px",fontSize:9.5,color:"rgba(255,255,255,0.45)"}}>● 7 vendedoras</span>
        </div>
      </div>
    </div>
  )
}


export default function LoginPage() {
  const router = useRouter()
  const login  = useAuthStore((s) => s.login)
  const [email,     setEmail]    = useState("")
  const [password,  setPassword] = useState("")
  const [show,      setShow]     = useState(false)
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState("")
  const [remember,  setRemember] = useState(false)
  const [activePal, setActivePal] = useState("ocean")

  const pal = PALETTES.find(p => p.id === activePal) || PALETTES[1]

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      await login(email, password)
      if(user?.role === "super_admin") { router.push("/superadmin") } else { router.push("/dashboard") }
    } catch(err: any) {
      setError(err?.response?.data?.message || "Credenciais inválidas")
    } finally { setLoading(false) }
  }

  function quickLogin(e: string, p: string) { setEmail(e); setPassword(p) }

  const btnStyle = { width:"100%", padding:"13px", background:pal.color, color:"white", border:"none", borderRadius:"10px", fontSize:"14px", fontWeight:"600" as const, cursor:"pointer", fontFamily:"inherit", letterSpacing:"-.01em", transition:"all .15s" }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; background:#080f1e; font-family:'Geist',ui-sans-serif,system-ui,sans-serif; }
        .l-input { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:12px 14px; font-size:14px; outline:none; width:100%; color:white; font-family:inherit; transition:all .15s; }
        .l-input:focus { box-shadow:0 0 0 3px rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.25); }
        .l-input::placeholder { color:rgba(255,255,255,0.25); }
        .l-input:-webkit-autofill,.l-input:-webkit-autofill:hover,.l-input:-webkit-autofill:focus { -webkit-box-shadow:0 0 0px 1000px #1a2535 inset !important; -webkit-text-fill-color:white !important; border-color:rgba(255,255,255,0.15) !important; }
        .demo-btn { padding:7px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; font-family:inherit; border:1px solid rgba(255,255,255,0.15); background:transparent; color:rgba(255,255,255,0.6); }
        .demo-btn:hover { background:rgba(255,255,255,0.08); }
        .pal-dot { width:30px; height:30px; border-radius:8px; border:2.5px solid transparent; cursor:pointer; transition:all .18s; }
        .pal-dot:hover { transform:scale(1.1); }
        .pal-dot.active { border-color:white; transform:scale(1.18); box-shadow:0 0 0 3px rgba(0,0,0,0.5); }
        .left-col { overflow-y:auto; scrollbar-width:none; }
        .left-col::-webkit-scrollbar { display:none; }
      `}</style>

      {/* MOBILE */}
      <div className="flex flex-col min-h-screen md:hidden" style={{background:"#08101A"}}>
        <div style={{position:"fixed",top:"-20%",right:"-20%",width:"60vw",height:"60vw",background:`radial-gradient(circle,${pal.color}44,transparent 65%)`,filter:"blur(30px)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"relative",zIndex:1,padding:"36px 20px 24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
            <Logo size={28} color={pal.color}/>
            <strong style={{fontSize:17,color:"white",letterSpacing:"-.02em"}}>VendaPro</strong>
          </div>
          <MockupCard color={pal.color}/>
        </div>
        <div style={{position:"relative",zIndex:1,flex:1,background:"#0C1520",borderRadius:"24px 24px 0 0",padding:"26px 20px 40px",border:"1px solid rgba(255,255,255,0.08)"}}>
          <h1 style={{fontSize:20,fontWeight:700,color:"white",marginBottom:4}}>Entrar no VendaPro</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:20}}>Acesse sua conta e gerencie sua loja.</p>
          {error && <div style={{marginBottom:12,padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,fontSize:13,color:"#f87171"}}>{error}</div>}
          <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:11}}>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.5)"}}>E-mail</label>
              <input className="l-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.5)"}}>Senha</label>
              <div style={{position:"relative"}}>
                <input className="l-input" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{paddingRight:52}}/>
                <button type="button" onClick={()=>setShow(!show)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:500}}>{show?"Ocultar":"Ver"}</button>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",color:"rgba(255,255,255,0.5)"}}>
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:pal.color}}/>
                Lembrar-me
              </label>
              <a href="https://wa.me/5511958924764" target="_blank" rel="noopener noreferrer" style={{color:pal.color,fontWeight:500,textDecoration:"none",fontSize:13}}>Esqueci a senha</a>
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>{loading?"Entrando...":"Entrar"}</button>
          </form>
          <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)",fontSize:11,color:"rgba(255,255,255,0.3)",display:"flex",justifyContent:"space-between"}}>
            <span>Novo no VendaPro? <a href="#" style={{color:pal.color,textDecoration:"none"}}>Crie sua loja</a></span>
            <span>v2.4</span>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex" style={{height:"100vh",overflow:"hidden"}}>

        {/* ESQUERDO */}
        <div className="left-col" style={{
          flex:"0 0 58%",
          overflowY:"auto" as const,
          background:`radial-gradient(ellipse at 15% 10%, ${pal.color}28 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${pal.color}18 0%, transparent 45%), #080f1e`,
          color:"white",
          padding:"18px 28px 20px",
          display:"flex",
          flexDirection:"column",
          position:"relative",
          transition:"background .4s",
        }}>
          <div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",background:`radial-gradient(ellipse at 25% 15%,${pal.color}1a,transparent 55%)`,pointerEvents:"none",transition:"background .4s"}}/>

          {/* header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",marginBottom:10,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <Logo size={32} color={pal.color}/>
              <strong style={{fontSize:16,letterSpacing:"-.01em"}}>VendaPro</strong>
            </div>
            <span style={{fontSize:10,color:"rgba(255,255,255,0.32)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:99,padding:"2px 9px"}}>v2.4</span>
          </div>

          {/* mockup */}
          <div style={{position:"relative",marginBottom:8,flexShrink:0}}>
            <MockupCard color={pal.color}/>
          </div>

          {/* badge adaptativo */}
          <div style={{marginBottom:10,flexShrink:0}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:99,padding:"4px 12px",fontSize:10.5,color:"rgba(255,255,255,0.55)"}}>
              <span style={{color:pal.color,transition:"color .3s"}}>●</span> Adaptativo por loja
            </span>
          </div>

          {/* headline */}
          <div style={{position:"relative",marginBottom:10,flexShrink:0}}>
            <h2 style={{fontSize:24,fontWeight:700,lineHeight:1.05,letterSpacing:"-.03em",margin:"0 0 6px"}}>
              Sua loja, <span style={{color:pal.color,transition:"color .3s"}}>sua cor</span>, sua identidade.
            </h2>
            <p style={{fontSize:12.5,lineHeight:1.65,color:"rgba(255,255,255,0.38)",maxWidth:380}}>
              O VendaPro se molda à sua marca: escolha a paleta e cada gráfico, botão e relatório veste a cara da sua loja. Vendas, estoque, caixa e equipe em um só sistema.
            </p>
          </div>

          {/* seletor */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"8px 11px",marginBottom:10,flexShrink:0}}>
            <div style={{fontSize:9.5,color:"rgba(255,255,255,0.32)",marginBottom:9,display:"flex",alignItems:"center",gap:5}}>
              <span>⊕</span> Experimente uma paleta
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4, 30px)",gap:8,marginBottom:8}}>
              {PALETTES.map(p => (
                <button key={p.id} className={`pal-dot${activePal===p.id?" active":""}`} style={{background:p.color}} title={p.name} onClick={()=>setActivePal(p.id)}/>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,paddingTop:7,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:pal.color,flexShrink:0,transition:"background .3s"}}/>
              <div>
                <div style={{fontSize:11,color:pal.color,fontWeight:700,transition:"color .3s"}}>{pal.name}</div>
                <div style={{fontSize:9.5,color:"rgba(255,255,255,0.28)",marginTop:1}}>{pal.desc}</div>
              </div>
            </div>
          </div>

          {/* stats */}
          <div style={{display:"flex",gap:20,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
            {[["7 dias","trial grátis"],["3 planos","para cada momento"],["100%","na nuvem"]].map(([v,l]) => (
              <div key={l}>
                <strong style={{display:"block",fontSize:15,fontWeight:700,letterSpacing:"-.02em"}}>{v}</strong>
                <small style={{fontSize:9.5,color:"rgba(255,255,255,0.32)"}}>{l}</small>
              </div>
            ))}
          </div>
        </div>

        {/* DIREITO */}
        <div style={{flex:"0 0 42%",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 36px",background:"#0C1520"}}>
          <div style={{width:"100%",maxWidth:370}}>
            <h1 style={{margin:"0 0 6px",fontSize:28,fontWeight:700,letterSpacing:"-.025em",color:"white"}}>Entrar no VendaPro</h1>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.4)",margin:"0 0 24px"}}>Acesse sua conta e gerencie sua loja.</p>
            {error && <div style={{marginBottom:14,padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,fontSize:13,color:"#f87171"}}>{error}</div>}
            <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:13}}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.6)"}}>E-mail</label>
                <input className="l-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.6)"}}>Senha</label>
                <div style={{position:"relative"}}>
                  <input className="l-input" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{paddingRight:52}}/>
                  <button type="button" onClick={()=>setShow(!show)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:500}}>{show?"Ocultar":"Ver"}</button>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
                <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",color:"rgba(255,255,255,0.5)"}}>
                  <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:pal.color,width:15,height:15}}/>
                  Lembrar-me
                </label>
                <a href="https://wa.me/5511958924764" target="_blank" rel="noopener noreferrer" style={{color:pal.color,fontWeight:500,textDecoration:"none"}}>Esqueci a senha</a>
              </div>
              <button type="submit" disabled={loading} style={btnStyle}>{loading?"Entrando...":"Entrar"}</button>
            </form>

            <div style={{marginTop:18,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,color:"rgba(255,255,255,0.25)"}}>
              <span>Novo no VendaPro? <a href="#" style={{color:pal.color,textDecoration:"none",fontWeight:500}}>Crie sua loja</a></span>
              <span>v2.4</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
