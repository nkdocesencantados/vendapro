"use client";
import { VendaProLogo } from "@/components/logo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/contexts/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Credenciais invalidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"DM Sans, sans-serif" }}>
      <style>{`
        .login-left { display: none; }
        .login-logo-mobile { display: flex; }
        @media (min-width: 768px) {
          .login-left { display: flex !important; width: 50%; }
          .login-logo-mobile { display: none !important; }
          .login-right { padding: 48px !important; }
        }
      `}</style>

      <div className="login-left" style={{ background:"#04342C", flexDirection:"column", justifyContent:"space-between", padding:"64px", color:"white" }}>
        <VendaProLogo size={72} />
        <div>
          <h1 style={{ fontSize:"48px", fontWeight:500, lineHeight:1.2, marginBottom:"24px" }}>Gestao inteligente para o seu negocio.</h1>
          <p style={{ color:"#9FE1CB", fontSize:"18px", opacity:0.8 }}>Controle vendas, estoque, equipe e financeiro em um so lugar.</p>
        </div>
        <p style={{ color:"#9FE1CB", opacity:0.4, fontSize:"13px" }}>&copy; 2026 VendaPro</p>
      </div>

      <div className="login-right" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f4f0", padding:"24px" }}>
        <div style={{ width:"100%", maxWidth:"400px" }}>
          <div className="login-logo-mobile" style={{ alignItems:"center", gap:"10px", marginBottom:"32px", justifyContent:"center" }}>
            <VendaProLogo size={36} darkColor="#1D9E75" />
            <span style={{ fontSize:"18px", fontWeight:600, color:"#111" }}>VendaPro</span>
          </div>

          <h2 style={{ fontSize:"24px", fontWeight:500, marginBottom:"8px", color:"#111" }}>Entrar na sua conta</h2>
          <p style={{ color:"#888", fontSize:"14px", marginBottom:"28px" }}>Informe suas credenciais para continuar.</p>

          {error && (
            <div style={{ background:"#FCEBEB", border:"1px solid #F09595", borderRadius:"8px", padding:"10px 14px", marginBottom:"16px", color:"#A32D2D", fontSize:"13px" }}>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom:"16px" }}>
              <label style={{ fontSize:"13px", fontWeight:500, color:"#444", display:"block", marginBottom:"6px" }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="seu@email.com"
                style={{ width:"100%", padding:"12px 16px", borderRadius:"10px", border:"1px solid #e0e0e0", fontSize:"14px", background:"white", outline:"none", boxSizing:"border-box" }} />
            </div>

            <div style={{ marginBottom:"8px" }}>
              <label style={{ fontSize:"13px", fontWeight:500, color:"#444", display:"block", marginBottom:"6px" }}>Senha</label>
              <div style={{ position:"relative" }}>
                <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width:"100%", padding:"12px 16px", paddingRight:"44px", borderRadius:"10px", border:"1px solid #e0e0e0", fontSize:"14px", background:"white", outline:"none", boxSizing:"border-box" }} />
                <button type="button" onClick={() => setShow(!show)}
                  style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#888", fontSize:"13px" }}>
                  {show ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            <div style={{ textAlign:"right", marginBottom:"24px" }}>
              <a href="https://wa.me/5511958924764?text=Ola,%20esqueci%20minha%20senha%20do%20VendaPro" style={{ fontSize:"13px", color:"#0F6E56", textDecoration:"none" }}>Esqueceu a senha? Fale com o suporte</a>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"13px", borderRadius:"10px", background:"#0F6E56", color:"white", border:"none", fontSize:"14px", fontWeight:500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p style={{ textAlign:"center", fontSize:"12px", color:"#aaa", marginTop:"28px" }}>
            Problemas? <a href="https://wa.me/5511958924764?text=Ola,%20preciso%20de%20suporte%20no%20VendaPro" style={{ color:"#0F6E56" }}>Fale com o suporte</a>
          </p>
        </div>
      </div>
    </div>
  );
}






