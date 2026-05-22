"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"

const NAV_ALL = [
  { id: "dashboard",  href: "/dashboard",            label: "Dashboard",   icon: IconDashboard },
  { id: "vendas",     href: "/dashboard/sales",       label: "Vendas",      icon: IconCart },
  { id: "estoque",    href: "/dashboard/stock",       label: "Estoque",     icon: IconBox },
  { id: "recibos",    href: "/dashboard/receipts",    label: "Recibos",     icon: IconReceipt },
  { id: "caixa",      href: "/dashboard/cash",        label: "Caixa",       icon: IconCash,    premium: true },
  { id: "relatorios", href: "/dashboard/reports",     label: "Relatorios",  icon: IconChart,   premium: true },
  { id: "equipe",     href: "/dashboard/team",        label: "Equipe",      icon: IconUsers,   premium: true },
  { id: "config",     href: "/dashboard/settings",    label: "Config",      icon: IconSettings },
]

const PLAN_MENU: Record<string, string[]> = {
  trial:    ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
  basic:    ["dashboard","vendas","estoque","recibos","config"],
  pro:      ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
  business: ["dashboard","vendas","estoque","recibos","caixa","relatorios","equipe","config"],
}

const PLAN_LABEL: Record<string, string> = { trial: "Trial", basic: "Basic", pro: "Pro", business: "Business" }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem("user")
    const s = localStorage.getItem("storeConfig") || localStorage.getItem("store")
    if (!u) { router.push("/login"); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    if (s) { try { setStore(JSON.parse(s)) } catch {} }
    else {
      api.get("/stores/me").then(r => {
        setStore(r.data)
        localStorage.setItem("storeConfig", JSON.stringify(r.data))
      }).catch(() => router.push("/login"))
    }
  }, [])

  function logout() {
    localStorage.clear()
    router.push("/login")
  }

  const plan = store?.plan || "basic"
  const role = user?.role || "store_owner"
  const allowed = PLAN_MENU[plan] || PLAN_MENU.basic
  const storeName = store?.name || "Minha Loja"
  const storeInitials = storeName.slice(0, 2).toUpperCase()
  const primaryColor = store?.primaryColor || "#1D9E75"
  const userName = user?.name || "Usuario"
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  const navItems = NAV_ALL.filter(n => {
    if (role === "seller") return ["dashboard","vendas","recibos"].includes(n.id)
    return allowed.includes(n.id)
  })

  function getActive() {
    if (pathname === "/dashboard") return "dashboard"
    const match = NAV_ALL.find(n => n.href !== "/dashboard" && pathname.startsWith(n.href))
    return match?.id || "dashboard"
  }
  const active = getActive()

  const pageLabel = NAV_ALL.find(n => n.id === active)?.label || "Dashboard"

  return (
    <>
      <style>{`
        .sidebar {
          width: 248px; flex-shrink: 0;
          background: var(--bg-elevated);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          height: 100vh; position: sticky; top: 0; z-index: 30;
        }
        .sidebar-head {
          padding: 16px 14px 12px;
          border-bottom: 1px solid var(--border);
        }
        .store-card {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 8px; border-radius: 10px;
          background: var(--surface-2); border: 1px solid var(--border);
        }
        .store-badge {
          width: 32px; height: 32px; border-radius: 8px;
          display: grid; place-items: center;
          color: white; font-weight: 600; font-size: 13px; flex-shrink: 0;
        }
        .store-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .store-meta strong { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .store-meta small { font-size: 11px; color: var(--text-subtle); }
        .nav { padding: 10px 8px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 8px;
          font-size: 13.5px; color: var(--text-muted);
          cursor: pointer; user-select: none; text-decoration: none;
          transition: background 0.1s, color 0.1s;
        }
        .nav-item:hover { background: var(--surface-2); color: var(--text); }
        .nav-item.active { background: var(--brand-tint); color: var(--brand-deep); font-weight: 500; }
        .nav-item .nav-icon { width: 17px; height: 17px; flex-shrink: 0; }
        .nav-item .badge { margin-left: auto; font-size: 10px; padding: 2px 7px; border-radius: 999px; background: var(--warning-bg); color: var(--warning); font-weight: 500; }
        .sidebar-foot { padding: 10px 12px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; }
        .user-pill {
          display: flex; align-items: center; gap: 10px; padding: 8px;
          border-radius: 10px; cursor: pointer;
          transition: background 0.1s;
        }
        .user-pill:hover { background: var(--surface-2); }
        .user-avatar { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 600; color: white; flex-shrink: 0; }
        .user-meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .user-meta strong { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-meta small { font-size: 11px; color: var(--text-subtle); }
        .topbar {
          height: 56px; padding: 0 24px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-elevated);
          display: flex; align-items: center; gap: 14px;
          position: sticky; top: 0; z-index: 20;
          backdrop-filter: saturate(180%) blur(8px);
        }
        .crumbs { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-subtle); }
        .crumbs .current { color: var(--text); font-weight: 500; }
        .plan-tag { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 500; }
        .plan-trial { background: var(--info-bg); color: var(--info); }
        .plan-basic { background: var(--surface-3); color: var(--text-muted); }
        .plan-pro { background: var(--brand-tint); color: var(--brand-deep); }
        .plan-business { background: linear-gradient(135deg,#04342C,#1D9E75); color: white; }
        @media (max-width: 900px) {
          .sidebar { position: fixed; transform: translateX(-100%); transition: transform 0.2s; box-shadow: var(--shadow-lg); }
          .sidebar.open { transform: translateX(0); }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* Overlay mobile */}
        {mobileOpen && (
          <div onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 29 }} />
        )}

        {/* SIDEBAR */}
        <aside className={`sidebar${mobileOpen ? " open" : ""}`}>
          <div className="sidebar-head">
            <div className="store-card">
              <div className="store-badge" style={{ background: primaryColor }}>
                {storeInitials}
              </div>
              <div className="store-meta">
                <strong>{storeName}</strong>
                <small>
                  <span className={`plan-tag plan-${plan}`}>{PLAN_LABEL[plan] || plan}</span>
                  {role === "seller" && <span style={{ marginLeft: 4 }}>Â· Vendedor</span>}
                </small>
              </div>
            </div>
          </div>

          <nav className="nav">
            {navItems.map(n => (
              <Link key={n.id} href={n.href}
                className={`nav-item${active === n.id ? " active" : ""}`}
                onClick={() => setMobileOpen(false)}>
                <n.icon className="nav-icon" />
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-foot">
            <div className="user-pill" onClick={logout} title="Sair">
              <div className="user-avatar" style={{ background: primaryColor }}>
                {userInitials}
              </div>
              <div className="user-meta">
                <strong>{userName}</strong>
                <small>{role === "seller" ? "Vendedor" : role === "super_admin" ? "Super Admin" : "ProprietÃ¡rio"}</small>
              </div>
              <IconLogout style={{ width: 15, height: 15, color: "var(--text-subtle)", flexShrink: 0 }} />
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* TOPBAR */}
          <header className="topbar">
            <button className="mobile-menu-btn"
              style={{ display: "none", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)", color: "var(--text-muted)" }}
              onClick={() => setMobileOpen(true)}>
              <IconMenu style={{ width: 18, height: 18 }} />
            </button>
            <div className="crumbs">
              <span>VendaPro</span>
              <span className="current" style={{ color: "var(--text-subtle)" }}>/</span>
              <span className="current">{pageLabel}</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`plan-tag plan-${plan}`}>{PLAN_LABEL[plan] || plan}</span>
            </div>
          </header>

          {/* CONTENT */}
          <main style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

// â”€â”€ Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function IconDashboard({ className }: any) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
}
function IconCart({ className }: any) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4h2l2.5 12h11l2-8H6"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/>
  </svg>
}
function IconBox({ className }: any) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8v13H3V8M12 3v18M3 8l9-5 9 5"/>
  </svg>
}
function IconReceipt({ className }: any) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2v20l3-2 3 2 3-2 3 2V2zM9 8h6M9 12h6M9 16h4"/>
  </svg>
}
function IconCash({ className }: any) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>
    <path d="M7 9v6M17 9v6"/>
  </svg>
}
function IconChart({ className }: any) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>
  </svg>
}
function IconUsers({ className }: any) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    <circle cx="17" cy="6" r="2.5"/><path d="M15 14c2.8 0 5 2.2 5 5"/>
  </svg>
}
function IconSettings({ className }: any) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M5 5l2 2M17 17l2 2M2 12h3M19 12h3M5 19l2-2M17 7l2-2"/>
  </svg>
}
function IconLogout({ style }: any) {
  return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
}
function IconMenu({ style }: any) {
  return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M3 12h18M3 18h18"/>
  </svg>
}

