"use client"
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react"
import { useAuthStore } from "@/contexts/auth.store"
import { VendaProLogo } from "@/components/logo"

const POSTER = "/brand/login-hero-poster.jpg"

/* Painel da marca: vídeo em loop → poster → emblema estático, sem mudar o layout. */
function BrandMedia() {
  const [reduce, setReduce] = useState(true)          // começa estático; só anima depois de checar a preferência
  const [videoFailed, setVideoFailed] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches)
    mq.addEventListener?.("change", onChange)
    const img = new Image()
    img.onerror = () => setPosterFailed(true)
    img.src = POSTER
    return () => mq.removeEventListener?.("change", onChange)
  }, [])

  return (
    <div className="lg-media" aria-hidden="true">
      <img className="lg-emblem" src="/brand/haux-emblem.png" alt="" />
      {!reduce && !videoFailed ? (
        <video className="lg-video" autoPlay muted loop playsInline poster={posterFailed ? undefined : POSTER} onError={() => setVideoFailed(true)}>
          <source src="/brand/login-hero.webm" type="video/webm" />
          <source src="/brand/login-hero.mp4" type="video/mp4" onError={() => setVideoFailed(true)} />
        </video>
      ) : !posterFailed ? (
        <img className="lg-video" src={POSTER} alt="" onError={() => setPosterFailed(true)} />
      ) : null}
      <div className="lg-shade" />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const login  = useAuthStore((s) => s.login)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [remember, setRemember] = useState(true)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      await login(email, password)
      const authU = useAuthStore.getState().user
      if (authU?.role === "super_admin") router.push("/superadmin"); else router.push("/dashboard")
    } catch(err: any) {
      setError(err?.response?.data?.message || "E-mail ou senha incorretos. Confira e tente de novo.")
    } finally { setLoading(false) }
  }

  return (
    // data-theme="dark" fixa o verde Txai Tech aqui, independente do tema/paleta da loja
    <div className="lg-root" data-theme="dark">
      <style dangerouslySetInnerHTML={{ __html: `
        .lg-root{min-height:100vh;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);background:var(--bg);color:var(--text);font-family:var(--font);}
        .lg-brand{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:28px;padding:48px;border-right:1px solid var(--border);
          background:radial-gradient(700px 500px at 30% 40%,rgba(45,190,96,.22),transparent 65%),linear-gradient(160deg,#0B3A1F 0%,#06120B 60%,#060A08 100%);}
        .lg-brand::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(126,232,168,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(126,232,168,.05) 1px,transparent 1px);background-size:40px 40px;}
        .lg-media{position:absolute;inset:0;display:grid;place-items:center;}
        .lg-emblem{width:min(220px,34%);aspect-ratio:1;border-radius:50%;opacity:.9;box-shadow:0 0 80px rgba(45,190,96,.35);}
        .lg-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:transparent;}
        .lg-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,8,.55) 0%,rgba(6,10,8,0) 30%,rgba(6,10,8,.2) 55%,rgba(6,10,8,.92) 100%);}
        .lg-brand > *:not(.lg-media){position:relative;}
        .lg-copy{margin-top:auto;display:flex;flex-direction:column;gap:16px;max-width:480px;}
        .lg-h{font-size:clamp(32px,4vw,44px);line-height:1.05;font-weight:600;letter-spacing:-.03em;text-wrap:balance;}
        .lg-h span{color:var(--brand-neon);}
        .lg-lead{font-size:16px;line-height:1.6;color:#B7CCBF;max-width:44ch;}
        .lg-chips{list-style:none;display:flex;flex-wrap:wrap;gap:10px;}
        .lg-chips li{font-size:13px;padding:8px 12px;border-radius:999px;border:1px solid rgba(126,232,168,.25);background:rgba(6,10,8,.55);backdrop-filter:blur(6px);}
        .lg-formwrap{display:flex;align-items:center;justify-content:center;padding:48px;}
        .lg-form{width:100%;max-width:380px;display:flex;flex-direction:column;gap:18px;}
        .lg-title{font-size:26px;font-weight:600;letter-spacing:-.02em;}
        .lg-sub{font-size:14px;color:var(--text-muted);margin-top:6px;}
        .lg-label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--text-soft);}
        .lg-input{width:100%;min-height:46px;padding:0 14px;border-radius:12px;border:1px solid var(--border-strong);background:#0B120F;color:var(--text);font:15px var(--font);outline:none;transition:border-color .18s,box-shadow .18s;}
        .lg-input::placeholder{color:var(--text-subtle);}
        .lg-input:focus{border-color:var(--brand);box-shadow:var(--focus-ring);}
        .lg-input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #0B120F inset!important;-webkit-text-fill-color:var(--text)!important;}
        .lg-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:36px;height:36px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;color:var(--text-muted);cursor:pointer;}
        .lg-eye:hover{color:var(--text);background:var(--surface-2);}
        .lg-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;}
        .lg-row label{display:flex;align-items:center;gap:8px;color:var(--text-soft);cursor:pointer;}
        .lg-row a,.lg-foot a{color:var(--brand-neon);text-decoration:none;font-weight:500;}
        .lg-row a:hover,.lg-foot a:hover{color:#B6F5CF;text-decoration:underline;}
        .lg-err{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:var(--danger-bg);border:1px solid rgba(255,138,138,.3);font-size:13px;line-height:1.45;color:var(--danger);}
        .lg-submit{min-height:48px;font-size:15px;width:100%;}
        .lg-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(4,20,10,.3);border-top-color:#04140A;animation:spin .7s linear infinite;}
        .lg-seal{display:flex;align-items:center;justify-content:center;gap:8px;padding-top:14px;border-top:1px solid var(--border);font-size:12px;color:var(--text-subtle);}
        @media(max-width:900px){
          .lg-root{grid-template-columns:minmax(0,1fr);}
          .lg-brand{min-height:220px;padding:20px;gap:14px;border-right:0;border-bottom:1px solid var(--border);}
          .lg-emblem{width:120px;}
          .lg-h{font-size:28px;}
          .lg-lead,.lg-chips{display:none;}
          .lg-formwrap{padding:28px 20px 40px;align-items:flex-start;}
        }
      ` }} />

      <section className="lg-brand">
        <BrandMedia />
        <VendaProLogo size={44} />
        <div className="lg-copy">
          <h1 className="lg-h">Seu negócio,<br/><span>no controle.</span></h1>
          <p className="lg-lead">Vendas, estoque, caixa e fiado em um só lugar, feito para quem vende todo dia.</p>
        </div>
        <ul className="lg-chips">
          <li>PIX integrado</li>
          <li>Cobrança pelo WhatsApp</li>
          <li>Funciona no celular</li>
        </ul>
      </section>

      <section className="lg-formwrap">
        <form className="lg-form" onSubmit={onSubmit}>
          <div>
            <h2 className="lg-title">Entrar</h2>
            <p className="lg-sub">Acesse o painel da sua loja.</p>
          </div>

          {error && <div className="lg-err" role="alert"><AlertCircle size={16} style={{flexShrink:0,marginTop:1}} aria-hidden/>{error}</div>}

          <label className="lg-label" htmlFor="lg-email">E-mail
            <input id="lg-email" className="lg-input" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@sualoja.com.br" required/>
          </label>

          <label className="lg-label" htmlFor="lg-pass">Senha
            <span style={{position:"relative",display:"block"}}>
              <input id="lg-pass" className="lg-input" type={show?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha" required style={{paddingRight:48}}/>
              <button type="button" className="lg-eye" onClick={()=>setShow(!show)} aria-label={show?"Ocultar senha":"Mostrar senha"} aria-pressed={show}>
                {show ? <EyeOff size={17} aria-hidden/> : <Eye size={17} aria-hidden/>}
              </button>
            </span>
          </label>

          <div className="lg-row">
            <label>
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:"var(--brand)",width:16,height:16}}/> Manter conectado
            </label>
            <Link href="/forgot-password">Esqueci a senha</Link>
          </div>

          <button type="submit" disabled={loading} className="vp-btn vp-btn-primary lg-submit">
            {loading ? <><span className="lg-spin" aria-hidden/> Entrando…</> : "Entrar"}
          </button>

          <div className="lg-seal">
            <Lock size={14} aria-hidden/> Conexão criptografada · Um produto Txai Tech
          </div>
        </form>
      </section>
    </div>
  )
}
