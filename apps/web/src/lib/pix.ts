// PIX "copia e cola" estático (BR Code / EMV MPM, manual do Banco Central).
export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random"
export type PixStore = { pixKey?: string | null; pixKeyType?: string | null; pixMerchantName?: string | null; pixCity?: string | null; name?: string | null }

export const PIX_TYPES: [PixKeyType, string][] = [["cpf","CPF"],["cnpj","CNPJ"],["email","E-mail"],["phone","Telefone"],["random","Chave aleatória"]]

/** Mensagem de erro da chave, ou null se vazia/válida. */
export function pixKeyError(type: string, key: string): string | null {
  const d = key.replace(/\D/g, "")
  if (!key.trim()) return null
  if (type==="cpf" && d.length!==11) return "CPF deve ter 11 dígitos"
  if (type==="cnpj" && d.length!==14) return "CNPJ deve ter 14 dígitos"
  if (type==="email" && !/^\S+@\S+\.\S+$/.test(key.trim())) return "E-mail inválido"
  if (type==="phone" && (d.length<10 || d.length>13)) return "Telefone com DDD inválido"
  if (type==="random" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key.trim())) return "Chave aleatória inválida"
  return null
}

export function crc16(s: string): string {
  let crc = 0xffff
  for (const ch of new TextEncoder().encode(s)) {
    crc ^= ch << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

const f = (id: string, v: string) => id + String(v.length).padStart(2, "0") + v
const clean = (s: string, max: number) =>
  s.normalize("NFD").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase().slice(0, max).trim() // NFD separa os acentos; o filtro remove-os

export function normalizeKey(key: string, type?: string | null): string {
  const k = key.trim()
  if (type === "cpf" || type === "cnpj") return k.replace(/\D/g, "")
  if (type === "email") return k.toLowerCase()
  if (type === "phone") { const d = k.replace(/\D/g, ""); return "+" + (d.length <= 11 ? "55" + d : d) }
  return k
}

export function pixPayload(o: { key: string; keyType?: string | null; name: string; city: string; amount?: number; txid?: string }): string {
  const p =
    f("00", "01") +
    f("26", f("00", "br.gov.bcb.pix") + f("01", normalizeKey(o.key, o.keyType))) +
    f("52", "0000") + f("53", "986") +
    (o.amount && o.amount > 0 ? f("54", o.amount.toFixed(2)) : "") +
    f("58", "BR") + f("59", clean(o.name, 25) || "RECEBEDOR") + f("60", clean(o.city, 15) || "BRASIL") +
    f("62", f("05", o.txid || "***")) + "6304"
  return p + crc16(p)
}

/** Payload da loja ou null se ela não tem chave PIX configurada. */
export function storePix(store: PixStore | null | undefined, amount?: number): string | null {
  if (!store?.pixKey) return null
  return pixPayload({ key: store.pixKey, keyType: store.pixKeyType, name: store.pixMerchantName || store.name || "", city: store.pixCity || "", amount })
}

export const waLink = (phone: string | null | undefined, text: string) => {
  const d = (phone || "").replace(/\D/g, "")
  return d ? `https://wa.me/${d.startsWith("55") && d.length > 11 ? d : "55" + d}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
}

// Autoteste: npx tsx -e "import('./apps/web/src/lib/pix.ts').then(m=>m.pixSelfTest())"
export function pixSelfTest() {
  console.assert(crc16("123456789") === "29B1", "CRC 123456789")
  const ex = "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304"
  console.assert(crc16(ex) === "1D3D", "CRC exemplo BCB")
  const p = pixPayload({ key: "(11) 98765-4321", keyType: "phone", name: "Loja da Ána Ltda. com nome bem comprido", city: "São Paulo", amount: 189.9 })
  console.assert(p.includes("0114+5511987654321") && p.includes("5406189.90") && p.includes("5925LOJA DA ANA LTDA COM NOME") && p.includes("6009SAO PAULO"), "campos")
  console.assert(crc16(p.slice(0, -4)) === p.slice(-4), "CRC final")
  console.log("pix ok", crc16("123456789"), p)
}
