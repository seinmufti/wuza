import { useEffect, useState } from 'react'

// Live USD/IQD rate from Borsa Alam (Erbil market), via jardCAD's proxy, which allows any origin.
// The feed quotes IQD for $100.
const BORSA_URL = 'https://jard-plum.vercel.app/api/borsa-prices'
const CACHE_KEY = 'wuza.borsa'
const REFRESH_MS = 60 * 1000

export type BorsaQuote = { rate100: number; at: number }

function readCache(): BorsaQuote | null {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
    return v && v.rate100 > 0 ? v : null
  } catch {
    return null
  }
}

async function fetchQuote(signal: AbortSignal): Promise<BorsaQuote | null> {
  try {
    const res = await fetch(`${BORSA_URL}?_=${Date.now()}`, { signal, cache: 'no-store' })
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return null
    // Row 1 is the US dollar; rates use comma thousands ("168,650").
    const usd = data.find((r) => Number(r?.id) === 1)
    const rate100 = Number(String(usd?.sell_rate ?? '').replace(/,/g, ''))
    if (!(rate100 > 0)) return null
    const at = Number(res.headers.get('X-Jard-Borsa-Fetched-At')) || Date.now()
    return { rate100, at }
  } catch {
    return null
  }
}

/** Latest Borsa rate. Shows the last good one while loading; a failed fetch clears it (shown as unavailable). */
export function useBorsaRate() {
  const [quote, setQuote] = useState<BorsaQuote | null>(readCache)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    const load = async () => {
      const q = await fetchQuote(ac.signal)
      if (ac.signal.aborted) return
      setFailed(!q)
      if (!q) {
        setQuote(null)
        return
      }
      setQuote(q)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(q))
      } catch {
        /* storage unavailable */
      }
    }
    void load()
    const id = window.setInterval(load, REFRESH_MS)
    return () => {
      ac.abort()
      window.clearInterval(id)
    }
  }, [])

  return { quote, failed }
}

