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

  useEffect(() => {
    // Carrega config salva localmente primeiro (resposta imediata)
    const cached = localStorage.getItem("storeConfig")
    if (cached) {
      try {
        const c = JSON.parse(cached)
        if (c.primaryColor) setPrimary(c.primaryColor)
        if (c.name) { setStoreName(c.name); setInitials(c.name.slice(0, 2).toUpperCase()) }
      } catch {}
    }
    // Depois busca da API para garantir atualizado
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
    } catch {}
  }

  function handleLogout() { logout(); router.push("/login") }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f4f0" }}>
      <div style={{ width: "220px", background: darken(primary), display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* LOGO */}
        <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: "36px", height: "36px", background: primary, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
            {initials}
          </div>
          <span style={{ color: "white", fontWeight: 600, fontSize: "14px", lineHeight: 1.2 }}>{storeName}</span>
        </div>

        {/* MENU */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {MENU.map(item => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link key={item.href} href={item.href} style={{
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

        {/* USER */}
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