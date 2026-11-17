"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/contexts/auth.store"

const PALETTES = [
  { id:"emerald", color:"#2DBE60", name:"Verde Haux" },
  { id:"ocean",   color:"#0EA5E9", name:"Azul" },
  { id:"violet",  color:"#8B5CF6", name:"Violeta" },
  { id:"amber",   color:"#F59E0B", name:"Âmbar" },
  { id:"indigo",  color:"#6366F1", name:"Índigo" },
]

export default function LoginPage() {
  const router = useRouter()
  const login  = useAuthStore((s) => s.login)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [remember, setRemember] = useState(false)
  const [activePal, setActivePal] = useState("emerald")

  useEffect(() => {
    try {
      const s = localStorage.getItem("vp-palette")
      if (s && PALETTES.some(p => p.id === s)) setActivePal(s)
    } catch(e) {}
  }, [])

  function pick(id: string) {
    setActivePal(id)
    try { localStorage.setItem("vp-palette", id) } catch(e) {}
  }

  const pal = PALETTES.find(p => p.id === activePal) || PALETTES[0]

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      await login(email, password)
      const authU = useAuthStore.getState().user
      if (authU?.role === "super_admin") router.push("/superadmin"); else router.push("/dashboard")
    } catch(err: any) {
      setError(err?.response?.data?.message || "Credenciais inválidas")
    } finally { setLoading(false) }
  }

  return (
    <div className="lg-root" style={{ ["--c" as any]: pal.color }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        html,body{margin:0;background:#08090B}
        .lg-root{min-height:100vh;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);background:#08090B;color:#EDEFF2;font-family:Inter,system-ui,sans-serif;}
        .lg-left{display:flex;align-items:center;justify-content:center;padding:40px 36px;position:relative;}
        .lg-form{width:100%;max-width:380px;}
        .lg-brand{display:flex;align-items:center;gap:12px;margin-bottom:44px;}
        .lg-brand img{width:44px;height:44px;border-radius:50%;box-shadow:0 0 24px color-mix(in srgb,var(--c) 40%,transparent);}
        .lg-brand b{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:20px;letter-spacing:-.03em;}
        .lg-online{display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;color:#9AA1AD;margin-bottom:14px;}
        .lg-online i{width:7px;height:7px;border-radius:50%;background:var(--c);box-shadow:0 0 10px var(--c);animation:lgPulse 2s infinite;}
        @keyframes lgPulse{50%{opacity:.35}}
        h1.lg-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:32px;letter-spacing:-.035em;margin:0 0 8px;}
        .lg-sub{color:#9AA1AD;font-size:14px;margin:0 0 26px;}
        .lg-label{display:block;font-size:12px;font-weight:500;color:#9AA1AD;margin-bottom:6px;}
        .lg-input{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:13px 14px;font-size:14px;color:#EDEFF2;font-family:inherit;outline:none;transition:.15s;}
        .lg-input:focus{border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 22%,transparent);}
        .lg-input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #14171C inset!important;-webkit-text-fill-color:#EDEFF2!important;}
        .lg-btn{width:100%;padding:14px;border:0;border-radius:10px;background:var(--c);color:#05070A;font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;box-shadow:0 0 28px color-mix(in srgb,var(--c) 38%,transparent);transition:.15s;}
        .lg-btn:hover{filter:brightness(1.08);transform:translateY(-1px);}
        .lg-btn:disabled{opacity:.6;cursor:default;transform:none;}
        .lg-theme{margin-top:30px;padding-top:20px;border-top:1px solid rgba(255,255,255,.07);}
        .lg-theme small{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;color:#6F7782;text-transform:uppercase;display:block;margin-bottom:12px;}
        .lg-sw{display:flex;gap:10px;align-items:center;}
        .lg-sw button{width:26px;height:26px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:.15s;}
        .lg-sw button.on{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.12),0 0 16px currentColor;transform:scale(1.12);}
        .lg-sw span{font-size:12px;color:#9AA1AD;margin-left:6px;}
        .lg-err{margin-bottom:14px;padding:10px 14px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:13px;color:#f87171;}
        .lg-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#9AA1AD;}
        .lg-row a{color:var(--c);text-decoration:none;font-weight:500;}
        /* cena 3D */
        .lg-right{position:relative;overflow:hidden;border-left:1px solid rgba(255,255,255,.06);background:radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--c) 18%,#08090B) 0%,#08090B 62%);display:flex;align-items:center;justify-content:center;perspective:1100px;}
        .lg-right::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at center,#000 30%,transparent 75%);}
        .lg-scene{position:relative;width:min(520px,80%);aspect-ratio:1;transform-style:preserve-3d;transform:rotateX(58deg) rotateZ(-20deg);}
        .lg-ring{position:absolute;inset:0;border-radius:50%;border:1px solid color-mix(in srgb,var(--c) 55%,transparent);transform-style:preserve-3d;}
        .lg-ring.r1{animation:lgSpin 26s linear infinite;}
        .lg-ring.r2{inset:12%;animation:lgSpin 18s linear infinite reverse;border-style:dashed;opacity:.8;}
        .lg-ring.r3{inset:26%;animation:lgSpin 12s linear infinite;border-color:color-mix(in srgb,var(--c) 80%,#fff);}
        .lg-ring::after{content:"";position:absolute;top:-4px;left:50%;width:8px;height:8px;border-radius:50%;background:var(--c);box-shadow:0 0 14px 3px var(--c);}
        @keyframes lgSpin{to{transform:rotateZ(360deg)}}
        .lg-core{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2;}
        .lg-core img{width:min(150px,28%);border-radius:50%;box-shadow:0 0 70px color-mix(in srgb,var(--c) 55%,transparent);animation:lgFloat 5s ease-in-out infinite;}
        @keyframes lgFloat{50%{transform:translateY(-10px)}}
        .lg-glass{position:absolute;z-index:3;padding:12px 16px;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 18px 40px rgba(0,0,0,.45);font-family:'JetBrains Mono',monospace;animation:lgBob 6s ease-in-out infinite;}
        .lg-glass small{display:block;font-size:10px;letter-spacing:.1em;color:#9AA1AD;text-transform:uppercase;margin-bottom:4px;}
        .lg-glass b{font-size:18px;font-weight:500;}
        .lg-glass em{font-style:normal;color:var(--c);}
        .g1{top:16%;left:9%;}
        .g2{bottom:20%;right:8%;animation-delay:-2s;}
        .g3{bottom:11%;left:15%;animation-delay:-4s;}
        @keyframes lgBob{50%{transform:translateY(-12px)}}
        .lg-scan{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--c),transparent);opacity:.35;animation:lgScan 7s linear infinite;}
        @keyframes lgScan{from{top:-2%}to{top:102%}}
        @media(max-width:900px){
          .lg-root{grid-template-columns:1fr;}
          .lg-right{order:-1;min-height:260px;border-left:0;border-bottom:1px solid rgba(255,255,255,.06);}
          .lg-scene{width:240px;}
          .lg-glass{display:none;}
          .lg-left{padding:28px 20px 40px;}
          .lg-brand{margin-bottom:28px;}
        }
        @media(prefers-reduced-motion:reduce){.lg-ring,.lg-glass,.lg-core img,.lg-scan{animation:none!important}}
      `}</style>

      <div className="lg-left">
        <div className="lg-form">
          <div className="lg-brand">
            <img src="/brand/haux-emblem.png" alt="" />
            <b>VendaPro</b>
          </div>
          <div className="lg-online"><i/> SISTEMA ONLINE</div>
          <h1 className="lg-h">Entrar</h1>
          <p className="lg-sub">Acesse sua conta e gerencie sua loja.</p>
          {error && <div className="lg-err">{error}</div>}
          <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label className="lg-label" htmlFor="lg-email">E-mail</label>
              <input id="lg-email" className="lg-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/>
            </div>
            <div>
              <label className="lg-label" htmlFor="lg-pass">Senha</label>
              <div style={{position:"relative"}}>
                <input id="lg-pass" className="lg-input" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{paddingRight:60}}/>
                <button type="button" onClick={()=>setShow(!show)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:0,cursor:"pointer",color:"#9AA1AD",fontSize:12}}>{show?"Ocultar":"Ver"}</button>
              </div>
            </div>
            <div className="lg-row">
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}>
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:pal.color}}/> Lembrar-me
              </label>
              <a href="https://wa.me/5511958924764" target="_blank" rel="noopener noreferrer">Esqueci a senha</a>
            </div>
            <button type="submit" disabled={loading} className="lg-btn">{loading?"Entrando...":"Entrar"}</button>
          </form>

          <div className="lg-theme">
            <small>Cor do tema</small>
            <div className="lg-sw">
              {PALETTES.map(p => (
                <button key={p.id} type="button" aria-label={p.name} title={p.name} className={activePal===p.id?"on":""} style={{background:p.color,color:p.color}} onClick={()=>pick(p.id)}/>
              ))}
              <span>{pal.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg-right" aria-hidden="true">
        <div className="lg-scan"/>
        <div className="lg-scene">
          <div className="lg-ring r1"/><div className="lg-ring r2"/><div className="lg-ring r3"/>
          <div className="lg-core"><img src="/brand/haux-emblem.png" alt=""/></div>
        </div>
        <div className="lg-glass g1"><small>Venda #1043</small><b>R$ 342,00</b></div>
        <div className="lg-glass g2"><small>Faturamento hoje</small><b><em>▲</em> R$ 4.872</b></div>
        <div className="lg-glass g3"><small>Caixa</small><b>Conciliado <em>●</em></b></div>
      </div>
    </div>
  )
}
