// Open-Meteo: free, no API key.

export interface PlaceResult {
  name: string
  label: string
  lat: number
  lon: number
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&name=${encodeURIComponent(query)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Search failed')
  const data: { results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }[] } =
    await res.json()
  return (data.results ?? []).map((r) => ({
    name: r.name,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
  }))
}

export interface SunData {
  psh: number
  sunrise: number
  sunset: number
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)
const hourOf = (t: string) => {
  const [h, m] = t.slice(11, 16).split(':').map(Number)
  return h + m / 60
}
const roundQuarter = (h: number) => Math.round(h * 4) / 4

// Averages the last 12 months of measured irradiance, sunrise and sunset for the spot.
export async function fetchSunData(lat: number, lon: number): Promise<SunData> {
  const end = new Date(Date.now() - 7 * 864e5) // archive lags a few days
  const start = new Date(end.getTime() - 364 * 864e5)
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${isoDate(start)}&end_date=${isoDate(end)}` +
    `&daily=sunrise,sunset,shortwave_radiation_sum&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load sun data')
  const data: { daily: { sunrise: string[]; sunset: string[]; shortwave_radiation_sum: (number | null)[] } } =
    await res.json()
  const rad = data.daily.shortwave_radiation_sum.filter((v): v is number => v != null)
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  return {
    psh: avg(rad) / 3.6, // MJ/m² per day -> kWh/m² per day = peak sun hours
    sunrise: roundQuarter(avg(data.daily.sunrise.map(hourOf))),
    sunset: roundQuarter(avg(data.daily.sunset.map(hourOf))),
  }
}
