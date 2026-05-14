"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt, fmtDate } from "@/lib/utils"

export default function ReceiptsPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState("")

  useEffect(() => { loadSales() }, [])

  async function loadSales() {
    try { const r = await api.get("/sales"); setSales(r.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function openReceipt(sale: any) {
    try { const r = await api.get(`/sales/${sale.id}`); setSelected(r.data) }
    catch { setSelected(sale) }
  }

  async function exportPdf() {
    if (!selected) return
    const jsPDF = (await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" as any)).default || (window as any).jspdf?.jsPDF
    const { jsPDF: JP } = await import("jspdf" as any).catch(() => ({ jsPDF: null }))
    const doc = new (JP || (window as any).jspdf.jsPDF)()
    doc.setFontSize(16); doc.setFont("helvetica","bold")
    doc.text("VendaPro", 105, 20, { align: "center" })
    doc.setFontSize(10); doc.setFont("helvetica","normal")
    doc.text("Comprovante de Venda", 105, 27, { align: "center" })
    doc.line(20, 32, 190, 32)
    let y = 40
    const row = (label: string, value: string) => { doc.setFont("helvetica","bold"); doc.text(label, 20, y); doc.setFont("helvetica","normal"); doc.text(value, 190, y, { align: "right" }); y += 7 }
    row("N. Pedido:", "#" + selected.id.slice(0,8).toUpperCase())
    row("Data:", fmtDate(selected.createdAt))
    row("Cliente:", selected.customerName || "Nao informado")
    row("Pagamento:", payLabel[selected.paymentMethod] || selected.paymentMethod)
    doc.line(20, y, 190, y); y += 7
    doc.setFont("helvetica","bold"); doc.text("Itens", 20, y); y += 7
    doc.setFont("helvetica","normal")
    ;(selected.items || []).forEach((item: any) => { doc.text(`${item.quantity}x ${item.productName || item.name}`, 20, y); doc.text(fmt(item.total), 190, y, { align: "right" }); y += 7 })
    doc.line(20, y, 190, y); y += 7
    doc.setFont("helvetica","bold"); doc.text("TOTAL", 20, y); doc.text(fmt(selected.total), 190, y, { align: "right" })
    y += 10; doc.setFont("helvetica","normal"); doc.setFontSize(9)
    doc.text("Obrigado pela preferencia!", 105, y, { align: "center" })
    doc.save(`recibo-${selected.id.slice(0,8).toUpperCase()}.pdf`)
  }

  function printReceipt() {
    const content = document.getElementById("receipt-content")
    if (!content) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<html><head><title>Recibo</title><style>body{font-family:Arial,sans-serif;max-width:400px;margin:20px auto;font-size:13px;}h2{text-align:center;font-size:16px;}.line{border-top:1px dashed #ccc;margin:8px 0;}.row{display:flex;justify-content:space-between;margin:4px 0;}.total{font-weight:bold;font-size:15px;}.center{text-align:center;}</style></head><body>${content.innerHTML}</body></html>`)
    win.document.close()
    win.print()
  }

  const filtered = sales.filter(s => !search || s.customerName?.toLowerCase().includes(search.toLowerCase()) || s.id?.includes(search)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const payLabel: any = { cash: "Dinheiro", pix: "PIX", credit_card: "Cartao Credito", debit_card: "Cartao Debito" }

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: "340px", borderRight: "0.5px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "0 16px", height: "50px", display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 500 }}>Recibos</div>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #e5e7eb" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente ou ID..." style={{ width: "100%", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <div style={{ padding: "20px", color: "#888", textAlign: "center" }}>Carregando...</div> :
            filtered.map(s => (
              <div key={s.id} onClick={() => openReceipt(s)} style={{ padding: "12px 16px", borderBottom: "0.5px solid #f3f4f6", cursor: "pointer", background: selected?.id === s.id ? "#f0faf6" : "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 500, fontSize: "13px" }}>{s.customerName || "Cliente nao informado"}</div>
                  <div style={{ fontWeight: 600, color: s.status === "cancelled" ? "#9ca3af" : "#1D9E75", fontSize: "13px", textDecoration: s.status === "cancelled" ? "line-through" : "none" }}>{fmt(s.total)}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>#{s.id.slice(0, 8).toUpperCase()} - {fmtDate(s.createdAt)}</div>
              </div>
            ))
          }
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#f5f4f0" }}>
        {!selected ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>Selecione uma venda para ver o recibo</div>
        ) : (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "16px" }}>
              <button onClick={exportPdf} style={{ padding: "8px 16px", background: "white", color: "#1D9E75", border: "1px solid #1D9E75", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Exportar PDF</button>
              <button onClick={printReceipt} style={{ padding: "8px 16px", background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Imprimir Recibo</button>
            </div>
            <div id="receipt-content" style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontWeight: 700, fontSize: "18px" }}>VendaPro</div>
                <div style={{ fontSize: "12px", color: "#888" }}>Comprovante de Venda</div>
              </div>
              <div style={{ borderTop: "1px dashed #e5e7eb", borderBottom: "1px dashed #e5e7eb", padding: "12px 0", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>N. Pedido</span>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>#{selected.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>Data</span>
                  <span style={{ fontSize: "12px" }}>{fmtDate(selected.createdAt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>Cliente</span>
                  <span style={{ fontSize: "12px" }}>{selected.customerName || "Nao informado"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>Pagamento</span>
                  <span style={{ fontSize: "12px" }}>{payLabel[selected.paymentMethod] || selected.paymentMethod}</span>
                </div>
              </div>
              {selected.items && selected.items.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "8px" }}>Itens</div>
                  {selected.items.map((item: any) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div>
                        <div style={{ fontSize: "12px" }}>{item.productName || item.name || "Item"}</div>
                        <div style={{ fontSize: "11px", color: "#888" }}>{item.quantity}x {fmt(item.unitPrice)}</div>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 500 }}>{fmt(item.total)}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: "12px" }}>
                {Number(selected.discount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#888" }}>Desconto</span>
                    <span style={{ fontSize: "12px", color: "#ef4444" }}>-{fmt(selected.discount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>TOTAL</span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#1D9E75" }}>{fmt(selected.total)}</span>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#aaa" }}>Obrigado pela preferencia!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}