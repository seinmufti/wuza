import type { ApplianceIcon } from '@/lib/presets'

// One usage window in clock hours. `to` may pass 24 when it runs past midnight (26 = 2am next day).
export interface Appliance {
  id: string
  name: string
  watts: number
  qty: number
  /** Which icon the card shows (from the preset it was created from). Missing on older saves. */
  icon?: ApplianceIcon
  /** Start-up power as a multiple of running watts (1 = none, fridges/ACs ~3-5). */
  surge: number
  from: number
  to: number
}

const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))

// Splits the usage window into daylight and night hours using today's and tomorrow's daylight.
export function applianceHours(a: Appliance, s: Pick<Settings, 'sunrise' | 'sunset'>) {
  const total = Math.max(0, a.to - a.from)
  const day = overlap(a.from, a.to, s.sunrise, s.sunset) + overlap(a.from, a.to, s.sunrise + 24, s.sunset + 24)
  return { total, day, night: total - day }
}

// How long something is running, split into daylight and night. Overlapping appliances
// count once. Sampled in 5-minute slots over one day.
export function usageHours(appliances: Appliance[], s: Pick<Settings, 'sunrise' | 'sunset'>) {
  const slot = 1 / 12
  const hours = { day: 0, night: 0 }
  for (let t = 0; t < 24; t += slot) {
    const mid = t + slot / 2
    const running = appliances.some(
      (a) => a.watts > 0 && ((mid >= a.from && mid < a.to) || (mid + 24 >= a.from && mid + 24 < a.to)),
    )
    if (running) hours[mid >= s.sunrise && mid < s.sunset ? 'day' : 'night'] += slot
  }
  return hours
}

export type LegacyAppliance = Partial<Appliance> & {
  id: string
  name: string
  watts: number
  qty: number
  hoursDay?: number
  hoursNight?: number
  dayFrom?: number
  dayTo?: number
  nightFrom?: number
  nightTo?: number
}

// Older saves used separate day/night hours or ranges; fold them into one window.
export function migrateAppliance(a: LegacyAppliance): Appliance {
  const { hoursDay, hoursNight, dayFrom, dayTo, nightFrom, nightTo, ...rest } = a
  const surge = a.surge ?? 1
  if (a.from != null && a.to != null) return { ...rest, surge, from: a.from, to: a.to }
  let d0 = dayFrom ?? 8
  let d1 = dayTo ?? 8 + (hoursDay ?? 0)
  const n0 = nightFrom ?? 18
  const n1 = nightTo ?? 18 + (hoursNight ?? 0)
  if (d1 <= d0) [d0, d1] = [n0, n1]
  else if (n1 > n0 && n0 <= d1) d1 = Math.max(d1, n1)
  else if (n1 - n0 > d1 - d0) [d0, d1] = [n0, n1]
  return { ...rest, surge, from: d0, to: d1 }
}

export interface Place {
  name: string
  lat: number
  lon: number
  psh: number
  // The place's own sun times, so manual slider changes can be undone. Missing on older saves.
  sunrise?: number
  sunset?: number
}

export interface Settings {
  sunrise: number
  sunset: number
  location: Place | null
  panelWatts: number
  /** Size of one panel in metres, for the roof area. */
  panelLength: number
  panelWidth: number
  dod: number
  batteryEff: number
  inverterEff: number
  derate: number
  safetyMargin: number
}

export const DEFAULT_SETTINGS: Settings = {
  sunrise: 6,
  sunset: 18,
  location: null,
  panelWatts: 640,
  panelLength: 2.382,
  panelWidth: 1.134,
  dod: 0.9,
  batteryEff: 0.95,
  inverterEff: 0.92,
  derate: 0.75,
  safetyMargin: 1.25,
}

// Share of the daylight window that counts as full sun. Sunlight is weak near sunrise/sunset,
// so ~0.42 in general (12h -> ~5h). With a location, use that area's own share: its measured
// peak sun hours divided by its own daylight length.
export function sunFactor(s: Settings) {
  const loc = s.location
  if (!loc) return 0.42
  const daylight = (loc.sunset ?? s.sunset) - (loc.sunrise ?? s.sunrise)
  return daylight > 0 ? loc.psh / daylight : 0.42
}

export function peakSunHours(s: Settings) {
  return Math.max(0, s.sunset - s.sunrise) * sunFactor(s)
}

export interface Results {
  dayWh: number
  nightWh: number
  peakW: number
  inverterKw: number
  batteryKwh: number
  solarKw: number
  panelCount: number
  /** Roof area the panels themselves cover (m²). */
  panelAreaM2: number
  systemVolts: 12 | 24 | 48
}

export function calculate(appliances: Appliance[], s: Settings): Results {
  let dayWh = 0
  let nightWh = 0
  let peakW = 0
  let surgeExtraW = 0
  for (const a of appliances) {
    const w = a.watts * a.qty
    const h = applianceHours(a, s)
    dayWh += w * h.day
    nightWh += w * h.night
    peakW += w
    // Only one unit starts at a time, so the worst case is the biggest single start-up spike.
    surgeExtraW = Math.max(surgeExtraW, a.watts * Math.max(0, a.surge - 1))
  }
  const inverterKw = ((peakW + surgeExtraW) * s.safetyMargin) / 1000
  const batteryKwh = (nightWh / 1000 / (s.dod * s.batteryEff * s.inverterEff)) * 1.1
  // Solar covers the daytime load plus recharging what the battery supplies at night.
  const dailyNeedKwh =
    (dayWh / s.inverterEff + nightWh / (s.batteryEff * s.batteryEff * s.inverterEff)) / 1000
  const psh = peakSunHours(s)
  const solarKw = psh > 0 ? dailyNeedKwh / (psh * s.derate) : 0
  const panelCount = solarKw > 0 ? Math.ceil((solarKw * 1000) / s.panelWatts) : 0
  const systemVolts = inverterKw <= 1.5 ? 12 : inverterKw <= 3 ? 24 : 48
  const panelAreaM2 = panelCount * s.panelLength * s.panelWidth
  return { dayWh, nightWh, peakW, inverterKw, batteryKwh, solarKw, panelCount, panelAreaM2, systemVolts }
}
