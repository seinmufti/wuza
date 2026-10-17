type ClockUnits = { am: string; pm: string }
type DurationUnits = { h: string; m: string }

const EN_CLOCK: ClockUnits = { am: 'am', pm: 'pm' }
const EN_DURATION: DurationUnits = { h: 'h', m: 'm' }

// 12-hour clock split into time and am/pm marker. Hours past 24 wrap (night ranges run past midnight).
// `withMinutes` always shows :mm (e.g. 6:00); otherwise whole hours drop it (6).
export function clockParts(h: number, units: ClockUnits = EN_CLOCK, withMinutes = false) {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  const time = mm || withMinutes ? `${h12}:${String(mm).padStart(2, '0')}` : `${h12}`
  return { time, suffix: hh < 12 ? units.am : units.pm }
}

export function formatClock(h: number, withMinutes = false, units: ClockUnits = EN_CLOCK) {
  const { time, suffix } = clockParts(h, units, withMinutes)
  return `${time}${suffix}`
}

// Durations as "4h", "1h 55m" or "45m" instead of raw decimals like 1.9166h.
export function formatHours(h: number, units: DurationUnits = EN_DURATION) {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  if (!mm) return `${hh}${units.h}`
  return hh ? `${hh}${units.h} ${mm}${units.m}` : `${mm}${units.m}`
}
