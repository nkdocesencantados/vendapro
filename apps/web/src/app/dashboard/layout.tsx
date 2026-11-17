"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"
import Link from "next/link"
import CommandPalette from "@/components/CommandPalette"
import Tour from "@/components/Tour"
import { VendaProLogo } from "@/components/logo"
import {
  LayoutDashboard, ShoppingCart, Users, HandCoins, Package, Wallet, Receipt, BarChart3,
  Percent, UsersRound, Settings, LogOut, Menu, Sun, Moon, Bell, Search, Lock, MessageCircle,
  AlertTriangle, Check, QrCode, HelpCircle, type LucideIcon,
} from "lucide-react"

type NavItem = { id: string; href: string; label: string; icon: LucideIcon; badge?: string }

const NAV_ALL: NavItem[] = [
  { id:"dashboard",  href:"/dashboard",             label:"Dashboard",     icon:LayoutDashboard },
  { id:"vendas",     href:"/dashboard/sales",       label:"Vendas",        icon:ShoppingCart },
  { id:"clientes",   href:"/dashboard/customers",   label:"Clientes",      icon:Users,     badge:"NOVO" },
  { id:"fiado",      href:"/dashboard/receivables", label:"Fiado",         icon:HandCoins, badge:"NOVO" },
  { id:"pix",        href:"/dashboard/pix",         label:"Cobrar PIX",    icon:QrCode,    badge:"NOVO" },
  { id:"estoque",    href:"/dashboard/inventory",   label:"Estoque",       icon:Package },
  { id:"caixa",      href:"/dashboard/cash",        label:"Caixa",         icon:Wallet },
  { id:"recibos",    href:"/dashboard/receipts",    label:"Recibos",       icon:Receipt },
  { id:"relatórios", href:"/dashboard/reports",     label:"Relatórios",    icon:BarChart3 },
  { id:"comissoes",  href:"/dashboard/commissions", label:"Comissões",     icon:Percent },
  { id:"equipe",     href:"/dashboard/team",        label:"Equipe",        icon:UsersRound },
  { id:"config",     href:"/dashboard/settings",    label:"Configurações", icon:Settings },
]

const BASE_MENU = ["dashboard","vendas","clientes","fiado","pix","estoque","recibos","relatórios","config"]
const PLAN_MENU: Record<string,string[]> = {
  trial:    BASE_MENU,
  basic:    BASE_MENU,
  starter:  BASE_MENU,
  pro:      BASE_MENU,
  business: ["dashboard","vendas","clientes","fiado","pix","estoque","caixa","recibos","relatórios","comissoes","equipe","config"],
}
const SELLER_MENU = ["dashboard","vendas","clientes","pix","recibos"]
const PLAN_LABEL: Record<string,string> = { trial:"Trial", basic:"Pro", starter:"Pro", pro:"Pro", business:"Business" }
const PALETTE_IDS = ["emerald","indigo","amber","crimson","violet","ocean","rose","ouro","graphite"]
const TRIAL_DAYS = 7
const WHATS_ACTIVATE = "https://wa.me/5511958924764?text=Quero+ativar+meu+plano+VendaPro"

