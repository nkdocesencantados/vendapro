"use client"

export default function NotFound() {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",flexDirection:"column",gap:16,textAlign:"center",padding:24}}>
      <div style={{fontSize:64,fontWeight:700,color:"var(--brand)"}}>404</div>
      <h1 style={{fontSize:22,fontWeight:600,color:"var(--text)",margin:0}}>Página não encontrada</h1>
      <p style={{fontSize:14,color:"var(--text-muted)",maxWidth:320,margin:0}}>A página que você procura não existe ou foi movida.</p>
      <a href="/dashboard" style={{display:"inline-flex",alignItems:"center",gap:6,background:"var(--brand)",color:"white",padding:"10px 20px",borderRadius:10,fontWeight:500,fontSize:14,textDecoration:"none",marginTop:8}}>← Voltar ao Dashboard</a>
    </div>
  )
}
