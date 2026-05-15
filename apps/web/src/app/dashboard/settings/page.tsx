"use client" // v2
import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"

const PRESET_COLORS = [
  "#1D9E75","#3b82f6","#8b5cf6","#ec4899","#f97316",
  "#ef4444","#06b6d4","#eab308","#6366f1","#92400e",
]

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState("store")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState("")
  const [store, setStore] = useState({ name: "", primaryColor: "#1D9E75" })
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" })
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" })
  const colorRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadStore() }, [])

  async function loadStore() {
    try {
      const authRaw = localStorage.getItem("auth-storage")
      const auth = authRaw ? JSON.parse(authRaw) : null
      const sid = auth?.state?.user?.storeId || (user as any)?.storeId
      if (!sid) { setLoading(false); return }
      setStoreId(sid)
      const r = await api.get(`/stores/${sid}`)
      const s = r.data
      if (s) {
        setStore({ name: s?.name || "", primaryColor: s?.primaryColor || "#1D9E75" })
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function saveStore() {
    if (!storeId) return alert("ID da loja nao encontrado")
    try {
      await api.patch(`/stores/${storeId}`, { name: store.name, primaryColor: store.primaryColor })
      localStorage.removeItem("storeConfig")
      localStorage.setItem("storeConfig", JSON.stringify({ name: store.name, primaryColor: store.primaryColor }))
      setTimeout(() => { window.location.reload() }, 100)
    } catch (e: any) {
      console.error(e)
      alert("Erro ao salvar: " + (e?.response?.data?.message || e.message || "verifique o console"))
    }
  }

  async function saveProfile() {
    try {
      await api.patch("/users/profile", { name: profile.name })
      showSaved()
    } catch { alert("Erro ao salvar") }
  }

  async function changePassword() {
    if (!passwords.currentPassword || !passwords.newPassword) return alert("Preencha as senhas")
    try {
      await api.patch("/users/password", passwords)
      setPasswords({ currentPassword: "", newPassword: "" })
      alert("Senha alterada!")
    } catch { alert("Senha atual incorreta") }
  }

  function showSaved() { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  const primary = store.primaryColor || "#1D9E75"
  const inputStyle: any = { width: "100%", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }
  const tabStyle = (t: string) => ({ padding: "8px 16px", fontSize: "13px", border: "none", borderRadius: "8px", cursor: "pointer", background: tab === t ? primary : "transparent", color: tab === t ? "white" : "#666", fontWeight: tab === t ? 500 : 400 })

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "0 20px", height: "50px", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>Configuracoes</div>
      </div>

      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "0 20px", display: "flex", gap: "4px" }}>
        <button style={tabStyle("store")} onClick={() => setTab("store")}>Minha Loja</button>
        <button style={tabStyle("profile")} onClick={() => setTab("profile")}>Meu Perfil</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", maxWidth: "640px" }}>
        {saved && <div style={{ background: "#E1F5EE", color: "#0F6E56", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>Salvo com sucesso!</div>}

        {tab === "store" && !loading && (
          <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ fontWeight: 500, marginBottom: "16px", fontSize: "15px" }}>Identidade da Loja</h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "#666" }}>Nome da loja</label>
              <input value={store.name} onChange={e => setStore({ ...store, name: e.target.value })} placeholder="Ex: Boutique Ana" style={inputStyle} />
              <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>Aparece no topo do menu lateral</div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "10px" }}>Cor principal</label>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                {PRESET_COLORS.map(c => (
                  <div key={c} onClick={() => setStore({ ...store, primaryColor: c })} style={{ width: "34px", height: "34px", borderRadius: "8px", background: c, cursor: "pointer", border: store.primaryColor === c ? "3px solid #111" : "3px solid transparent", transition: "border 0.15s" }} />
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div onClick={() => colorRef.current?.click()} style={{ width: "34px", height: "34px", borderRadius: "8px", background: primary, cursor: "pointer", border: "2px solid #e5e7eb", flexShrink: 0 }} />
                <input ref={colorRef} type="color" value={primary} onChange={e => setStore({ ...store, primaryColor: e.target.value })} style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
                <div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Cor personalizada</div>
                  <div style={{ fontSize: "12px", color: primary, fontWeight: 600 }}>{primary}</div>
                </div>
                <button onClick={() => colorRef.current?.click()} style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "white", cursor: "pointer", fontSize: "12px", color: "#666" }}>Escolher cor</button>
              </div>
            </div>

            {/* PREVIEW */}
            <div style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Preview</div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ width: "36px", height: "36px", background: primary, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px" }}>
                  {store.name ? store.name.slice(0, 2).toUpperCase() : "VP"}
                </div>
                <span style={{ fontWeight: 600, fontSize: "15px" }}>{store.name || "VendaPro"}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button style={{ padding: "7px 14px", background: primary, color: "white", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "default" }}>Botao principal</button>
                <div style={{ padding: "7px 14px", border: `1.5px solid ${primary}`, color: primary, borderRadius: "8px", fontSize: "12px" }}>Secundario</div>
                
              </div>
            </div>

            <button onClick={saveStore} style={{ padding: "10px 24px", background: primary, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
              Salvar e Aplicar
            </button>
          </div>
        )}

        {tab === "profile" && (
          <>
            <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
              <h3 style={{ fontWeight: 500, marginBottom: "16px" }}>Meu Perfil</h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "#666" }}>Nome</label>
                <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "#666" }}>Email</label>
                <input value={profile.email} disabled style={{ ...inputStyle, background: "#f9f9f9", color: "#888" }} />
              </div>
              <button onClick={saveProfile} style={{ padding: "8px 16px", background: primary, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Salvar Perfil</button>
            </div>
            <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ fontWeight: 500, marginBottom: "16px" }}>Alterar Senha</h3>
              {[["Senha atual", "currentPassword"], ["Nova senha", "newPassword"]].map(([label, field]) => (
                <div key={field} style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", color: "#666" }}>{label}</label>
                  <input type="password" value={(passwords as any)[field]} onChange={e => setPasswords({ ...passwords, [field]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <button onClick={changePassword} style={{ padding: "8px 16px", background: "#04342C", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Alterar Senha</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}