const PAGE_NAMES: Record<string,string> = Object.fromEntries(NAV_ALL.map(n => [n.href, n.label]))

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user: authUser, logout: authLogout } = useAuthStore()
  const [store,      setStore]      = useState<any>(null)
  const [dark,       setDark]       = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [notifs,     setNotifs]     = useState<any[]>([])
  const [seenCount,  setSeenCount]  = useState(0)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number|null>(null)
  const [trialExpired,  setTrialExpired]  = useState(false)

  // Recarregar store ao voltar para a janela (reflete mudança de plano imediatamente)
  useEffect(() => {
    const onFocus = () => {
      api.get("/stores").then(r => {
        const s = Array.isArray(r.data) ? r.data[0] : r.data
        if (s) { setStore(s) }
      }).catch(() => {})
    }
    window.addEventListener("focus", onFocus)
    window.addEventListener("storeConfigUpdated", onFocus)
    return () => { window.removeEventListener("focus", onFocus); window.removeEventListener("storeConfigUpdated", onFocus) }
  }, [])

  useEffect(() => {
    // read the store directly: during hydration the hook still returns the server snapshot (user null), which bounced every refresh to /dashboard
    if (!useAuthStore.getState().user) { router.push("/login"); return }
    const root = document.documentElement
    applyPalette(localStorage.getItem("vp-palette") || "emerald")

    const saved = localStorage.getItem("vp-theme")
    if (saved === "light") {
      setDark(false)
      root.setAttribute("data-theme", "light")
    } else {
      setDark(true)
      root.setAttribute("data-theme", "dark")
    }
    api.get("/stores").then(r => {
      const s = Array.isArray(r.data) ? r.data[0] : r.data
      if (s) {
        setStore(s)
        if (s.palette) applyPalette(s.palette)
        if (s.trialDaysLeft !== null && s.trialDaysLeft !== undefined) setTrialDaysLeft(s.trialDaysLeft)
        if (s.trialExpired || s.status === 'inactive' || s.status === 'blocked') setTrialExpired(true)
      }
    }).catch(() => {})

    Promise.all([
      api.get("/products").catch(()=>({data:[]})),
      api.get("/reports/dashboard").catch(()=>({data:{}})),
    ]).then(([pr,dr]) => {
      const nl:any[] = []
      const ps = Array.isArray(pr.data) ? pr.data : []
      const d  = dr.data || {}
      const out = ps.filter((p:any)=>p.stock===0)
      const low = ps.filter((p:any)=>p.stock>0&&p.stock<=(p.minStock||5))
      if (out.length>0) nl.push({type:"danger",msg:out.length+' produto(s) esgotado(s)',detail:out.slice(0,3).map((p:any)=>p.name).join(', ')})
      if (low.length>0) nl.push({type:"warn",msg:low.length+' com estoque baixo',detail:low.slice(0,3).map((p:any)=>p.name).join(', ')})
      const gp = d.monthGoalPct||0
      if (gp>=90) nl.push({type:"ok",msg:'Meta quase atingida '+gp+'%',detail:'Faturamento do mês'})
      else if (gp>0&&gp<30) nl.push({type:"warn",msg:'Meta em '+gp+'% abaixo do esperado',detail:'Faturamento do mês'})
      setNotifs(nl)
    }).catch(()=>{})
  }, [authUser])

  // Paleta da loja: só o atributo; as cores vêm de globals.css ([data-palette=...]).
  function applyPalette(name: string) {
    const r = document.documentElement
    const id = PALETTE_IDS.includes(name) ? name : "emerald"
    r.setAttribute("data-palette", id)
    ;["--brand","--brand-deep","--brand-glow"].forEach(v => r.style.removeProperty(v)) // limpa estilo inline de versões antigas
    try { localStorage.setItem("vp-palette", id) } catch {}
  }

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light")
    localStorage.setItem("vp-theme", next ? "dark" : "light")
  }

  function logout() { authLogout(); window.location.href = "/login" }

  const plan      = store?.plan || "business"  // sempre da API, nunca do localStorage
  const role      = authUser?.role || "store_owner"
  const storeName = store?.name || "Minha Loja"
  const userName  = authUser?.name || "Usuário"
  const userInit  = userName.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()
  const userRole  = role === "seller" ? "Vendedor" : role === "manager" ? "Gerente" : "Proprietário"
  const pageName  = PAGE_NAMES[pathname] || NAV_ALL.find(n => n.href !== "/dashboard" && pathname.startsWith(n.href))?.label || "VendaPro"

  const allowed  = role === "seller" ? SELLER_MENU : (PLAN_MENU[plan] || PLAN_MENU.basic)
  const hidden: string[] = store?.settings?.hiddenModules || []
  const navItems = NAV_ALL.filter(n => allowed.includes(n.id) && !hidden.includes(n.id))

  // Tela de bloqueio de trial
  if (trialExpired) return (
    <main style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24,textAlign:"center"}}>
      <VendaProLogo size={40}/>
      <div style={{width:52,height:52,borderRadius:"50%",background:"var(--danger-bg)",color:"var(--danger)",display:"flex",alignItems:"center",justifyContent:"center",marginTop:16}}>
        <Lock size={22} aria-hidden/>
      </div>
      <h1 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>{trialDaysLeft===0?"Período de teste encerrado":"Acesso suspenso"}</h1>
      <p style={{fontSize:14,color:"var(--text-muted)",maxWidth:380,lineHeight:1.6}}>{trialDaysLeft===0?"Seus 7 dias gratuitos chegaram ao fim. Para continuar usando o VendaPro, fale com a gente e ative seu plano.":"Sua conta foi suspensa. Fale com a gente para regularizar o acesso."}</p>
      <a href={WHATS_ACTIVATE} target="_blank" rel="noopener noreferrer" className="vp-btn vp-btn-primary vp-btn-lg" style={{marginTop:8}}>
        <MessageCircle size={18} aria-hidden/> Falar no WhatsApp
      </a>
      <button onClick={()=>{localStorage.clear();window.location.href="/login"}} className="vp-btn vp-btn-ghost vp-btn-sm">Sair</button>
    </main>
  )

  const trialPct = trialDaysLeft !== null ? Math.max(0, Math.min(100, Math.round((trialDaysLeft / TRIAL_DAYS) * 100))) : 0

  return (
    <div className="vp-layout">
      {/* ── SIDEBAR ── */}
      <aside className={`vp-sidebar${mobileOpen ? " open" : ""}`} aria-label="Menu principal">
        <Link href="/dashboard" className="vp-sidebar-brand" onClick={() => setMobileOpen(false)} aria-label="VendaPro, ir para o Dashboard">
          <VendaProLogo size={36}/>
        </Link>

        <div className="vp-sidebar-store" title={storeName} style={{flexDirection:"row",alignItems:"center",gap:10}}>
          {store?.logoUrl && <img src={store.logoUrl} alt="" width={34} height={34} style={{width:34,height:34,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
          <span style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
            <span className="vp-sidebar-store-name">{storeName}</span>
            <span className="vp-sidebar-plan">Plano {PLAN_LABEL[plan] || plan}</span>
          </span>
        </div>

        <nav className="vp-sidebar-nav" aria-label="Principal">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            const Ico = item.icon
            return (
              <Link key={item.id} href={item.href} className={`vp-nav-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)}>
                <Ico size={17} strokeWidth={1.8} aria-hidden/>
                <span>{item.label}</span>
                {item.badge && !active && <span className="vp-nav-badge">{item.badge}</span>}
                <span className="nav-dot" aria-hidden/>
              </Link>
            )
          })}
        </nav>

        {trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div className="vp-upsell">
            <span className="vp-upsell-label">Plano {PLAN_LABEL[plan] || plan} · {trialDaysLeft} dia{trialDaysLeft!==1?"s":""} de teste</span>
            <div className="vp-progress" style={{height:6}} role="progressbar" aria-valuenow={trialDaysLeft} aria-valuemin={0} aria-valuemax={TRIAL_DAYS} aria-label="Dias de teste restantes">
              <div className="vp-progress-fill" style={{width:`${trialPct}%`,boxShadow:"none"}}/>
            </div>
            <a href={WHATS_ACTIVATE} target="_blank" rel="noopener noreferrer">Ativar plano →</a>
          </div>
        )}

        <div className="vp-sidebar-footer">
          <button type="button" className="vp-user-row" onClick={logout} title="Sair">
            <span className="vp-avatar">{userInit}</span>
            <span className="vp-user-info">
              <span className="vp-user-name" style={{display:"block"}}>{userName}</span>
              <span className="vp-user-role" style={{display:"block"}}>{userRole}</span>
            </span>
            <LogOut size={15} aria-label="Sair"/>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{position:"fixed",inset:0,background:"rgba(2,5,3,0.6)",backdropFilter:"blur(4px)",zIndex:49}} onClick={() => setMobileOpen(false)}/>
      )}

      {/* ── MAIN ── */}
      <div className="vp-main">
        {trialDaysLeft !== null && trialDaysLeft <= 3 && trialDaysLeft > 0 && (
          <div style={{background:"var(--warning-bg)",borderBottom:"1px solid color-mix(in srgb,var(--warning) 25%,transparent)",padding:"8px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,fontSize:13}}>
            <span style={{color:"var(--warning)",fontWeight:500,display:"inline-flex",alignItems:"center",gap:8}}>
              <AlertTriangle size={15} aria-hidden/> Seu teste termina em <strong>{trialDaysLeft} dia{trialDaysLeft!==1?"s":""}</strong>
            </span>
            <a href={WHATS_ACTIVATE} target="_blank" rel="noopener noreferrer" style={{color:"var(--warning)",fontWeight:600,fontSize:12,textDecoration:"none"}}>Ativar agora →</a>
          </div>
        )}

        <header className="vp-topbar">
          <button className="vp-icon-btn" style={{display:"none"}} id="mobile-menu-btn" aria-label="Abrir menu" aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu size={18} aria-hidden/>
          </button>

          <div className="vp-breadcrumb">
            <span>{storeName}</span>
            <span className="vp-breadcrumb-sep" aria-hidden>/</span>
            <span className="vp-breadcrumb-current">{pageName}</span>
          </div>

          <button type="button" className="vp-search" onClick={() => window.dispatchEvent(new CustomEvent("open-cmd-palette"))} style={{cursor:"pointer"}} aria-label="Buscar produto, cliente, venda">
            <Search size={15} aria-hidden/>
            <span style={{flex:1,textAlign:"left"}}>Buscar produto, cliente, venda…</span>
            <span className="vp-kbd">Ctrl K</span>
          </button>
          <CommandPalette/>
          <Tour/>

          <div className="vp-topbar-actions">
            <button className="vp-icon-btn" onClick={()=>window.dispatchEvent(new Event("vp-tour-open"))} title="Como usar o VendaPro" aria-label="Abrir tour de ajuda">
              <HelpCircle size={18} aria-hidden/>
            </button>
            <button className="vp-icon-btn" onClick={toggleDark} title={dark ? "Modo claro" : "Modo escuro"} aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}>
              {dark ? <Sun size={16} aria-hidden/> : <Moon size={16} aria-hidden/>}
            </button>
            <div style={{position:"relative"}}>
              <button className="vp-icon-btn" aria-label="Notificações" title="Notificações" onClick={()=>{setNotifOpen(o=>!o);setSeenCount(notifs.length)}} style={{position:"relative"}}>
                <Bell size={16} aria-hidden/>
                {notifs.length>seenCount&&<span style={{position:"absolute",top:6,right:6,width:8,height:8,borderRadius:"50%",background:"var(--warning)",border:"2px solid var(--bg)",display:"block"}}/>}
              </button>
              {notifOpen && (
                <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:280,background:"var(--bg-elevated)",border:"1px solid var(--border-strong)",borderRadius:14,boxShadow:"var(--shadow-lg)",zIndex:200,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",fontSize:13,fontWeight:600,color:"var(--text)"}}>Notificações</div>
                  <div style={{maxHeight:280,overflowY:"auto"}}>
                    {notifs.length===0 ? (
                      <div style={{padding:"14px 16px",fontSize:13,color:"var(--text-muted)"}}>Nenhuma notificação no momento.</div>
                    ) : notifs.map((n:any,i:number)=>{
                      const tone = n.type==="danger"?"var(--danger)":n.type==="ok"?"var(--success)":"var(--warning)"
                      return (
                        <div key={i} style={{padding:"10px 14px",borderBottom:"1px solid var(--border)",display:"flex",gap:10,alignItems:"flex-start"}}>
                          <span style={{color:tone,flexShrink:0,marginTop:1}}>{n.type==="ok"?<Check size={15} aria-hidden/>:<AlertTriangle size={15} aria-hidden/>}</span>
                          <div><div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{n.msg}</div>{n.detail&&<div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{n.detail}</div>}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {notifOpen && <div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setNotifOpen(false)}/>}
            </div>
            <span className="vp-plan-badge">{PLAN_LABEL[plan] || plan}</span>
          </div>
        </header>

        <main className="vp-content">
          {children}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          #mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 480px) {
          .vp-plan-badge { display: none; }
        }
      ` }} />
    </div>
  )
}
