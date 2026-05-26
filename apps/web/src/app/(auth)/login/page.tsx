"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/contexts/auth.store"

const PALETTES = [
  { id:"emerald", color:"#1D9E75", name:"Esmeralda" },
  { id:"indigo",  color:"#6366F1", name:"Índigo" },
  { id:"amber",   color:"#F59E0B", name:"Âmbar" },
  { id:"crimson", color:"#E11D48", name:"Carmim" },
  { id:"violet",  color:"#8B5CF6", name:"Violeta" },
  { id:"ocean",   color:"#0EA5E9", name:"Oceano" },
  { id:"rose",    color:"#EC4899", name:"Rosé" },
  { id:"graphite",color:"#94A3B8", name:"Grafite" },
]

const Logo = ({ size = 28, color }: { size?: number; color?: string }) => {
  const tile = color || "#1D9E75"
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="32" height="32" rx="8" ry="8" fill={tile}/>
      <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="#fff">
        <path d="M16 8 L24 22 L8 22 Z" fill="none"/>
        <circle cx="16" cy="8"  r="2.4"/>
        <circle cx="24" cy="22" r="2.4"/>
        <circle cx="8"  cy="22" r="2.4"/>
      </g>
    </svg>
  )
}

export default function LoginPage() {
  const router   = useRouter()
  const login    = useAuthStore((s) => s.login)
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [remember, setRemember] = useState(false)
  const [activePal, setActivePal] = useState("ocean")

  const pal = PALETTES.find(p=>p.id===activePal) || PALETTES[5]

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

  function quickLogin(e: string, p: string) {
    setEmail(e); setPassword(p)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Geist', ui-sans-serif, system-ui, sans-serif; }
        .l-input {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 12px 14px; font-size: 14px; outline: none;
          width: 100%; color: white; font-family: inherit; transition: all .15s;
        }
        .l-input:focus { border-color: var(--lbrand); box-shadow: 0 0 0 3px var(--lglow); }
        .l-input::placeholder { color: rgba(255,255,255,0.3); }
        .l-btn {
          width: 100%; padding: 13px; background: var(--lbrand); color: white;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: inherit; letter-spacing: -0.01em;
        }
        .l-btn:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 16px var(--lglow); }
        .l-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .demo-btn {
          padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: inherit; border: 1px solid;
        }
        .pal-btn {
          width: 26px; height: 26px; border-radius: 6px; border: 2px solid transparent;
          cursor: pointer; transition: all .15s; flex-shrink: 0;
        }
        .pal-btn.active { border-color: white; box-shadow: 0 0 0 2px rgba(0,0,0,0.3); transform: scale(1.15); }
        .mockup { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; }
        .mockup-kpi { background: rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 14px; }
        .mockup-bar { height: 6px; border-radius: 99px; margin-top: 6px; opacity: 0.5; }
      `}</style>

      {/* MOBILE */}
      <div className="flex flex-col min-h-screen md:hidden" style={{background:"#08101A"}}>
        <div style={{position:"fixed",top:"-20%",right:"-20%",width:"70vw",height:"70vw",background:`radial-gradient(circle,${pal.color}55,transparent 65%)`,filter:"blur(30px)",pointerEvents:"none",zIndex:0,transition:"background .3s"}}/>
        <div style={{position:"relative",zIndex:1,padding:"48px 28px 36px",display:"flex",flexDirection:"column",gap:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Logo size={32} color={pal.color}/>
            <strong style={{fontSize:22,color:"white",letterSpacing:"-0.02em"}}>VendaPro</strong>
          </div>
          <h2 style={{fontSize:28,fontWeight:600,color:"white",lineHeight:1.1,letterSpacing:"-0.025em"}}>
            Sua loja, <span style={{color:pal.color}}>sua cor</span>, sua identidade.
          </h2>
        </div>
        <div style={{position:"relative",zIndex:1,flex:1,background:"#0C1520",borderRadius:"24px 24px 0 0",padding:"32px 24px 48px",border:"1px solid rgba(255,255,255,0.08)"}}>
          <h1 style={{fontSize:22,fontWeight:600,color:"white",marginBottom:6}}>Entrar no VendaPro</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:24}}>Acesse sua conta e gerencie sua loja.</p>
          {error && <div style={{marginBottom:16,padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,fontSize:13,color:"#f87171"}}>{error}</div>}
          <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".06em"}}>E-mail</label>
              <input className="l-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".06em"}}>Senha</label>
              <div style={{position:"relative"}}>
                <input className="l-input" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{paddingRight:52}}/>
                <button type="button" onClick={()=>setShow(!show)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:500}}>
                  {show?"Ocultar":"Ver"}
                </button>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",color:"rgba(255,255,255,0.5)"}}>
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:pal.color}}/>
                Lembrar-me
              </label>
              <a href="https://wa.me/5511958924764" target="_blank" rel="noopener noreferrer" style={{color:pal.color,fontWeight:500,textDecoration:"none",fontSize:13}}>Esqueci a senha</a>
            </div>
            <button className="l-btn" type="submit" disabled={loading} style={{"--lbrand":pal.color,"--lglow":pal.color+"44"} as any}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.06)",fontSize:11,color:"rgba(255,255,255,0.3)",display:"flex",justifyContent:"space-between"}}>
            VendaPro - Gestão para varejo<span>v2.4</span>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:grid min-h-screen" style={{gridTemplateColumns:"1fr 1fr","--lbrand":pal.color,"--lglow":pal.color+"44"} as any}>

        {/* ESQUERDO */}
        <div style={{background:"#08101A",color:"white",padding:48,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:"-40% -20% 30% 30%",background:`radial-gradient(circle,${pal.color}44,transparent 60%)`,filter:"blur(40px)",pointerEvents:"none",transition:"background .4s"}}/>

          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
            <Logo size={36} color={pal.color}/>
            <strong style={{fontSize:18,letterSpacing:"-0.01em"}}>VendaPro</strong>
          </div>

          <div style={{marginTop:"auto",position:"relative"}}>
            <h2 style={{fontSize:36,fontWeight:700,lineHeight:1.05,letterSpacing:"-0.03em",margin:"0 0 12px"}}>
              Sua loja, <span style={{color:pal.color}}>sua cor</span>,<br/>sua identidade.
            </h2>
            <p style={{fontSize:14,lineHeight:1.7,color:"rgba(255,255,255,0.5)",margin:"0 0 28px",maxWidth:380}}>
              O VendaPro se molda à sua marca: escolha a paleta e cada gráfico, botão e relatório veste a cara da sua loja.
            </p>

            {/* MOCKUP */}
            <div className="mockup" style={{marginBottom:24}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:10,display:"flex",justifyContent:"space-between"}}>
                <span>vendapro.com.br/{activePal}</span>
                <span style={{color:pal.color}}>● online</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <div className="mockup-kpi">
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".06em"}}>Faturamento hoje</div>
                  <div style={{fontFamily:"'Geist Mono',monospace",fontSize:18,fontWeight:700,color:pal.color,marginTop:4}}>R$ 4.872</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>▲ 18% vs ontem</div>
                </div>
                <div className="mockup-kpi">
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".06em"}}>Meta mensal</div>
                  <div style={{fontFamily:"'Geist Mono',monospace",fontSize:18,fontWeight:700,color:"white",marginTop:4}}>84%</div>
                  <div className="mockup-bar" style={{background:pal.color,width:"84%"}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["24 vendas",`Meta ${activePal==="ocean"?"84":"76"}%`,"7 vendedoras"].map(t=>(
                  <span key={t} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:99,padding:"3px 10px",fontSize:10,color:"rgba(255,255,255,0.6)"}}>● {t}</span>
                ))}
              </div>
            </div>

            {/* PALETTES */}
            <div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                <span>⊕</span> Experimente uma paleta
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                {PALETTES.map(p=>(
                  <button key={p.id} className={`pal-btn${activePal===p.id?" active":""}`} style={{background:p.color}} title={p.name} onClick={()=>setActivePal(p.id)}/>
                ))}
              </div>
              <div style={{fontSize:12,color:pal.color,fontWeight:600}}>{pal.name}</div>
            </div>

            <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",gap:20}}>
              {[["7 dias","trial grátis"],["3 planos","para cada momento"],["100%","na nuvem"]].map(([v,l])=>(
                <div key={l}>
                  <strong style={{display:"block",fontSize:18,fontWeight:700}}>{v}</strong>
                  <small style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{l}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DIREITO */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 32px",background:"#0C1520"}}>
          <div style={{width:"100%",maxWidth:380}}>
            <h1 style={{margin:"0 0 8px",fontSize:26,fontWeight:700,letterSpacing:"-0.025em",color:"white"}}>Entrar no VendaPro</h1>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.4)",margin:"0 0 28px"}}>Acesse sua conta e gerencie sua loja.</p>

            {error && <div style={{marginBottom:16,padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,fontSize:13,color:"#f87171"}}>{error}</div>}

            <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".06em"}}>E-mail</label>
                <input className="l-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".06em"}}>Senha</label>
                <div style={{position:"relative"}}>
                  <input className="l-input" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{paddingRight:52}}/>
                  <button type="button" onClick={()=>setShow(!show)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:500}}>
                    {show?"Ocultar":"Ver"}
                  </button>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
                <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",color:"rgba(255,255,255,0.5)"}}>
                  <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:pal.color,width:14,height:14}}/>
                  Lembrar-me
                </label>
                <a href="https://wa.me/5511958924764" target="_blank" rel="noopener noreferrer" style={{color:pal.color,fontWeight:500,textDecoration:"none"}}>Esqueci a senha</a>
              </div>
              <button className="l-btn" type="submit" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            {/* DEMO */}
            <div style={{marginTop:20,padding:14,borderRadius:12,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:10,fontWeight:500}}>Demo — entrar como:</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button className="demo-btn" onClick={()=>quickLogin("admin@vendapro.com.br","VendaPro@2026!")} style={{background:pal.color,color:"white",borderColor:pal.color}}>Dona de loja</button>
                <button className="demo-btn" onClick={()=>quickLogin("vendedor@vendapro.com.br","123456")} style={{background:"transparent",color:"rgba(255,255,255,0.6)",borderColor:"rgba(255,255,255,0.15)"}}>Vendedora</button>
                <button className="demo-btn" onClick={()=>quickLogin("superadmin@vendapro.com.br","super123")} style={{background:"transparent",color:"rgba(255,255,255,0.6)",borderColor:"rgba(255,255,255,0.15)"}}>Super Admin</button>
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
