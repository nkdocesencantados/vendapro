"use client"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/contexts/auth.store"

const nav = [
  { label:"Dashboard", href:"/dashboard", section:"Principal" },
  { label:"Vendas", href:"/dashboard/sales", section:"Principal" },
  { label:"Estoque", href:"/dashboard/inventory", section:"Gestao" },
  { label:"Equipe", href:"/dashboard/team", section:"Gestao" },
  { label:"Caixa", href:"/dashboard/cash", section:"Financeiro" },
  { label:"Config", href:"/dashboard/settings", section:"Config" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, loadUser, logout } = useAuthStore()
  useEffect(() => { if (!isAuthenticated) loadUser() }, [])
  return (
    <div style={{display:"flex",height:"100vh"}}>
      <aside style={{width:"215px",background:"#04342C",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px",display:"flex",alignItems:"center",gap:"9px"}}>
          <div style={{width:"32px",height:"32px",background:"#1D9E75",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700}}>VP</div>
          <div style={{fontSize:"15px",fontWeight:500,color:"white"}}>VendaPro</div>
        </div>
        <nav style={{flex:1,padding:"8px"}}>
          {nav.map(item => { const active = pathname === item.href; return (<Link key={item.href} href={item.href} style={{display:"block",padding:"7px 9px",borderRadius:"7px",marginBottom:"2px",textDecoration:"none",background:active?"#1D9E75":"transparent",color:active?"white":"rgba(255,255,255,0.45)",fontSize:"13px"}}>{item.label}</Link>) })}
        </nav>
        <div style={{padding:"12px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",gap:"8px",alignItems:"center"}}>
          <div style={{width:"28px",height:"28px",background:"#1D9E75",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white"}}>{user?.name?.charAt(0)||"U"}</div>
          <div style={{flex:1,color:"white",fontSize:"12px"}}>{user?.name}</div>
          <button onClick={()=>{logout();router.push("/login")}}>sair</button>
        </div>
      </aside>
      <main style={{flex:1,overflow:"hidden",background:"#f5f4f0"}}>{children}</main>
    </div>
  )
}
