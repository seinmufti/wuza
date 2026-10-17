// 12-hour clock. Hours past 24 wrap (night ranges run past midnight).
// `withMinutes` always shows :mm (e.g. 6:00am); otherwise whole hours drop it (6am).
export function formatClock(h: number, withMinutes = false) {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  const suffix = hh < 12 ? 'am' : 'pm'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return mm || withMinutes ? `${h12}:${String(mm).padStart(2, '0')}${suffix}` : `${h12}${suffix}`
}

// Durations as "4h", "1h 55m" or "45m" instead of raw decimals like 1.9166h.
export function formatHours(h: number) {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  if (!mm) return `${hh}h`
  return hh ? `${hh}h ${mm}m` : `${mm}m`
}
