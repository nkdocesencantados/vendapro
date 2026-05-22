"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"
import Link from "next/link"

const NAV_ALL = [
  { id:"dashboard",  href:"/dashboard",         label:"Dashboard",  icon:"dashboard" },
  { id:"vendas",     href:"/dashboard/sales",    label:"Vendas",     icon:"cart" },
  { id:"estoque",    href:"/dashboard/stock",    label:"Estoque",    icon:"box" },
  { id:"recibos",    href:"/dashboard/receipts", label:"Recibos",    icon:"receipt" },
  { id:"caixa",      href:"/dashboard/cash",     label:"Caixa",      icon:"cash",    premium:true },
  { id:"relatorios", href:"/dashboard/reports",  label:"Relatorios", icon:"chart",   premium:true },
  { id:"equipe",     href:"/dashboard/team",     label:"Equipe",     icon:"users",   premium:true },
  { id:"config",     href:"/dashboard/settings", label:"Config",     icon:"settings" },
]

const PLAN_MENU: Record<string,string[]> = {
  trial:    ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
  basic:    ["dashboard","vendas","estoque","recibos","config"],
  pro:      ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
  business: ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
}
const PLAN_LABEL: Record<string,string> = { trial:"Trial", basic:"Basic", pro:"Pro", business:"Business" }

const ICON_PATHS: Record<string,React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  cart:      <><path d="M3 4h2l2.5 12h11l2-8H6"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></>,
  box:       <path d="M21 8v13H3V8M12 3v18M3 8l9-5 9 5"/>,
  receipt:   <path d="M6 2v20l3-2 3 2 3-2 3 2V2zM9 8h6M9 12h6M9 16h4"/>,
  cash:      <><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9v6M17 9v6"/></>,
  chart:     <><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></>,
  users:     <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="6" r="2.5"/><path d="M15 14c2.8 0 5 2.2 5 5"/></>,
  settings:  <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M5 5l2 2M17 17l2 2M2 12h3M19 12h3M5 19l2-2M17 7l2-2"/></>,
  logout:    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  menu:      <path d="M3 6h18M3 12h18M3 18h18"/>,
  chevron:   <path d="M9 18l6-6-6-6"/>,
  sun:       <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
  moon:      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
}

