"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/contexts/auth.store";
import { cn } from "@/lib/utils";

const nav = [
  { label:"Dashboard",     href:"/dashboard",            icon:"??", section:"Principal" },
  { label:"Vendas",        href:"/dashboard/sales",      icon:"??", section:"Principal" },
  { label:"Recibos",       href:"/dashboard/receipts",   icon:"??", section:"Principal" },
  { label:"Caixa",         href:"/dashboard/cash",       icon:"??", section:"Financeiro" },
  { label:"Relatorios",    href:"/dashboard/reports",    icon:"??", section:"Financeiro" },
  { label:"Estoque",       href:"/dashboard/inventory",  icon:"??", section:"Gestao" },
  { label:"Equipe",        href:"/dashboard/team",       icon:"??", section:"Gestao" },
  { label:"Comissoes",     href:"/dashboard/commissions",icon:"?", section:"Gestao" },
  { label:"Configuracoes", href:"/dashboard/settings",   icon:"??", section:"Config" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loadUser, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      loadUser().then(() => {
        if (!useAuthStore.getState().isAuthenticated) router.push("/login");
      });
    }
  }, []);

  const sections = [...new Set(nav.map(i => i.section))];

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"DM Sans, sans-serif" }}>
      <aside style={{ width:"215px", background:"#04342C", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"18px 16px 14px", borderBottom:"0.5px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:"9px" }}>
          <div style={{ width:"32px", height:"32px", background:"#1D9E75", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>??</div>
          <div>
            <div style={{ fontSize:"15px", fontWeight:500, color:"white" }}>VendaPro</div>
            <div style={{ fontSize:"9px", color:"#9FE1CB", opacity:0.4, fontFamily:"DM Mono, monospace", letterSpacing:"0.5px" }}>GESTAO SMART</div>
          </div>
        </div>

        <nav style={{ flex:1, overflowY:"auto", padding:"8px" }}>
          {sections.map(section => (
            <div key={section}>
              <div style={{ fontSize:"9px", color:"rgba(159,225,203,0.3)", letterSpacing:"1.2px", textTransform:"uppercase", padding:"10px 8px 5px" }}>{section}</div>
              {nav.filter(i => i.section === section).map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 9px", borderRadius:"7px", marginBottom:"1px", textDecoration:"none", background: active ? "#1D9E75" : "transparent", color: active ? "white" : "rgba(255,255,255,0.45)", fontSize:"12.5px", fontWeight: active ? 500 : 400 }}>
                    <span>{item.icon}</span>{item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding:"11px 13px", borderTop:"0.5px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ width:"28px", height:"28px", background:"#1D9E75", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:500, color:"white", flexShrink:0 }}>
            {user?.name?.charAt(0) || "U"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:"11px", fontWeight:500, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</div>
            <div style={{ fontSize:"10px", color:"#9FE1CB", opacity:0.6 }}>{user?.role}</div>
          </div>
          <button onClick={() => { logout(); router.push("/login"); }}
            style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3
@'
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { useAuthStore } from "@/contexts/auth.store";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/reports/dashboard").then(r => setData(r.data)).catch(() => {
      setData({
        todaySales:3840, monthSales:15600, profit:4100, avgTicket:128,
        totalSalesToday:30, monthGoal:20000, monthGoalPct:78,
        lowStock:[{name:"Tenis Chunky",stock:3,minStock:8},{name:"Oculos Gatinho",stock:4,minStock:8}],
        weeklyChart:[{day:"Seg",value:2100},{day:"Ter",value:1800},{day:"Qua",value:2500},{day:"Qui",value:3100},{day:"Sex",value:2900},{day:"Sab",value:4200},{day:"Dom",value:3840}],
      });
    });
  }, []);

  const metrics = [
    { label:"Vendas hoje",    value: fmt(data?.todaySales||0),  change:"+12%", up:true  },
    { label:"Mes atual",      value: fmt(data?.monthSales||0),  change:"+8%",  up:true  },
    { label:"Lucro estimado", value: fmt(data?.profit||0),      change:"26%",  up:true  },
    { label:"Ticket medio",   value: fmt(data?.avgTicket||0),   change:"-3%",  up:false },
  ];

  if (!data) return <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#888" }}>Carregando...</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:"white", borderBottom:"0.5px solid #e5e7eb", padding:"0 20px", height:"50px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ fontSize:"14px", fontWeight:500, color:"#111" }}>Dashboard</div>
          <div style={{ fontSize:"10px", color:"#888" }}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
        <span style={{ fontSize:"12px", color:"#666" }}>Ola, {user?.name?.split(" ")[0]} ??</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"18px 20px" }}>
        {data.lowStock?.length > 0 && (
          <div style={{ background:"#FAEEDA", border:"1px solid #E8C97B", borderRadius:"10px", padding:"10px 14px", marginBottom:"14px", fontSize:"13px", color:"#633806" }}>
            ?? <strong>{data.lowStock.length} produtos</strong> com estoque abaixo do minimo
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"14px" }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background:"white", border:"0.5px solid #e5e7eb", borderRadius:"12px", padding:"14px 16px" }}>
              <div style={{ fontSize:"11px", color:"#888", marginBottom:"6px" }}>{m.label}</div>
              <div style={{ fontSize:"21px", fontWeight:500, color:"#111", fontFamily:"DM Mono, monospace" }}>{m.value}</div>
              <div style={{ fontSize:"10px", marginTop:"4px", color: m.up ? "#1D9E75" : "#D85A30" }}>{m.change}</div>
            </div>
          ))}
        </div>

        <div style={{ background:"white", border:"0.5px solid #e5e7eb", borderRadius:"12px", padding:"16px", marginBottom:"14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"8px" }}>
            <span style={{ fontWeight:500 }}>Meta mensal</span>
            <span style={{ color:"#1D9E75", fontWeight:500 }}>{data.monthGoalPct}% — {fmt(data.monthSales)} de {fmt(data.monthGoal)}</span>
          </div>
          <div style={{ height:"8px", background:"#E1F5EE", borderRadius:"4px" }}>
            <div style={{ height:"100%", background:"#1D9E75", borderRadius:"4px", width:`${data.monthGoalPct}%` }} />
          </div>
        </div>

        <div style={{ background:"white", border:"0.5px solid #e5e7eb", borderRadius:"12px", padding:"16px", marginBottom:"14px" }}>
          <div style={{ fontSize:"12.5px", fontWeight:500, marginBottom:"12px" }}>Faturamento — ultimos 7 dias</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:"120px" }}>
            {data.weeklyChart?.map((d: any) => {
              const max = Math.max(...data.weeklyChart.map((x: any) => x.value));
              const pct = max ? (d.value / max) * 100 : 0;
              return (
                <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                  <div style={{ flex:1, display:"flex", alignItems:"flex-end", width:"100%" }}>
                    <div style={{ width:"100%", background:"#1D9E75", borderRadius:"4px 4px 0 0", height:`${pct}%`, minHeight:"4px" }} />
                  </div>
                  <div style={{ fontSize:"10px", color:"#888" }}>{d.day}</div>
                </div>
              );
            })}
          </div>
        </div>

        {data.lowStock?.length > 0 && (
          <div style={{ background:"white", border:"0.5px solid #e5e7eb", borderRadius:"12px", padding:"16px" }}>
            <div style={{ fontSize:"12.5px", fontWeight:500, marginBottom:"10px" }}>?? Estoque baixo</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {data.lowStock.map((p: any) => (
                <div key={p.name} style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px", background:"#FAEEDA", borderRadius:"8px", fontSize:"12px" }}>
                  <span style={{ color:"#633806", fontWeight:500 }}>{p.name}</span>
                  <span style={{ color:"#D85A30", fontWeight:500 }}>{p.stock} un restantes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
