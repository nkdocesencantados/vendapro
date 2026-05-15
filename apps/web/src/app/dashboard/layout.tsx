"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/contexts/auth.store"
import { api } from "@/lib/api"

const MENU = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Vendas", href: "/dashboard/sales" },
  { label: "Estoque", href: "/dashboard/inventory" },
  { label: "Caixa", href: "/dashboard/cash" },
  { label: "Relatorios", href: "/dashboard/reports" },
  { label: "Recibos", href: "/dashboard/receipts" },
  { label: "Equipe", href: "/dashboard/team" },
  { label: "Config", href: "/dashboard/settings" },
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
  const { user, logout } = useAuthStore()
  const [primary, setPrimary] = useState("#1D9E75")
  const [storeName, setStoreName] = useState("VendaPro")
  const [initials, setInitials] = useState("VP")
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
        if (s.primaryColor) { setPrimary(s.primaryColor) }
        if (s.name) { setStoreName(s.name); setInitials(s.name.slice(0, 2).toUpperCase()) }
        localStorage.setItem("storeConfig", JSON.stringify({ name: s.name, primaryColor: s.primaryColor }))
      }
    } catch {
      // fallback para cache local se API falhar
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
  function handleNav() { if (isMobile) setMenuOpen(false) }

  const dark = darken(primary)

  const Sidebar = () => (
    <div style={{ width: "220px", background: dark, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
      <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: "36px", height: "36px", background: primary, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
          {initials}
        </div>
        <span style={{ color: "white", fontWeight: 600, fontSize: "14px", lineHeight: 1.2 }}>{storeName}</span>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
        {MENU.map(item => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href} onClick={handleNav} style={{
              display: "block", padding: "9px 12px", borderRadius: "8px", textDecoration: "none",
              background: active ? primary : "transparent",
              color: active ? "white" : "rgba(255,255,255,0.6)",
              fontSize: "13px", fontWeight: active ? 500 : 400,
              transition: "all 0.15s",
            }}>
              {item.label}
            </Link>
          )
        })}
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
  )

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f5f4f0" }}>
        {/* TOPBAR MOBILE */}
        <div style={{ background: dark, padding: "0 16px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", background: primary, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "13px" }}>
              {initials}
            </div>
            <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>{storeName}</span>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ width: "22px", height: "2px", background: "white", borderRadius: "2px", transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <div style={{ width: "22px", height: "2px", background: "white", borderRadius: "2px", transition: "all 0.2s", opacity: menuOpen ? 0 : 1 }} />
            <div style={{ width: "22px", height: "2px", background: "white", borderRadius: "2px", transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>

        {/* DRAWER MENU */}
        {menuOpen && (
          <div style={{ position: "fixed", top: "52px", left: 0, right: 0, bottom: 0, zIndex: 100 }}>
            <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "240px", background: dark, display: "flex", flexDirection: "column" }}>
              <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                {MENU.map(item => {
                  const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link key={item.href} href={item.href} onClick={handleNav} style={{
                      display: "block", padding: "12px 14px", borderRadius: "8px", textDecoration: "none",
                      background: active ? primary : "transparent",
                      color: active ? "white" : "rgba(255,255,255,0.7)",
                      fontSize: "14px", fontWeight: active ? 500 : 400,
                    }}>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{user?.name?.split(" ")[0]}</span>
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
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  )
}