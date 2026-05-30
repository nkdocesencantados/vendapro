"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"
import Link from "next/link"
import Script from "next/script"
import CommandPalette from "@/components/CommandPalette"

const NAV_ALL = [
  { id:"dashboard",  href:"/dashboard",          label:"Dashboard",  icon:"dashboard" },
  { id:"vendas",     href:"/dashboard/sales",     label:"Vendas",     icon:"cart" },
  { id:"estoque",    href:"/dashboard/inventory", label:"Estoque",    icon:"box" },
  { id:"recibos",    href:"/dashboard/receipts",  label:"Recibos",    icon:"receipt" },
  { id:"caixa",      href:"/dashboard/cash",      label:"Caixa",      icon:"cash",    premium:true },
  { id:"relatórios", href:"/dashboard/reports",   label:"Relatórios", icon:"chart",   premium:true },
  { id:"equipe",     href:"/dashboard/team",      label:"Equipe",     icon:"users",   premium:true },
  { id:"config",     href:"/dashboard/settings",  label:"Config",     icon:"settings" },
]

const PLAN_MENU: Record<string,string[]> = {
  trial:    ["dashboard","vendas","estoque","recibos","caixa","relatórios","equipe","config"],
  basic:    ["dashboard","vendas","estoque","recibos","config"],
  pro:      ["dashboard","vendas","estoque","recibos","caixa","relatórios","equipe","config"],
  business: ["dashboard","vendas","estoque","recibos","caixa","relatórios","equipe","config"],
}
const PLAN_LABEL: Record<string,string> = { trial:"Trial", basic:"Basic", pro:"Pro", business:"Business" }

const ICONS: Record<string, string> = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  cart:      "M3 4h2l2.5 12h11l2-8H6",
  box:       "M21 8v13H3V8M12 3v18M3 8l9-5 9 5",
  receipt:   "M6 2v20l3-2 3 2 3-2 3 2V2zM9 8h6M9 12h6M9 16h4",
  cash:      "M3 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  chart:     "M3 3v18h18M7 12h3v6H7zM12 8h3v10h-3zM17 5h3v13h-3z",
  users:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu:      "M3 6h18M3 12h18M3 18h18",
  sun:       "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
  moon:      "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  bell:      "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  search:    "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  plus:      "M12 5v14M5 12h14",
  chevron:   "M9 18l6-6-6-6",
}

function Icon({ name, size=16 }: { name:string; size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <path d={ICONS[name] || ICONS.menu}/>
    </svg>
  )
}

