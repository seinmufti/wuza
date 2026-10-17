import type { Language } from '@/lib/i18n'

// Inline SVG flags (emoji flags don't render on Windows, and Kurdistan has no emoji).
// Simplified for small sizes: 3:2 viewBox, 30x20.
export function Flag({ lang, className }: { lang: Language; className?: string }) {
  const common = { viewBox: '0 0 30 20', className, 'aria-hidden': true as const }

  if (lang === 'ar') {
    // Iraq: red / white / black with green "الله أكبر"
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#fff" />
        <rect width="30" height="6.67" fill="#ce1126" />
        <rect y="13.33" width="30" height="6.67" fill="#000" />
        <text
          x="15"
          y="11.6"
          textAnchor="middle"
          fontSize="4.2"
          fontWeight="700"
          fill="#007a3d"
          fontFamily="sans-serif"
        >
          الله أكبر
        </text>
      </svg>
    )
  }

  if (lang === 'ckb') {
    // Kurdistan: red / white / green with a golden 21-ray sun
    const rays = Array.from({ length: 21 }, (_, i) => {
      const a = (i / 21) * Math.PI * 2
      const [x1, y1] = [15 + Math.cos(a) * 1.9, 10 + Math.sin(a) * 1.9]
      const [x2, y2] = [15 + Math.cos(a) * 3.1, 10 + Math.sin(a) * 3.1]
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#febd11" strokeWidth="0.6" />
    })
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#fff" />
        <rect width="30" height="6.67" fill="#ed2024" />
        <rect y="13.33" width="30" height="6.67" fill="#278e43" />
        {rays}
        <circle cx="15" cy="10" r="2" fill="#febd11" />
      </svg>
    )
  }

  // United States: 13 stripes, blue canton with a few stars suggested by dots
  const stripes = Array.from({ length: 7 }, (_, i) => (
    <rect key={i} y={(i * 2 * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
  ))
  const stars = Array.from({ length: 12 }, (_, i) => (
    <circle key={i} cx={1.5 + (i % 4) * 2.9} cy={1.5 + Math.floor(i / 4) * 2.9} r="0.55" fill="#fff" />
  ))
  return (
    <svg {...common}>
      <rect width="30" height="20" fill="#fff" />
      {stripes}
      <rect width="12" height={(7 * 20) / 13} fill="#3c3b6e" />
      {stars}
    </svg>
  )
}
