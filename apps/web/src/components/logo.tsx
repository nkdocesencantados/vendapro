export function VendaProLogo({ size = 36, showText = true, textColor = "white", accentColor = "#1D9E75", darkColor = "#04342C" }: { size?: number, showText?: boolean, textColor?: string, accentColor?: string, darkColor?: string }) {
  const s = size
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
      <svg width={s} height={s} viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="10" fill={darkColor}/>
        <circle cx="14" cy="16" r="5" fill={accentColor}/>
        <circle cx="30" cy="16" r="5" fill="#5DCAA5"/>
        <circle cx="22" cy="30" r="5" fill="white"/>
        <line x1="14" y1="16" x2="30" y2="16" stroke={accentColor} strokeWidth="1.5"/>
        <line x1="14" y1="16" x2="22" y2="30" stroke="#5DCAA5" strokeWidth="1.5"/>
        <line x1="30" y1="16" x2="22" y2="30" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
      </svg>
      {showText && (
        <div>
          <div style={{ fontSize: size * 0.44 + "px", fontWeight: 700, color: textColor, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
            <span>Venda</span><span style={{ color: accentColor }}>Pro</span>
          </div>
        </div>
      )}
    </div>
  )
}