const PAGE_NAMES: Record<string,string> = {
  "/dashboard": "Dashboard",
  "/dashboard/sales": "Vendas",
  "/dashboard/inventory": "Estoque",
  "/dashboard/receipts": "Recibos",
  "/dashboard/cash": "Caixa",
  "/dashboard/reports": "Relatórios",
  "/dashboard/team": "Equipe",
  "/dashboard/settings": "Configurações",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user: authUser, logout: authLogout } = useAuthStore()
  const [store,      setStore]      = useState<any>(null)
  const [dark,       setDark]       = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search,     setSearch]     = useState("")
  const [cmdOpen,    setCmdOpen]    = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [notifs,     setNotifs]     = useState<any[]>([])
  const [seenCount,  setSeenCount]  = useState(0)

  const PALETTES: Record<string,{brand:string,brandDeep:string,brandGlow:string}> = {
    emerald:  { brand:"#1D9E75", brandDeep:"#04342C", brandGlow:"#34D399" },
    amber:    { brand:"#F59E0B", brandDeep:"#3F1D04", brandGlow:"#FCD34D" },
    crimson:  { brand:"#E11D48", brandDeep:"#3F0612", brandGlow:"#FB7185" },
    violet:   { brand:"#8B5CF6", brandDeep:"#2A1065", brandGlow:"#C4B5FD" },
    ocean:    { brand:"#0EA5E9", brandDeep:"#082F49", brandGlow:"#7DD3FC" },
    indigo:   { brand:"#6366F1", brandDeep:"#1E1B4B", brandGlow:"#A5B4FC" },
    rose:     { brand:"#EC4899", brandDeep:"#3D0822", brandGlow:"#F9A8D4" },
    ouro:     { brand:"#D4A24C", brandDeep:"#2A1B05", brandGlow:"#F5D78A" },
    graphite: { brand:"#94A3B8", brandDeep:"#0F172A", brandGlow:"#CBD5E1" },
  }

  function applyPalette(name: string) {
    const r = document.documentElement
    r.setAttribute("data-palette", name)
    const t = PALETTES[name] || PALETTES.emerald
    r.style.setProperty("--brand",      t.brand)
    r.style.setProperty("--brand-deep", t.brandDeep)
    r.style.setProperty("--brand-glow", t.brandGlow)
  }

  useEffect(() => {
    if (!authUser) { router.push("/login"); return }
    const saved = localStorage.getItem("vp-theme")
    const palette = localStorage.getItem("vp-palette") || "emerald"
    applyPalette(palette)
    if (saved === "light") {
      setDark(false)
      document.documentElement.setAttribute("data-theme", "light")
    } else {
      setDark(true)
      document.documentElement.setAttribute("data-theme", "dark")
    }
    api.get("/stores").then(r => {
      const s = Array.isArray(r.data) ? r.data[0] : r.data
      if (s) {
        setStore(s)
        if (s.palette) {
          applyPalette(s.palette)
          localStorage.setItem("vp-palette", s.palette)
        }
      }
    }).catch(() => {})

    Promise.all([api.get("/products").catch(()=>({data:[]})),api.get("/reports/dashboard").catch(()=>({data:{}}))]).then(([pr,dr])=>{const nl:any[]=[],ps=Array.isArray(pr.data)?pr.data:[],d=dr.data||{},out=ps.filter((p:any)=>p.stock===0),low=ps.filter((p:any)=>p.stock>0&&p.stock<=(p.minStock||5));if(out.length>0)nl.push({type:"danger",msg:out.length+' produto(s) esgotado(s)',detail:out.slice(0,3).map((p:any)=>p.name).join(', ')});if(low.length>0)nl.push({type:"warn",msg:low.length+' com estoque baixo',detail:low.slice(0,3).map((p:any)=>p.name).join(', ')});const gp=d.monthGoalPct||0;if(gp>=90)nl.push({type:"ok",msg:'Meta quase atingida '+gp+'%',detail:'Faturamento do mes'});else if(gp>0&&gp<30)nl.push({type:"warn",msg:'Meta em '+gp+'% abaixo do esperado',detail:'Faturamento do mes'});setNotifs(nl)}).catch(()=>{})
  }, [authUser])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light")
    localStorage.setItem("vp-theme", next ? "dark" : "light")
  }

  function logout() { authLogout(); router.push("/login") }

  const plan      = store?.plan || authUser?.plan || "basic"
  const role      = authUser?.role || "store_owner"
  const storeName = store?.name || "Minha Loja"
  const storeInit = storeName.slice(0,2).toUpperCase()
  const userName  = authUser?.name || "Usuário"
  const userInit  = userName.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()
  const userRole  = role === "seller" ? "Vendedor" : role === "manager" ? "Gerente" : "Proprietário"
  const pageName  = PAGE_NAMES[pathname] || "VendaPro"

  const allowed  = PLAN_MENU[plan] || PLAN_MENU.basic
  const navItems = NAV_ALL.filter(n => {
    if (role === "seller") return ["dashboard","vendas","recibos"].includes(n.id)
    return allowed.includes(n.id)
  })

  return (
    <>
    <Script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" strategy="beforeInteractive"/>
    <div className="vp-layout">
      {/* ── SIDEBAR ── */}
      <aside className={`vp-sidebar${mobileOpen ? " open" : ""}`}>
        {/* Brand */}
        <div className="vp-sidebar-brand">
          <div className="vp-sidebar-logo">{storeInit}</div>
          <div className="vp-sidebar-brand-info">
            <div className="vp-sidebar-store-name">{storeName}</div>
            <div className="vp-sidebar-plan">{PLAN_LABEL[plan] || plan}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="vp-sidebar-nav">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link key={item.id} href={item.href} className={`vp-nav-item${active ? " active" : ""}`} onClick={() => setMobileOpen(false)}>
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
                <span className="nav-dot"/>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="vp-sidebar-footer">
          <div className="vp-user-row" onClick={logout} title="Sair">
            <div className="vp-avatar">{userInit}</div>
            <div className="vp-user-info">
              <div className="vp-user-name">{userName}</div>
              <div className="vp-user-role">{userRole}</div>
            </div>
            <Icon name="logout" size={14} />
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",zIndex:49}} onClick={() => setMobileOpen(false)}/>
      )}

      {/* ── MAIN ── */}
      <div className="vp-main">
        {/* Topbar */}
        <header className="vp-topbar">
          <button className="vp-icon-btn" style={{display:"none"}} id="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}>
            <Icon name="menu" size={16}/>
          </button>

          <div className="vp-breadcrumb">
            <span>{storeName}</span>
            <span className="vp-breadcrumb-sep">›</span>
            <span className="vp-breadcrumb-current">{pageName}</span>
          </div>

          <div className="vp-search" onClick={() => window.dispatchEvent(new CustomEvent("open-cmd-palette"))} style={{cursor:"pointer"}}>
            <Icon name="search" size={14}/>
            <span style={{fontSize:12,color:"var(--text-subtle)"}}>Pesquisa rápida</span>
            <span style={{fontSize:11,color:"var(--text-subtle)",whiteSpace:"nowrap",background:"var(--surface-2)",border:"1px solid var(--border)",borderRadius:5,padding:"1px 6px"}}>⌘K</span>
          </div>
          <CommandPalette/>

          <div className="vp-topbar-actions">
            <button className="vp-icon-btn" onClick={toggleDark} title={dark ? "Modo claro" : "Modo escuro"}>
              <Icon name={dark ? "sun" : "moon"} size={15}/>
            </button>
            <div style={{position:"relative"}}>
              <button className="vp-icon-btn" title="Notificações" onClick={()=>{setNotifOpen(o=>!o);setSeenCount(notifs.length)}} style={{position:"relative"}}>
                <Icon name="bell" size={15}/>
                {notifs.length>seenCount&&<span style={{position:"absolute",top:2,right:2,width:8,height:8,borderRadius:"50%",background:"var(--danger)",border:"2px solid var(--bg-elevated)",display:"block"}}/>}
              </button>
              {notifOpen && (
                <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:260,background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"var(--shadow-lg)",zIndex:200,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",fontSize:13,fontWeight:600,color:"var(--text)"}}>Notificações</div>
                  <div style={{maxHeight:280,overflowY:"auto"}}>
                    {notifs.length===0 ? (
                      <div style={{padding:"10px 16px",fontSize:12,color:"var(--text-muted)"}}>Nenhuma notificação no momento.</div>
                    ) : notifs.map((n:any,i:number)=>(
                      <div key={i} style={{padding:"10px 14px",borderBottom:"1px solid var(--border)",display:"flex",gap:8,alignItems:"flex-start"}}>
                        <span style={{fontSize:14,color:n.type==="danger"?"var(--danger)":n.type==="ok"?"var(--success)":"var(--warning)",flexShrink:0}}>{n.type==="danger"?"⚠":n.type==="ok"?"✓":"!"}</span>
                        <div><div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{n.msg}</div>{n.detail&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{n.detail}</div>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {notifOpen && <div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setNotifOpen(false)}/>}
            </div>
            <span className="vp-plan-badge">{PLAN_LABEL[plan] || plan}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="vp-content">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
    </>
  )
}
