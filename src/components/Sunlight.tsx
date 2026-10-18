import { useEffect, useState } from 'react'
import { ChevronDown, Loader2, RotateCcw, LocateFixed, MapPin, Sun, Sunrise, Sunset, X } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { DEFAULT_SETTINGS, peakSunHours, sunFactor, type Settings } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { TickLabel } from '@/components/TickLabel'
import { Collapse } from '@/components/Collapse'
import { cn } from '@/lib/utils'
import { fetchSunData, searchPlaces, type PlaceResult } from '@/lib/solar'

// autoFocus would scroll the page to the input; focus in place instead.
const focusWithoutScroll = (el: HTMLInputElement | null) => el?.focus({ preventScroll: true })

export function Sunlight({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  const [open, setOpen] = useState(false)
  const { t, clock, hours } = useI18n()
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (name: string, lat: number, lon: number) => {
    setBusy(true)
    setError('')
    try {
      const sun = await fetchSunData(lat, lon)
      onChange({
        ...settings,
        sunrise: sun.sunrise,
        sunset: sun.sunset,
        location: { name, lat, lon, psh: Math.round(sun.psh * 10) / 10, sunrise: sun.sunrise, sunset: sun.sunset },
      })
      setSearching(false)
      setQuery('')
      setResults([])
    } catch {
      setError(t.errSunData)
    } finally {
      setBusy(false)
    }
  }

  // Search as you type, debounced; a newer keystroke cancels the older request.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setError('')
      return
    }
    let stale = false
    const timer = setTimeout(async () => {
      setBusy(true)
      try {
        const r = await searchPlaces(q)
        if (stale) return
        setResults(r)
        setError(r.length === 0 ? t.errNoPlaces : '')
      } catch {
        if (!stale) setError(t.errSearch)
      } finally {
        if (!stale) setBusy(false)
      }
    }, 300)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [query])

  const place = settings.location
  // Reset goes back to the place's own sun times, or the app defaults without a location.
  // Older saves didn't store the place's sun times, so always offer a reset there (it refetches).
  const timesChanged = place
    ? place.sunrise == null || place.sunrise !== settings.sunrise || place.sunset !== settings.sunset
    : settings.sunrise !== DEFAULT_SETTINGS.sunrise || settings.sunset !== DEFAULT_SETTINGS.sunset

  const resetTimes = () => {
    if (!place) onChange({ ...settings, sunrise: DEFAULT_SETTINGS.sunrise, sunset: DEFAULT_SETTINGS.sunset })
    else if (place.sunrise != null && place.sunset != null)
      onChange({ ...settings, sunrise: place.sunrise, sunset: place.sunset })
    else pick(place.name, place.lat, place.lon)
  }

  const resetButton = timesChanged && (
    <button
      disabled={busy}
      className="flex items-center gap-1 rounded-full bg-black/10 px-3 py-1.5 hover:bg-black/15 disabled:opacity-50"
      onClick={resetTimes}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} {t.resetTimes}
    </button>
  )

  const locate = () => {
    if (!navigator.geolocation) return setError(t.errNoGeo)
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (p) => pick(t.currentLocation, p.coords.latitude, p.coords.longitude),
      () => {
        setBusy(false)
        setError(t.errGeoDenied)
      },
    )
  }

  return (
    <section data-collapse-root className="overflow-hidden rounded-2xl border bg-card">
      <button className="flex w-full items-center gap-2.5 p-4 text-start text-base" onClick={() => setOpen(!open)}>
        <Sun className="size-5 text-amber-500" />
        <span className="flex-1 font-medium">{t.locationDaylight}</span>
        <span className="truncate text-sm text-muted-foreground">
          {settings.location ? `${settings.location.name} · ` : ''}
          {clock(settings.sunrise)}-{clock(settings.sunset)}
        </span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      <Collapse open={open}>
        <div>
          <div className="border-t p-3">
      <div className="mb-3 flex flex-col gap-2 text-sm">
        {settings.location ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex w-fit min-w-0 items-center gap-1 rounded-full bg-black/10 py-1.5 ps-3 pe-1.5">
            <MapPin className="size-4 shrink-0 text-amber-500" />
            <span className="truncate">{settings.location.name}</span>
            <button
              aria-label={t.clearLocation}
              className="rounded-full p-0.5 hover:bg-black/10"
              onClick={() =>
                onChange({
                  ...settings,
                  location: null,
                  sunrise: DEFAULT_SETTINGS.sunrise,
                  sunset: DEFAULT_SETTINGS.sunset,
                })
              }
            >
              <X className="size-4" />
            </button>
          </span>
            {resetButton}
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="flex w-fit items-center gap-1 rounded-full bg-black/10 px-3 py-1.5 hover:bg-black/15"
              onClick={() => setSearching(!searching)}
            >
              <MapPin className="size-4 text-amber-500" /> {t.setLocation}
            </button>
            {resetButton}
          </div>
        )}
        {/* The value is centered on its own; the formula hangs off its end edge. */}
        <span className="text-center text-neutral-900/60 tabular-nums">
          <span className="relative inline-block">
            {settings.location ? '' : '~'}
            {peakSunHours(settings).toFixed(1)} {t.peakSunH}
            <span className="absolute top-1/2 start-full ms-1 -translate-y-1/2 text-xs whitespace-nowrap">
              <bdi dir="ltr">
                ({(settings.sunset - settings.sunrise).toFixed(1)} h × {sunFactor(settings).toFixed(2)})
              </bdi>
            </span>
          </span>
        </span>
      </div>

      {searching && !settings.location && (
        <div className="mb-3 space-y-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (results[0]) pick(results[0].name, results[0].lat, results[0].lon)
            }}
          >
            <input
              ref={focusWithoutScroll}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.cityOrTown}
              className="h-11 min-w-0 flex-1 rounded-lg border border-black/15 bg-white/50 px-3 text-base outline-none placeholder:text-neutral-900/40 focus:border-neutral-900"
            />
            <button
              type="button"
              aria-label={t.useMyLocation}
              onClick={locate}
              className="flex size-11 items-center justify-center rounded-lg border border-black/15 hover:bg-black/10"
            >
              <LocateFixed className="size-4" />
            </button>
          </form>
          {busy && (
            <div className="flex items-center gap-2 text-sm text-neutral-900/60">
              <Loader2 className="size-4 animate-spin" /> {t.loading}
            </div>
          )}
          {error && <div className="text-sm text-red-700">{error}</div>}
          {results.map((r) => (
            <button
              key={`${r.lat},${r.lon}`}
              disabled={busy}
              onClick={() => pick(r.name, r.lat, r.lon)}
              className="block w-full truncate rounded-lg px-3 py-2.5 text-start text-base hover:bg-black/10"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div dir="ltr" className="mb-3 flex items-center justify-between text-base font-semibold tabular-nums">
        <span className="flex items-center gap-1">
          <Sunrise className="size-5 text-amber-500" /> {clock(settings.sunrise, true)}
        </span>
        <span className="text-sm font-normal text-neutral-900/60">
          {t.ofDaylight(hours(settings.sunset - settings.sunrise))}
        </span>
        <span className="flex items-center gap-1">
          {clock(settings.sunset, true)} <Sunset className="size-5 text-amber-500" />
        </span>
      </div>
      <Slider
        dir="ltr"
        min={0}
        max={24}
        step={5 / 60}
        minStepsBetweenValues={12}
        thumbCollisionBehavior="none"
        className="[&_[data-slot=slider-range]]:bg-neutral-900 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-neutral-900 [&_[data-slot=slider-track]]:h-1.5! [&_[data-slot=slider-track]]:bg-black/15"
        value={[settings.sunrise, settings.sunset]}
        onValueChange={(v) => {
          if (Array.isArray(v)) onChange({ ...settings, sunrise: v[0], sunset: v[1] })
        }}
      />
      <div dir="ltr" className="mt-1 flex justify-between text-xs text-neutral-900/60">
        {[0, 6, 12, 18, 24].map((h) => (
          <TickLabel key={h} h={h} />
        ))}
      </div>
          </div>
        </div>
      </Collapse>
    </section>
  )
}
