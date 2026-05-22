"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"

const NAV_ALL = [
  { id: "dashboard",  href: "/dashboard",         label: "Dashboard",  icon: "dashboard" },
  { id: "vendas",     href: "/dashboard/sales",    label: "Vendas",     icon: "cart" },
  { id: "estoque",    href: "/dashboard/stock",    label: "Estoque",    icon: "box" },
  { id: "recibos",    href: "/dashboard/receipts", label: "Recibos",    icon: "receipt" },
  { id: "caixa",      href: "/dashboard/cash",     label: "Caixa",      icon: "cash",    premium: true },
  { id: "relatorios", href: "/dashboard/reports",  label: "Relatorios", icon: "chart",   premium: true },
  { id: "equipe",     href: "/dashboard/team",     label: "Equipe",     icon: "users",   premium: true },
  { id: "config",     href: "/dashboard/settings", label: "Config",     icon: "settings" },
]

const PLAN_MENU: Record<string,string[]> = {
  trial:    ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
  basic:    ["dashboard","vendas","estoque","recibos","config"],
  pro:      ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
  business: ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
}
const PLAN_LABEL: Record<string,string> = { trial:"Trial", basic:"Basic", pro:"Pro", business:"Business" }

function Icon({ name, size=18 }: { name:string, size?:number }) {
  const p: Record<string,string> = {
    dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
    cart:      "M3 4h2l2.5 12h11l2-8H6",
    box:       "M21 8v13H3V8M12 3v18M3 8l9-5 9 5",
    receipt:   "M6 2v20l3-2 3 2 3-2 3 2V2zM9 8h6M9 12h6M9 16h4",
    cash:      "M3 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
    chart:     "M3 3v18h18M7 12h3v6H7zM12 8h3v10h-3zM17 5h3v13h-3z",
    users:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    logout:    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    menu:      "M3 6h18M3 12h18M3 18h18",
    chevron:   "M9 18l6-6-6-6",
    sun:       "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d={p[name] || ""} />
      {name === "cart" && <><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></>}
      {name === "cash" && <circle cx="12" cy="12" r="2.5"/>}
    </svg>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light")
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  useEffect(() => {
    const u = localStorage.getItem("user")
    if (!u) { router.push("/login"); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setDark(true)
      document.documentElement.setAttribute("data-theme", "dark")
    }
    const sc = localStorage.getItem("storeConfig")
    if (sc) { try { setStore(JSON.parse(sc)) } catch {} }
    api.get("/stores").then(r => {
      setStore(r.data)
      localStorage.setItem("storeConfig", JSON.stringify(r.data))
    }).catch(() => {})
  }, [])

  function logout() { localStorage.clear(); router.push("/login") }

  const plan = store?.plan || "basic"
  const role = user?.role || "store_owner"
  const storeName = store?.name || "Minha Loja"
  const storeInitials = storeName.slice(0,2).toUpperCase()
  const primaryColor = store?.primaryColor || "#1D9E75"
  const userName = user?.name || "Usuario"
  const userInitials = userName.split(" ").map((n:string) => n[0]).join("").slice(0,2).toUpperCase()
  const allowed = PLAN_MENU[plan] || PLAN_MENU.basic
  const navItems = NAV_ALL.filter(n => {
    if (role === "seller") return ["dashboard","vendas","recibos"].includes(n.id)
    return allowed.includes(n.id)
  })
  function getActive() {
    if (pathname === "/dashboard") return "dashboard"
    return NAV_ALL.find(n => n.href !== "/dashboard" && pathname.startsWith(n.href))?.id || "dashboard"
  }
  const active = getActive()
  const pageLabel = NAV_ALL.find(n => n.id === active)?.label || "Dashboard"

  return (
    <>
      <style>{`
        .vp-app{min-height:100vh;display:flex;background:var(--bg);}
        .vp-sidebar{width:248px;flex-shrink:0;background:#04130F;border-right:1px solid #1F3A33;display:flex;flex-direction:column;height:100vh;position:sticky;top:0;z-index:30;color:#E5F2EC;}
        .vp-sidebar-head{padding:16px 14px 12px;border-bottom:1px solid #1F3A33;}
        .vp-store-card{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;background:#0E2620;border:1px solid #1F3A33;}
        .vp-store-badge{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;color:white;font-weight:700;font-size:13px;flex-shrink:0;}
        .vp-store-meta{display:flex;flex-direction:column;min-width:0;flex:1;}
        .vp-store-meta strong{font-size:13.5px;font-weight:600;color:#F0F7F4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-0.01em;}
        .vp-store-meta small{font-size:11px;color:#7A9990;margin-top:2px;display:flex;align-items:center;gap:4px;}
        .vp-nav{padding:10px 8px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:1px;}
        .vp-nav::-webkit-scrollbar{width:0;}
        .vp-nav-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;font-size:13.5px;color:#8DA39A;cursor:pointer;user-select:none;text-decoration:none;transition:background 0.12s,color 0.12s;}
        .vp-nav-item:hover{background:#0E2620;color:#E5F2EC;}
        .vp-nav-item.active{background:rgba(29,158,117,0.18);color:#fff;font-weight:500;}
        .vp-nav-item svg{flex-shrink:0;opacity:0.9;}
        .vp-sidebar-foot{padding:10px 12px;border-top:1px solid #1F3A33;display:flex;flex-direction:column;gap:4px;}
        .vp-user-pill{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:background 0.12s;}
        .vp-user-pill:hover{background:#0E2620;}
        .vp-user-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;color:white;flex-shrink:0;}
        .vp-user-meta{display:flex;flex-direction:column;flex:1;min-width:0;}
        .vp-user-meta strong{font-size:13px;font-weight:500;color:#F0F7F4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .vp-user-meta small{font-size:11px;color:#7A9990;}
        .vp-main{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;}
        .vp-topbar{height:56px;padding:0 24px;border-bottom:1px solid var(--border);background:var(--bg-elevated);display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:20;flex-shrink:0;}
        .vp-crumbs{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-subtle);}
        .vp-crumbs .sep{color:var(--border-strong);}
        .vp-crumbs .cur{color:var(--text);font-weight:500;}
        .vp-plan{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:500;}
        .vp-plan-trial{background:var(--info-bg);color:var(--info);}
        .vp-plan-basic{background:var(--surface-3);color:var(--text-muted);}
        .vp-plan-pro{background:var(--brand-tint);color:var(--brand-deep);}
        .vp-plan-business{background:linear-gradient(135deg,#04342C,#1D9E75);color:white;}
        .vp-content{flex:1;overflow-y:auto;background:var(--bg);}
        
        [data-theme="dark"] {
          --bg:#0A1412; --bg-elevated:#0F1B18; --surface:#0F1B18;
          --surface-2:#142421; --surface-3:#1A2E29;
          --border:#1F3A33; --border-strong:#2A4D44;
          --text:#F5F5F4; --text-muted:#A8B3AF; --text-subtle:#7A8480;
          --brand-tint:rgba(29,158,117,0.12);
          --success-bg:rgba(29,158,117,0.14);
          --warning-bg:rgba(180,83,9,0.16);
          --danger-bg:rgba(185,28,28,0.16);
          --info-bg:rgba(30,64,175,0.18);
          --shadow-lg:0 16px 40px rgba(0,0,0,0.55),0 4px 8px rgba(0,0,0,0.35);
        }
        .vp-theme-btn{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;font-size:13px;color:#8DA39A;cursor:pointer;transition:background 0.12s,color 0.12s;}
        .vp-theme-btn:hover{background:#0E2620;color:#E5F2EC;}
        .vp-mob-btn{display:none;width:36px;height:36px;border-radius:8px;border:1px solid var(--border);color:var(--text-muted);align-items:center;justify-content:center;}
        @media(max-width:900px){.vp-sidebar{position:fixed;transform:translateX(-100%);transition:transform 0.2s;box-shadow:var(--shadow-lg);}.vp-sidebar.open{transform:translateX(0);}.vp-mob-btn{display:flex;}}
      `}</style>
      <div className="vp-app">
        {mobileOpen && <div onClick={()=>setMobileOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:29}}/>}
        <aside className={`vp-sidebar${mobileOpen?" open":""}`}>
          <div className="vp-sidebar-head">
            <div className="vp-store-card">
              <div className="vp-store-badge" style={{background:primaryColor}}>{storeInitials}</div>
              <div className="vp-store-meta">
                <strong>{storeName}</strong>
                <small><span className={`vp-plan vp-plan-${plan}`}>{PLAN_LABEL[plan]||plan}</span></small>
              </div>
            </div>
          </div>
          <nav className="vp-nav">
            {navItems.map(n=>(
              <Link key={n.id} href={n.href} className={`vp-nav-item${active===n.id?" active":""}`} onClick={()=>setMobileOpen(false)}>
                <Icon name={n.icon} size={17}/>
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="vp-sidebar-foot">
            <div className="vp-theme-btn" onClick={toggleDark}>
              <Icon name="sun" size={16}/>
              <span>{dark ? "Modo claro" : "Modo escuro"}</span>
            </div>
            <div className="vp-user-pill" onClick={logout}>
              <div className="vp-user-avatar" style={{background:primaryColor}}>{userInitials}</div>
              <div className="vp-user-meta">
                <strong>{userName}</strong>
                <small>{role==="seller"?"Vendedor":role==="super_admin"?"Super Admin":"Proprietario"}</small>
              </div>
              <Icon name="logout" size={14}/>
            </div>
          </div>
        </aside>
        <div className="vp-main">
          <header className="vp-topbar">
            <button className="vp-mob-btn" onClick={()=>setMobileOpen(true)}><Icon name="menu" size={18}/></button>
            <div className="vp-crumbs">
              <span>{storeName}</span>
              <span className="sep"><Icon name="chevron" size={11}/></span>
              <span className="cur">{pageLabel}</span>
            </div>
            <div style={{flex:1}}/>
            <span className={`vp-plan vp-plan-${plan}`}>{PLAN_LABEL[plan]||plan}</span>
          </header>
          <div className="vp-content">{children}</div>
        </div>
      </div>
    </>
  )
}
