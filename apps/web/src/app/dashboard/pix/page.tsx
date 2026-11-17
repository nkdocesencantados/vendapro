"use client"
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react"
import QRCode from "qrcode"
import toast, { Toaster } from "react-hot-toast"
import { Copy, Download, MessageCircle, Share2, QrCode, Save } from "lucide-react"
import { api } from "@/lib/api"
import { PIX_TYPES, pixKeyError, pixPayload, waLink } from "@/lib/pix"

const BRL = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
// aceita "1.234,56", "1234,56" ou "1234.56"
const parseAmount = (s: string) => { const t = s.trim(); const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t); return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0 }

export default function PixChargePage() {
  const [store, setStore] = useState<any>(null)
  const [keyType, setKeyType] = useState("cpf")
  const [key, setKey] = useState("")
  const [merchant, setMerchant] = useState("")
  const [city, setCity] = useState("")
  const [amount, setAmount] = useState("")
  const [desc, setDesc] = useState("")
  const [client, setClient] = useState("")
  const [phone, setPhone] = useState("")
  const [qr, setQr] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get("/stores").then(r => {
      const s = Array.isArray(r.data) ? r.data[0] : r.data
      setStore(s)
      if (s?.pixKey) { setKey(s.pixKey); setKeyType(s.pixKeyType || "cpf") }
      setMerchant(s?.pixMerchantName || s?.name || ""); setCity(s?.pixCity || "")
    }).catch(() => {})
  }, [])

  const keyErr = pixKeyError(keyType, key)
  const value = parseAmount(amount)
  const ready = !!key.trim() && !keyErr && !!merchant.trim() && !!city.trim()
  const code = useMemo(() => ready ? pixPayload({ key, keyType, name: merchant, city, amount: value || undefined }) : "", [ready, key, keyType, merchant, city, value])
  const dirty = !!store && (key !== (store.pixKey || "") || keyType !== (store.pixKeyType || "cpf") || merchant !== (store.pixMerchantName || store.name || "") || city !== (store.pixCity || ""))

  useEffect(() => {
    if (!code) { setQr(""); return }
    QRCode.toDataURL(code, { margin: 1, width: 480, color: { dark: "#06120B", light: "#FFFFFF" } }).then(setQr).catch(() => setQr(""))
  }, [code])

  const message = [
    `Olá${client.trim() ? " " + client.trim().split(" ")[0] : ""}!`,
    value ? `Segue a cobrança de ${BRL(value)}${desc.trim() ? ` referente a ${desc.trim()}` : ""}.` : `Segue meu PIX${desc.trim() ? ` referente a ${desc.trim()}` : ""}.`,
    "Use o PIX copia e cola abaixo (ou o QR Code que te enviei):",
    "", code, "", `— ${store?.name || merchant}`,
  ].join("\n")

  async function copy() { try { await navigator.clipboard.writeText(code); toast.success("Código PIX copiado") } catch { toast.error("Não foi possível copiar") } }

  function download() {
    const a = document.createElement("a"); a.href = qr; a.download = `pix-${value ? value.toFixed(2) : "livre"}.png`; a.click()
  }

  // No celular, compartilha a imagem do QR direto para o WhatsApp; no computador cai para o link do WhatsApp
  async function share() {
    try {
      const blob = await (await fetch(qr)).blob()
      const file = new File([blob], "pix.png", { type: "image/png" })
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: message }); return }
    } catch (e: any) { if (e?.name === "AbortError") return }
    window.open(waLink(phone, message), "_blank", "noopener")
  }

  async function saveKey() {
    if (!store?.id) return
    setSaving(true)
    try {
      await api.patch(`/stores/${store.id}`, { pixKey: key.trim(), pixKeyType: keyType, pixMerchantName: merchant.trim(), pixCity: city.trim() })
      setStore({ ...store, pixKey: key.trim(), pixKeyType: keyType, pixMerchantName: merchant.trim(), pixCity: city.trim() })
      toast.success("Chave PIX salva na loja")
    } catch (e: any) { toast.error(e?.response?.data?.message?.toString() || "Não foi possível salvar") } finally { setSaving(false) }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Toaster position="top-center" />
      <style dangerouslySetInnerHTML={{ __html: `
        .px-grid{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
        .px-form{flex:1 1 380px;min-width:0;display:flex;flex-direction:column;gap:16px}
        .px-prev{flex:1 1 340px;min-width:0;position:sticky;top:16px}
        .px-h{font-size:12.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px;font-weight:500}
        .px-qr{width:100%;max-width:280px;aspect-ratio:1;margin:0 auto;padding:14px;border-radius:20px;background:#fff;box-shadow:0 0 0 1px var(--brand-soft),0 0 40px color-mix(in srgb,var(--brand) 35%,transparent);display:grid;place-items:center}
        .px-qr img{width:100%;height:100%;image-rendering:pixelated}
        .px-empty{width:100%;max-width:280px;aspect-ratio:1;margin:0 auto;border-radius:20px;border:1px dashed var(--border-strong);display:grid;place-items:center;text-align:center;color:var(--text-muted);font-size:13px;padding:24px}
        .px-code{font-family:var(--font-mono);font-size:11.5px;line-height:1.5;word-break:break-all;color:var(--text-muted);background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;max-height:84px;overflow:auto}
        .px-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .px-err{font-size:12px;color:var(--danger)}
      ` }} />

      <header>
        <h1 className="vp-page-title" style={{ margin: 0 }}>Cobrar com PIX</h1>
        <div className="vp-page-sub">Gere um QR Code com o valor e envie para o cliente pagar na hora.</div>
      </header>

      <div className="px-grid">
        <div className="px-form">
          <section className="vp-card" style={{ padding: 20 }}>
            <h2 className="px-h">Cobrança</h2>
            <div className="vp-field-row">
              <div className="vp-field">
                <label htmlFor="px-amount">Valor (R$)</label>
                <input id="px-amount" className="vp-input vp-num" inputMode="decimal" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="vp-field">
                <label htmlFor="px-desc">Referente a (opcional)</label>
                <input id="px-desc" className="vp-input" placeholder="Ex.: pedido de bolos" value={desc} onChange={e => setDesc(e.target.value)} maxLength={80} />
              </div>
            </div>
            <div className="vp-field-row">
              <div className="vp-field">
                <label htmlFor="px-client">Cliente (opcional)</label>
                <input id="px-client" className="vp-input" placeholder="Nome" value={client} onChange={e => setClient(e.target.value)} />
              </div>
              <div className="vp-field" style={{ marginBottom: 0 }}>
                <label htmlFor="px-phone">WhatsApp do cliente</label>
                <input id="px-phone" className="vp-input" inputMode="tel" placeholder="(11) 9 0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            {!value && <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 10 }}>Sem valor, o cliente digita quanto vai pagar.</div>}
          </section>

          <section className="vp-card" style={{ padding: 20 }}>
            <h2 className="px-h">Sua chave PIX</h2>
            <div className="vp-field-row">
              <div className="vp-field">
                <label htmlFor="px-type">Tipo de chave</label>
                <select id="px-type" className="vp-select vp-input" value={keyType} onChange={e => setKeyType(e.target.value)}>
                  {PIX_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="vp-field">
                <label htmlFor="px-key">Chave</label>
                <input id="px-key" className="vp-input" value={key} onChange={e => setKey(e.target.value)} aria-invalid={!!keyErr} aria-describedby="px-key-err" />
                {keyErr && <span id="px-key-err" className="px-err">{keyErr}</span>}
              </div>
            </div>
            <div className="vp-field-row">
              <div className="vp-field">
                <label htmlFor="px-name">Nome do recebedor</label>
                <input id="px-name" className="vp-input" maxLength={25} value={merchant} onChange={e => setMerchant(e.target.value)} />
              </div>
              <div className="vp-field">
                <label htmlFor="px-city">Cidade</label>
                <input id="px-city" className="vp-input" maxLength={15} value={city} onChange={e => setCity(e.target.value)} />
              </div>
            </div>
            {dirty && ready && (
              <button type="button" className="vp-btn vp-btn-secondary vp-btn-sm" onClick={saveKey} disabled={saving}>
                <Save size={14} /> {saving ? "Salvando…" : "Salvar como chave da loja"}
              </button>
            )}
          </section>
        </div>

        <aside className="px-prev vp-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }} aria-label="QR Code da cobrança">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{client.trim() ? `Cobrança para ${client.trim()}` : "Total a pagar"}</div>
            <div className="vp-num" style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-1px" }}>{value ? BRL(value) : "Valor livre"}</div>
            {merchant.trim() && <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Recebedor: {merchant.trim()}</div>}
          </div>
          {qr ? (
            <div className="px-qr"><img src={qr} alt={`QR Code PIX ${value ? BRL(value) : ""}`} /></div>
          ) : (
            <div className="px-empty"><div><QrCode size={28} style={{ margin: "0 auto 8px", display: "block" }} />Preencha sua chave PIX, nome e cidade para gerar o QR Code.</div></div>
          )}
          {code && <div className="px-code" aria-label="Código PIX copia e cola">{code}</div>}
          <button type="button" className="vp-btn vp-btn-primary" disabled={!code} onClick={share}>
            <MessageCircle size={16} /> Enviar para o cliente
          </button>
          <div className="px-actions">
            <button type="button" className="vp-btn vp-btn-secondary" disabled={!code} onClick={copy}><Copy size={15} /> Copiar código</button>
            <button type="button" className="vp-btn vp-btn-secondary" disabled={!qr} onClick={download}><Download size={15} /> Baixar QR</button>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
            <Share2 size={13} /> No celular, o QR vai como imagem direto no WhatsApp.
          </div>
        </aside>
      </div>
    </div>
  )
}
