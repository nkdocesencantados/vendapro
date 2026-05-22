"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/contexts/auth.store"

export default function LoginPage() {
  const router = useRouter()
  const login  = useAuthStore((s) => s.login)
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch(err: any) {
      setError(err?.response?.data?.message || "Credenciais invalidas")
    } finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr",fontFamily:'"Geist",ui-sans-serif,system-ui,sans-serif'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        .login-art{display:flex;}
        .login-input{background:white;border:1px solid #E7E5E4;border-radius:10px;padding:10px 13px;font-size:14px;outline:none;width:100%;color:#0C0A09;font-family:inherit;transition:border-color .12s,box-shadow .12s;}
        .login-input:focus{border-color:#1D9E75;box-shadow:0 0 0 3px rgba(29,158,117,0.12);}
        .login-input::placeholder{color:#A8A29E;}
        .login-btn{width:100%;padding:11px;background:#1D9E75;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:background .12s;font-family:inherit;}
        .login-btn:hover{background:#178A65;}
        .login-btn:disabled{background:#9CA3AF;cursor:not-allowed;}
        @media(max-width:768px){
          .login-art{display:none!important;}
          div[style*="gridTemplateColumns"]{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* LADO ESQUERDO â€” arte */}
      <div className="login-art" style={{background:"#04130F",color:"#E5F2EC",padding:48,flexDirection:"column",position:"relative",overflow:"hidden"}}>
        {/* Glow */}
        <div style={{position:"absolute",inset:"-40% -20% 30% 30%",background:"radial-gradient(circle,rgba(29,158,117,0.4),transparent 60%)",filter:"blur(20px)",pointerEvents:"none"}} />

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
          <div style={{width:64,height:64,borderRadius:16,background:"#1D9E75",display:"grid",placeItems:"center",flexShrink:0}}>
            <svg width={42} height={42} viewBox="0 0 24 24" fill="white" stroke="none">
              <circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><circle cx="12" cy="16" r="2.5"/><line x1="8" y1="8" x2="16" y2="8" stroke="white" strokeWidth="2"/><line x1="8" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2"/><line x1="16" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2"/>
              <line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="8" x2="12" y2="16"/><line x1="16" y1="8" x2="12" y2="16"/>
            </svg>
          </div>
          <strong style={{fontSize:18,letterSpacing:"-0.01em",color:"white"}}>VendaPro</strong>
        </div>

        {/* Pitch */}
        <div style={{marginTop:"auto",position:"relative"}}>
          <h2 style={{fontSize:38,fontWeight:600,lineHeight:1.05,letterSpacing:"-0.025em",margin:"0 0 16px",color:"white"}}>
            Toda a gestao da sua loja em{" "}
            <span style={{color:"#34D399"}}>um so lugar</span>.
          </h2>
          <p style={{fontSize:15,lineHeight:1.6,color:"#B2C9C0",margin:0,maxWidth:380}}>
            Vendas, estoque, caixa e equipe â€” pensado para o pequeno comercio brasileiro.
          </p>

          {/* Stats */}
          <div style={{display:"flex",gap:24,marginTop:32,paddingTop:24,borderTop:"1px solid #1F3A33"}}>
            {[["7 dias","trial gratis"],["3 planos","para cada momento"],["100%","na nuvem"]].map(([v,l])=>(
              <div key={l}>
                <strong style={{display:"block",fontSize:20,fontWeight:600,color:"white"}}>{v}</strong>
                <small style={{fontSize:12,color:"#8DA39A"}}>{l}</small>
              </div>
            ))}
          </div>

          {/* WhatsApp */}
          <div style={{marginTop:28,padding:14,borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid #1F3A33",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"#1D9E75",display:"grid",placeItems:"center",flexShrink:0}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:"white"}}>Suporte por WhatsApp</div>
              <a href="https://wa.me/5511958924764" target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#8DA39A",textDecoration:"none"}}>(11) 95892-4764</a>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO â€” form */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 32px",background:"#FAFAF9"}}>
        <div style={{width:"100%",maxWidth:360}}>
          {/* Mobile logo */}
          <div style={{display:"none",alignItems:"center",gap:10,marginBottom:32,justifyContent:"center"}} className="mobile-logo">
            <div style={{width:32,height:32,borderRadius:8,background:"#1D9E75",display:"grid",placeItems:"center"}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="12" cy="16" r="2"/>
                <line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="8" x2="12" y2="16"/><line x1="16" y1="8" x2="12" y2="16"/>
              </svg>
            </div>
            <strong style={{fontSize:18,color:"#0C0A09"}}>VendaPro</strong>
          </div>

          <h1 style={{margin:"0 0 8px",fontSize:26,fontWeight:600,letterSpacing:"-0.02em",color:"#0C0A09"}}>Entrar no VendaPro</h1>
          <p style={{fontSize:14,color:"#78716C",margin:"0 0 28px"}}>Acesse sua conta e gerencie sua loja.</p>

          {error && (
            <div style={{marginBottom:16,padding:"10px 14px",background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,fontSize:13,color:"#B91C1C"}}>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:12,fontWeight:500,color:"#57534E"}}>E-mail</label>
              <input className="login-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:12,fontWeight:500,color:"#57534E"}}>Senha</label>
              <div style={{position:"relative"}}>
                <input className="login-input" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required style={{paddingRight:42}} />
                <button type="button" onClick={()=>setShow(!show)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#78716C",fontSize:13}}>
                  {show?"Ocultar":"Ver"}
                </button>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
              <span style={{color:"#78716C"}}>Esqueceu a senha?</span>
              <a href="https://wa.me/5511958924764?text=Ola,%20esqueci%20minha%20senha%20do%20VendaPro" target="_blank" rel="noopener noreferrer" style={{color:"#1D9E75",fontWeight:500,textDecoration:"none"}}>Falar com suporte</a>
            </div>
            <button className="login-btn" type="submit" disabled={loading} style={{marginTop:4}}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div style={{marginTop:24,paddingTop:18,borderTop:"1px solid #E7E5E4",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,color:"#78716C"}}>
            <span>VendaPro â€” Gestao para varejo</span>
            <span>v2.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
