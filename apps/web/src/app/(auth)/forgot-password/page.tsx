"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post("/auth/forgot-password", { email }).catch(() => {});
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", fontFamily:"DM Sans, sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"400px", padding:"32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"40px" }}>
          <div style={{ width:"36px", height:"36px", background:"#1D9E75", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}>??</div>
          <span style={{ fontSize:"16px", fontWeight:500, color:"#04342C" }}>VendaPro</span>
        </div>

        {sent ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"48px", marginBottom:"16px" }}>??</div>
            <h2 style={{ fontSize:"22px", fontWeight:500, marginBottom:"8px" }}>Verifique seu e-mail</h2>
            <p style={{ color:"#888", fontSize:"14px", marginBottom:"24px" }}>Se o e-mail existir você recebera as instrucoes.</p>
            <a href="/login" style={{ color:"#0F6E56", fontSize:"14px" }}>? Voltar ao login</a>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize:"24px", fontWeight:500, marginBottom:"8px" }}>Recuperar senha</h2>
            <p style={{ color:"#888", fontSize:"14px", marginBottom:"32px" }}>Informe seu e-mail para receber o link.</p>
            <form onSubmit={onSubmit}>
              <div style={{ marginBottom:"16px" }}>
                <label style={{ fontSize:"13px", fontWeight:500, color:"#444", display:"block", marginBottom:"6px" }}>E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="seu@email.com"
                  style={{ width:"100%", padding:"12px 16px", borderRadius:"10px", border:"1px solid #e0e0e0", fontSize:"14px", background:"white", outline:"none" }} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"13px", borderRadius:"10px", background:"#0F6E56", color:"white", border:"none", fontSize:"14px", fontWeight:500, cursor:"pointer" }}>
                {loading ? "Enviando..." : "Enviar instrucoes"}
              </button>
            </form>
            <div style={{ textAlign:"center", marginTop:"20px" }}>
              <a href="/login" style={{ color:"#0F6E56", fontSize:"13px" }}>? Voltar ao login</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