function Icon({ name, size=17 }: { name:string; size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {ICON_PATHS[name]}
    </svg>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user: authUser, logout: authLogout } = useAuthStore()
  const [store,      setStore]      = useState<any>(null)
  const [dark,       setDark]       = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!authUser) { router.push("/login"); return }

    // Restaurar tema salvo
    const saved = localStorage.getItem("vp-theme")
    if (saved === "dark") {
      setDark(true)
      document.documentElement.setAttribute("data-theme", "dark")
    }

    // Buscar dados da loja
    api.get("/stores")
      .then(r => {
        const s = Array.isArray(r.data) ? r.data[0] : r.data
        if (s) setStore(s)
      })
      .catch(() => {})
  }, [authUser])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light")
    localStorage.setItem("vp-theme", next ? "dark" : "light")
  }

  function logout() {
    authLogout()
    router.push("/login")
  }

  const plan        = store?.plan || authUser?.plan || "basic"
  const role        = authUser?.role || "store_owner"
  const storeName   = store?.name || "Minha Loja"
  const storeInit   = storeName.slice(0,2).toUpperCase()
  const color       = store?.primaryColor || "#1D9E75"
  const userName    = authUser?.name || "Usuario"
  const userInit    = userName.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()

  const allowed  = PLAN_MENU[plan] || PLAN_MENU.basic
  const navItems = NAV_ALL.filter(n => {
    if (role === "seller") return ["dashboard","vendas","recibos"].includes(n.id)
    return allowed.includes(n.id)
  })

  const active    = pathname === "/dashboard" ? "dashboard" : NAV_ALL.find(n => n.href !== "/dashboard" && pathname.startsWith(n.href))?.id || "dashboard"
  const pageLabel = NAV_ALL.find(n => n.id === active)?.label || "Dashboard"

  return (
    <>
      <style>{`
        /* ── Dark mode tokens ── */
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
          --shadow-sm:0 1px 2px rgba(0,0,0,0.3);
          --shadow:0 1px 3px rgba(0,0,0,0.4);
          --shadow-md:0 6px 16px rgba(0,0,0,0.45);
          --shadow-lg:0 16px 40px rgba(0,0,0,0.55);
        }

        /* ── App shell ── */
        html, body, #__next { height: 100%; }
        .vp-app { display:flex; height:100vh; overflow:hidden; background:var(--bg); color:var(--text); font-family:var(--font,"Geist",sans-serif); }

        /* ── Sidebar ── */
        .vp-sb {
          width:248px; flex-shrink:0;
          background:#04130F;
          border-right:1px solid #1F3A33;
          display:flex; flex-direction:column;
          height:100vh; position:sticky; top:0; z-index:30;
          color:#E5F2EC;
        }
        .vp-sb-head { padding:16px 14px 12px; border-bottom:1px solid #1F3A33; }
        .vp-store-card {
          display:flex; align-items:center; gap:10px;
          padding:9px 10px; border-radius:10px;
          background:#0E2620; border:1px solid #1F3A33;
        }
        .vp-store-badge {
          width:34px; height:34px; border-radius:9px;
          display:grid; place-items:center;
          color:white; font-weight:700; font-size:13px; flex-shrink:0;
          font-family:"Geist Mono",monospace;
        }
        .vp-store-meta { display:flex; flex-direction:column; min-width:0; flex:1; }
        .vp-store-meta strong { font-size:13.5px; font-weight:600; color:#F0F7F4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.01em; }
        .vp-store-meta small { font-size:11px; color:#7A9990; margin-top:2px; }

        .vp-nav { padding:10px 8px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:1px; scrollbar-width:none; }
        .vp-nav::-webkit-scrollbar { width:0; }
        .vp-nav-item {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:8px;
          font-size:13.5px; color:#8DA39A;
          cursor:pointer; text-decoration:none;
          transition:background 0.12s, color 0.12s;
        }
        .vp-nav-item:hover { background:#0E2620; color:#E5F2EC; }
        .vp-nav-item.active { background:rgba(29,158,117,0.18); color:#fff; font-weight:500; }

        .vp-sb-foot { padding:10px 12px; border-top:1px solid #1F3A33; display:flex; flex-direction:column; gap:4px; }
        .vp-theme-btn {
          display:flex; align-items:center; gap:10px;
          padding:7px 10px; border-radius:8px;
          font-size:13px; color:#8DA39A; cursor:pointer;
          transition:background 0.12s, color 0.12s;
        }
        .vp-theme-btn:hover { background:#0E2620; color:#E5F2EC; }
        .vp-user-pill {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:10px; cursor:pointer;
          transition:background 0.12s;
        }
        .vp-user-pill:hover { background:#0E2620; }
        .vp-avatar { width:30px; height:30px; border-radius:50%; display:grid; place-items:center; font-size:11px; font-weight:700; color:white; flex-shrink:0; }
        .vp-user-meta { display:flex; flex-direction:column; flex:1; min-width:0; }
        .vp-user-meta strong { font-size:13px; font-weight:500; color:#F0F7F4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .vp-user-meta small { font-size:11px; color:#7A9990; }

        /* ── Main ── */
        .vp-main { flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden; }

        /* ── Topbar ── */
        .vp-topbar {
          height:56px; padding:0 24px;
          border-bottom:1px solid var(--border);
          background:var(--bg-elevated);
          display:flex; align-items:center; gap:14px;
          flex-shrink:0; position:sticky; top:0; z-index:20;
          backdrop-filter:saturate(180%) blur(8px);
        }
        .vp-crumbs { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--text-subtle); }
        .vp-crumbs .cur { color:var(--text); font-weight:500; }

        /* Plan badges */
        .vp-plan { display:inline-flex; align-items:center; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:500; }
        .vp-plan-trial    { background:var(--info-bg);    color:var(--info); }
        .vp-plan-basic    { background:var(--surface-3);  color:var(--text-muted); }
        .vp-plan-pro      { background:var(--brand-tint); color:var(--brand-deep); }
        .vp-plan-business { background:linear-gradient(135deg,#04342C,#1D9E75); color:white; }

        /* ── Content ── */
        .vp-content { flex:1; overflow-y:auto; background:var(--bg); }

        /* ── Mobile ── */
        .vp-mob-btn { display:none; width:36px; height:36px; border-radius:8px; border:1px solid var(--border); color:var(--text-muted); align-items:center; justify-content:center; }
        .vp-overlay { display:none; }
        @media (max-width:900px) {
          .vp-sb { position:fixed; transform:translateX(-100%); transition:transform 0.2s; box-shadow:var(--shadow-lg); }
          .vp-sb.open { transform:translateX(0); }
          .vp-mob-btn { display:flex; }
          .vp-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:29; }
        }
      `}</style>

      <div className="vp-app">
        {mobileOpen && <div className="vp-overlay" onClick={()=>setMobileOpen(false)} />}

        {/* ── SIDEBAR ── */}
        <aside className={`vp-sb${mobileOpen?" open":""}`}>
          <div className="vp-sb-head">
            <div className="vp-store-card">
              <div className="vp-store-badge" style={{background:color}}>{storeInit}</div>
              <div className="vp-store-meta">
                <strong>{storeName}</strong>
                <small><span className={`vp-plan vp-plan-${plan}`}>{PLAN_LABEL[plan]||plan}</span></small>
              </div>
            </div>
          </div>

          <nav className="vp-nav">
            {navItems.map(n => (
              <Link key={n.id} href={n.href}
                className={`vp-nav-item${active===n.id?" active":""}`}
                onClick={()=>setMobileOpen(false)}>
                <Icon name={n.icon} size={17}/>
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>

          <div className="vp-sb-foot">
            <div className="vp-theme-btn" onClick={toggleDark}>
              <Icon name={dark?"sun":"moon"} size={16}/>
              <span>{dark?"Modo claro":"Modo escuro"}</span>
            </div>
            <div className="vp-user-pill" onClick={logout} title="Sair">
              <div className="vp-avatar" style={{background:color}}>{userInit}</div>
              <div className="vp-user-meta">
                <strong>{userName}</strong>
                <small>{role==="seller"?"Vendedor":role==="super_admin"?"Super Admin":"Proprietario"}</small>
              </div>
              <Icon name="logout" size={14}/>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="vp-main">
          <header className="vp-topbar">
            <button className="vp-mob-btn" onClick={()=>setMobileOpen(true)}>
              <Icon name="menu" size={18}/>
            </button>
            <div className="vp-crumbs">
              <span>{storeName}</span>
              <span style={{color:"var(--border-strong)",margin:"0 2px"}}>
                <Icon name="chevron" size={11}/>
              </span>
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
