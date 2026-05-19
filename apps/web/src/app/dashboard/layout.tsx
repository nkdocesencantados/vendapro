"use client"
import { VendaProLogo } from "@/components/logo"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/contexts/auth.store"
import { api } from "@/lib/api"

const MENU_ALL = [
  { label: "📊 Dashboard", href: "/dashboard", roles: ["store_owner","seller"], plans: ["basic","starter","pro","business"] },
  { label: "🛒 Vendas", href: "/dashboard/sales", roles: ["store_owner","seller"], plans: ["basic","starter","pro","business"] },
  { label: "📦 Estoque", href: "/dashboard/inventory", roles: ["store_owner"], plans: ["basic","starter","pro","business"] },
  { label: "🧾 Recibos", href: "/dashboard/receipts", roles: ["store_owner","seller"], plans: ["basic","starter","pro","business"] },
  { label: "💰 Caixa", href: "/dashboard/cash", roles: ["store_owner"], plans: ["starter","pro","business"] },
  { label: "📈 Relatorios", href: "/dashboard/reports", roles: ["store_owner"], plans: ["starter","pro","business"] },
  { label: "👥 Equipe", href: "/dashboard/team", roles: ["store_owner"], plans: ["starter","pro","business"] },
  { label: "⚙️ Config", href: "/dashboard/settings", roles: ["store_owner"], plans: ["basic","starter","pro","business"] },
]

function darken(hex: string, amount = 0.5): string {
  const num = parseInt(hex.replace("#",""), 16)
  const r = Math.floor((num >> 16) * amount)
  const g = Math.floor(((num >> 8) & 0xff) * amount)
  const b = Math.floor((num & 0xff) * amount)
  return "#" + [r,g,b].map(v => v.toString(16).padStart(2,"0")).join("")
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, loadUser, isAuthenticated } = useAuthStore()
  const [primary, setPrimary] = useState("#1D9E75")
  const [storeName, setStoreName] = useState("VendaPro")
  const [initials, setInitials] = useState("VP")
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const role = (user as any)?.role || "store_owner"
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    if (!user && !isAuthenticated) {
      loadUser().then(() => {
        const s = useAuthStore.getState()
        if (!s.isAuthenticated) {
          router.push("/login")
        } else if ((s.user as any)?.role === "super_admin") {
          router.push("/superadmin")
        }
      })
    } else if (isAuthenticated && (user as any)?.role === "super_admin") {
      router.push("/superadmin")
    }
  }, [hydrated])
  const plan = (user as any)?.plan || "basic"
  const MENU = MENU_ALL.filter(item => item.roles.includes(role) && item.plans.includes(plan))

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const cached = localStorage.getItem("storeConfig")
    if (cached) {
      try {
        const c = JSON.parse(cached)
        if (c.primaryColor) setPrimary(c.primaryColor)
        if (c.name) { setStoreName(c.name); setInitials(c.name.slice(0, 2).toUpperCase()) }
      } catch {}
    }
    loadStore()
  }, [])

  async function loadStore() {
    try {
      const r = await api.get("/stores")
      const s = Array.isArray(r.data) ? r.data[0] : r.data
      if (s) {
        if (s.primaryColor) setPrimary(s.primaryColor)
        if (s.name) { setStoreName(s.name); setInitials(s.name.slice(0, 2).toUpperCase()) }
        localStorage.setItem("storeConfig", JSON.stringify({ name: s.name, primaryColor: s.primaryColor }))
      }
    } catch {
      const cached = localStorage.getItem("storeConfig")
      if (cached) {
        try {
          const c = JSON.parse(cached)
          if (c.primaryColor) setPrimary(c.primaryColor)
          if (c.name) { setStoreName(c.name); setInitials(c.name.slice(0, 2).toUpperCase()) }
        } catch {}
      }
    }
  }

  function handleLogout() { logout(); router.push("/login") }

  const dark = darken(primary)

  const menuItems = MENU.map(item => {
    const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(item.href + "/")
    return { ...item, active }
  })

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f5f4f0" }}>
        <div style={{ background: dark, padding: "0 16px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 50, position: "relative" }}>
          <VendaProLogo size={32} />
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ width: "22px", height: "2px", background: "white", borderRadius: "2px" }} />
            <div style={{ width: "22px", height: "2px", background: "white", borderRadius: "2px" }} />
            <div style={{ width: "22px", height: "2px", background: "white", borderRadius: "2px" }} />
          </button>
        </div>

        {menuOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
            <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "260px", background: dark, display: "flex", flexDirection: "column", zIndex: 201 }}>
              <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <VendaProLogo size={32} />
                </div>
                <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "20px", padding: "4px" }}>×</button>
              </div>
              <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
                {menuItems.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
                    display: "block", padding: "12px 14px", borderRadius: "8px", textDecoration: "none", marginBottom: "2px",
                    background: item.active ? primary : "transparent",
                    color: item.active ? "white" : "rgba(255,255,255,0.7)",
                    fontSize: "14px", fontWeight: item.active ? 500 : 400,
                  }}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", background: primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 700 }}>
                    {user?.name?.slice(0, 1).toUpperCase()}
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{user?.name?.split(" ")[0]}</span>
                </div>
                <button onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px" }}>sair</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f4f0" }}>
      <div style={{ width: "220px", background: dark, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: "36px", height: "36px", background: primary, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>{initials}</div>
          <span style={{ color: "white", fontWeight: 600, fontSize: "15px", letterSpacing: "-0.3px" }}>{storeName}</span>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          {menuItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "block", padding: "9px 12px", borderRadius: "8px", textDecoration: "none",
              background: item.active ? primary : "transparent",
              color: item.active ? "white" : "rgba(255,255,255,0.6)",
              fontSize: "13px", fontWeight: item.active ? 500 : 400,
              transition: "all 0.15s",
            }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", background: primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 700 }}>
              {user?.name?.slice(0, 1).toUpperCase()}
            </div>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>{user?.name?.split(" ")[0]}</span>
          </div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "12px" }}>sair</button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  )
}



