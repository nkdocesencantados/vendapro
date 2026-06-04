"use client";

export default function ForgotPasswordPage() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0A0F0D", fontFamily:"DM Sans, sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"400px", padding:"32px", textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", marginBottom:"40px" }}>
          <div style={{ width:"36px", height:"36px", background:"#1D9E75", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>V</div>
          <span style={{ fontSize:"16px", fontWeight:500, color:"#fff" }}>VendaPro</span>
        </div>
        <div style={{ fontSize:"48px", marginBottom:"16px" }}>🔐</div>
        <h2 style={{ fontSize:"22px", fontWeight:600, marginBottom:"10px", color:"#fff" }}>Esqueceu sua senha?</h2>
        <p style={{ color:"#888", fontSize:"14px", marginBottom:"28px", lineHeight:1.6 }}>
          Para redefinir sua senha entre em contato com o suporte pelo WhatsApp. Responderemos o mais rápido possível.
        </p>
        <a
          href="https://wa.me/5511958924764?text=Ol%C3%A1%2C+esqueci+minha+senha+do+VendaPro+e+preciso+de+ajuda"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"#25D366", color:"white", padding:"13px 28px", borderRadius:"12px", fontWeight:600, fontSize:"14px", textDecoration:"none", marginBottom:"20px" }}>
          💬 Falar com suporte
        </a>
        <div style={{ marginTop:"8px" }}>
          <a href="/login" style={{ color:"#1D9E75", fontSize:"13px" }}>← Voltar ao login</a>
        </div>
      </div>
    </div>
  );
}
