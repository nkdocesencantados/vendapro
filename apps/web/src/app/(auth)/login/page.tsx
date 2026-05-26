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

function MockupCard({ color }: { color: string }) {
  return (
    <div style={{
      background:"rgba(0,0,0,0.35)",
      border:`1px solid ${color}30`,
      borderRadius:16,
      overflow:"hidden",
      boxShadow:`0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${color}20`,
    }}>
      {/* titlebar */}
      <div style={{
        background:"rgba(0,0,0,0.4)",
        padding:"10px 16px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        borderBottom:`1px solid rgba(255,255,255,0.06)`,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:"#FF5F57"}}/>
          <div style={{width:9,height:9,borderRadius:"50%",background:"#FFBD2E"}}/>
          <div style={{width:9,height:9,borderRadius:"50%",background:"#28C840"}}/>
        </div>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontFamily:"monospace"}}>
          vendapro.com.br/esmeralda
        </span>
        <div style={{width:60}}/>
      </div>

      {/* content */}
      <div style={{padding:"20px 20px 16px"}}>
        {/* KPI + linha */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>FATURAMENTO HOJE</div>
            <div style={{fontFamily:"'Courier New',monospace",fontSize:32,fontWeight:700,color:"white",letterSpacing:"-0.02em",lineHeight:1}}>
              R$&nbsp;<span style={{color:color}}>4.872</span>
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:5}}>▲ 18%&nbsp; vs ontem</div>
          </div>
          {/* mini linha chart */}
          <svg viewBox="0 0 120 50" style={{width:160,height:60,flexShrink:0}}>
            <defs>
              <linearGradient id="lg-line" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={color} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <polygon points="0,50 0,38 20,30 40,34 60,20 80,26 100,12 120,5 120,50" fill="url(#lg-line)"/>
            <polyline points="0,38 20,30 40,34 60,20 80,26 100,12 120,5" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        </div>

        {/* barras */}
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90,marginBottom:8}}>
          {[38,52,46,68,58,72,60].map((v,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"stretch",justifyContent:"flex-end",height:"100%"}}>
              <div style={{
                height:`${v}%`,
                background: i===3||i===5
                  ? `linear-gradient(180deg,${color}cc,${color}44)`
                  : `linear-gradient(180deg,${color}55,${color}18)`,
                borderRadius:"5px 5px 0 0",
                border:`1px solid ${color}${i===3||i===5?"80":"30"}`,
                borderBottom:"none",
              }}/>
            </div>
          ))}
        </div>

        {/* labels */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d,i)=>(
            <div key={d} style={{flex:1,textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.35)"}}>{d}</div>
          ))}
        </div>

        {/* pills */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {label:"● 24 vendas",  hi:false},
            {label:"Meta 84%",     hi:true},
            {label:"● 7 vendedoras",hi:false},
          ].map(({label,hi})=>(
            <span key={label} style={{
              background:hi?`${color}22`:"rgba(255,255,255,0.06)",
              border:`1px solid ${hi?color+"55":"rgba(255,255,255,0.1)"}`,
              borderRadius:99,padding:"4px 12px",fontSize:11,
              color:hi?color:"rgba(255,255,255,0.5)",
              fontWeight:hi?600:400,
            }}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const login  = useAuthStore((s) => s.login)
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [remember, setRemember] = useState(false)
  const [activePal, setActivePal] = useState("ocean")

  const pal = PALETTES.find(p => p.id === activePal) || PALETTES[0]

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch(err: any) {
      setError(err?.response?.data?.message || "Credenciais inválidas")
    } finally { setLoading(false) }
  }

  function quickLogin(e: string, p: string) { setEmail(e); setPassword(p) }

  const btnStyle = { width:"100%", padding:"14px", background:pal.color, color:"white", border:"none", borderRadius:"10px", fontSize:"15px", fontWeight:"600" as const, cursor:"pointer", fontFamily:"inherit", letterSpacing:"-0.01em", transition:"all .15s" }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: 'Geist', ui-sans-serif, system-ui, sans-serif; }
        .l-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 13px 15px; font-size: 14px; outline: none; width: 100%; color: white; font-family: inherit; transition: all .15s; }
        .l-input:focus { box-shadow: 0 0 0 3px rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.25); }
        .l-input::placeholder { color: rgba(255,255,255,0.25); }
        .l-input:-webkit-autofill, .l-input:-webkit-autofill:hover, .l-input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0px 1000px #1a2535 inset !important; -webkit-text-fill-color: white !important; border-color: rgba(255,255,255,0.15) !important; }
        .demo-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.6); }
        .demo-btn:hover { background: rgba(255,255,255,0.08); }
        .pal-dot { width: 32px; height: 32px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; transition: all .18s; }
        .pal-dot:hover { transform: scale(1.1); }
        .pal-dot.active { border-color: white; transform: scale(1.18); box-shadow: 0 0 0 3px rgba(0,0,0,0.5); }
        .left-scroll { overflow-y: auto; scrollbar-width: none; }
        .left-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* MOBILE */}
      <div className="flex flex-col min-h-screen md:hidden" style={{background:"#08101A"}}>
        <div style={{position:"fixed",top:"-20%",right:"-20%",width:"60vw",height:"60vw",background:`radial-gradient(circle,${pal.color}44,transparent 65%)`,filter:"blur(30px)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"relative",zIndex:1,padding:"40px 20px 28px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <Logo size={30} color={pal.color}/>
            <strong style={{fontSize:18,color:"white",letterSpacing:"-0.02em"}}>VendaPro</strong>
          </div>
          <MockupCard color={pal.color}/>
          <div style={{marginTop:16}}>
            <h2 style={{fontSize:24,fontWeight:700,color:"white",lineHeight:1.1,letterSpacing:"-0.025em",marginBottom:8}}>
              Sua loja, <span style={{color:pal.color}}>sua cor</span>, sua identidade.
            </h2>
          </div>
        </div>
        <div style={{position:"relative",zIndex:1,flex:1,background:"#0C1520",borderRadius:"24px 24px 0 0",padding:"28px 20px 44px",border:"1px solid rgba(255,255,255,0.08)"}}>
          <h1 style={{fontSize:20,fontWeight:700,color:"white",marginBottom:4}}>Entrar no VendaPro</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:22}}>Acesse sua conta e gerencie sua loja.</p>
          {error && <div style={{marginBottom:14,padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,fontSize:13,color:"#f87171"}}>{error}</div>}
          <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:12}}>
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
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)",fontSize:11,color:"rgba(255,255,255,0.3)",display:"flex",justifyContent:"space-between"}}>
            <span>Novo no VendaPro? <a href="#" style={{color:pal.color,textDecoration:"none"}}>Crie sua loja</a></span>
            <span>v2.4</span>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex" style={{height:"100vh",overflow:"hidden"}}>

        {/* ESQUERDO — scrollável internamente */}
        <div className="left-scroll" style={{
          flex:1,
          background:`linear-gradient(160deg,${pal.color}18 0%,#08101A 40%)`,
          color:"white",
          padding:"32px 44px 40px",
          display:"flex",
          flexDirection:"column",
          position:"relative",
          transition:"background .5s",
        }}>
          {/* glow */}
          <div style={{position:"fixed",top:0,left:0,width:"50vw",height:"50vh",background:`radial-gradient(ellipse at 30% 20%,${pal.color}20,transparent 65%)`,pointerEvents:"none",transition:"background .5s"}}/>

          {/* header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",marginBottom:28,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Logo size={34} color={pal.color}/>
              <strong style={{fontSize:17,letterSpacing:"-0.01em"}}>VendaPro</strong>
            </div>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:99,padding:"3px 10px"}}>v2.4</span>
          </div>

          {/* mockup — ocupa bastante espaço */}
          <div style={{position:"relative",marginBottom:20,flexShrink:0}}>
            <MockupCard color={pal.color}/>
            <div style={{marginTop:12}}>
              <span style={{
                display:"inline-flex",alignItems:"center",gap:6,
                background:"rgba(255,255,255,0.06)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:99,padding:"5px 14px",
                fontSize:11,color:"rgba(255,255,255,0.6)",
              }}>
                <span style={{color:pal.color}}>●</span> Adaptativo por loja
              </span>
            </div>
          </div>

          {/* headline + texto */}
          <div style={{position:"relative",marginBottom:28}}>
            <h2 style={{fontSize:36,fontWeight:700,lineHeight:1.05,letterSpacing:"-0.03em",margin:"0 0 12px"}}>
              Sua loja, <span style={{color:pal.color,transition:"color .3s"}}>sua cor</span>, sua identidade.
            </h2>
            <p style={{fontSize:13.5,lineHeight:1.7,color:"rgba(255,255,255,0.42)",maxWidth:420}}>
              O VendaPro se molda à sua marca: escolha a paleta e cada gráfico, botão e relatório veste a cara da sua loja. Vendas, estoque, caixa e equipe em um só sistema.
            </p>
          </div>

          {/* seletor paletas */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",marginBottom:24,flexShrink:0}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
              <span>⊕</span> Experimente uma paleta
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4, 32px)",gap:8,marginBottom:10}}>
              {PALETTES.map(p=>(
                <button key={p.id} className={`pal-dot${activePal===p.id?" active":""}`} style={{background:p.color}} title={p.name} onClick={()=>setActivePal(p.id)}/>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:pal.color,flexShrink:0}}/>
              <div>
                <div style={{fontSize:12,color:pal.color,fontWeight:700}}>{pal.name}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{pal.desc}</div>
              </div>
            </div>
          </div>

          {/* stats */}
          <div style={{display:"flex",gap:24,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
            {[["7 dias","trial grátis"],["3 planos","para cada momento"],["100%","na nuvem"]].map(([v,l])=>(
              <div key={l}>
                <strong style={{display:"block",fontSize:17,fontWeight:700,letterSpacing:"-0.02em"}}>{v}</strong>
                <small style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{l}</small>
              </div>
            ))}
          </div>
        </div>

        {/* DIREITO */}
        <div style={{flex:"0 0 480px",display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 40px",background:"#0C1520"}}>
          <div style={{width:"100%",maxWidth:380}}>
            <h1 style={{margin:"0 0 8px",fontSize:30,fontWeight:700,letterSpacing:"-0.025em",color:"white"}}>Entrar no VendaPro</h1>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.4)",margin:"0 0 28px"}}>Acesse sua conta e gerencie sua loja.</p>
            {error && <div style={{marginBottom:16,padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,fontSize:13,color:"#f87171"}}>{error}</div>}
            <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
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
            <div style={{marginTop:20,padding:14,borderRadius:12,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:10,fontWeight:500}}>Demo — entrar como:</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button className="demo-btn" onClick={()=>quickLogin("admin@vendapro.com.br","VendaPro@2026!")} style={{background:pal.color,color:"white",borderColor:pal.color}}>Dona de loja</button>
                <button className="demo-btn" onClick={()=>quickLogin("vendedor@vendapro.com.br","123456")}>Vendedora</button>
                <button className="demo-btn" onClick={()=>quickLogin("superadmin@vendapro.com.br","super123")}>Super Admin</button>
              </div>
            </div>
            <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,color:"rgba(255,255,255,0.25)"}}>
              <span>Novo no VendaPro? <a href="#" style={{color:pal.color,textDecoration:"none",fontWeight:500}}>Crie sua loja</a></span>
              <span>v2.4</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
