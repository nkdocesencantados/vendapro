/* eslint-disable @next/next/no-img-element */
// Emblema Txai Tech + wordmark "VendaPro". Estilos em globals.css (.vp-logo*).
export function VendaProLogo({ size = 36, showText = true, showBy = true }: { size?: number; showText?: boolean; showBy?: boolean }) {
  return (
    <span className="vp-logo">
      <img src="/brand/haux-emblem.png" alt={showText ? "" : "VendaPro"} width={size} height={size} className="vp-logo-mark" style={{ width: size, height: size }} />
      {showText && (
        <span className="vp-logo-text">
          <span className="vp-logo-word" style={{ fontSize: Math.round(size * 0.47) }}>Venda<b>Pro</b></span>
          {showBy && <span className="vp-logo-by">by Txai Tech</span>}
        </span>
      )}
    </span>
  )
}

export default VendaProLogo
