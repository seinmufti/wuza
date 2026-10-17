import { useState } from 'react'
import { ChevronDown, Clock, Minus, Moon, Plus, Sun, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/NumberInput'
import { SwipeCard } from '@/components/SwipeCard'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { applianceHours, type Appliance, type Settings } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { TickLabel } from '@/components/TickLabel'
import { cn } from '@/lib/utils'

// crypto.randomUUID only exists on HTTPS/localhost, so it breaks over the LAN link.
// After a card opens, scroll just enough to show all of it (no-op if it's already visible).
const revealCard = (id: string) =>
  requestAnimationFrame(() =>
    document.getElementById(`appliance-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
  )

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export function Appliances({
  items,
  settings,
  onChange,
}: {
  items: Appliance[]
  settings: Settings
  onChange: (items: Appliance[]) => void
}) {
  // Cards open independently so opening one never collapses another and shifts the page.
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const { t, clock, hours } = useI18n()
  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        next.add(id)
        revealCard(id)
      }
      return next
    })
  const energy = (a: Appliance) => {
    return a.watts * a.qty * applianceHours(a, settings).total
  }
  const totalWh = items.reduce((sum, a) => sum + energy(a), 0)

  const update = (id: string, patch: Partial<Appliance>) =>
    onChange(items.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  const add = () => {
    const a: Appliance = {
      id: newId(),
      name: '',
      watts: 100,
      qty: 1,
      from: 8,
      to: 12,
    }
    onChange([a, ...items])
    setOpenIds((prev) => new Set(prev).add(a.id))
    revealCard(a.id)
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold">{t.yourAppliances}</h2>
        <Button size="sm" onClick={add}>
          <Plus /> {t.add}
        </Button>
      </div>

      {items.length === 0 && (
        <button
          onClick={add}
          className="w-full rounded-2xl border-2 border-dashed py-8 text-base text-muted-foreground"
        >
          {t.emptyTitle}
          <div className="text-sm">{t.emptyHint}</div>
        </button>
      )}

      {items.map((a) => {
        const open = openIds.has(a.id)
        const wh = energy(a)
        const h = applianceHours(a, settings)
        const share = totalWh > 0 ? (wh / totalWh) * 100 : 0
        return (
          <SwipeCard key={a.id} onDelete={() => onChange(items.filter((i) => i.id !== a.id))}>
          <div id={`appliance-${a.id}`} className="overflow-hidden rounded-2xl border bg-card">
            <button
              className="relative flex w-full items-center gap-3 p-3 text-start"
              onClick={() => toggleOpen(a.id)}
            >
              <div
                className="absolute inset-y-0 start-0 bg-amber-100 transition-all duration-500 dark:bg-amber-900/30"
                style={{ width: `${share}%` }}
              />
              <div className="relative min-w-0 flex-1">
                <div className="truncate font-medium">
                  {a.name || t.unnamed}
                  {a.qty > 1 && <span className="ms-1 text-muted-foreground">x{a.qty}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 text-sm whitespace-nowrap text-muted-foreground">
                  <bdi dir="ltr">{a.watts} W</bdi>
                  <span>
                    {h.total >= 24 ? t.allDay : h.total > 0 ? `${clock(a.from)}-${clock(a.to)}` : t.off}
                  </span>
                  {h.day > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Sun className="size-3" />
                      {hours(h.day)}
                    </span>
                  )}
                  {h.night > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Moon className="size-3" />
                      {hours(h.night)}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative text-end text-sm">
                <div className="font-semibold tabular-nums">
                  <bdi dir="ltr">{(wh / 1000).toFixed(2)} kWh</bdi>
                </div>
                <div className="text-muted-foreground">{share.toFixed(0)}%</div>
              </div>
              <ChevronDown className={cn('relative size-4 transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
              <div data-no-swipe className="animate-in fade-in-0 duration-150">
                <div className="space-y-4 border-t p-3">
                  <Input
                    value={a.name}
                    placeholder={t.namePlaceholder}
                    onChange={(e) => update(a.id, { name: e.target.value })}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="mb-1 text-sm text-muted-foreground">{t.power}</div>
                      <NumberInput allowZero value={a.watts} onChange={(n) => update(a.id, { watts: n })} />
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">{t.quantity}</div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" onClick={() => update(a.id, { qty: Math.max(1, a.qty - 1) })}>
                          <Minus />
                        </Button>
                        <span className="w-6 text-center font-medium tabular-nums">{a.qty}</span>
                        <Button size="icon" variant="outline" onClick={() => update(a.id, { qty: a.qty + 1 })}>
                          <Plus />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <TimeRange
                    from={a.from}
                    to={a.to}
                    sunrise={settings.sunrise}
                    sunset={settings.sunset}
                    onChange={(from, to) => update(a.id, { from, to })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => onChange(items.filter((i) => i.id !== a.id))}
                  >
                    <Trash2 /> {t.remove}
                  </Button>
                </div>
              </div>
            )}
          </div>
          </SwipeCard>
        )
      })}
    </section>
  )
}

const TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

// Thumbs (16px) sit inside the track edges, so hour h is at 8px + h/24 of the remaining width.
const trackPos = (h: number) => `calc(8px + (100% - 16px) * ${h / 24})`
const HOURS = Array.from({ length: 25 }, (_, h) => h)

const SEGMENT_COLORS = {
  day: { on: '#f59e0b', off: '#fef3c7' }, // amber-500 / amber-100
  night: { on: '#4f46e5', off: '#e0e7ff' }, // indigo-600 / indigo-100
}

// Paints the track in hard-edged segments: amber for daylight, indigo for night,
// strong where the appliance runs and faint where it's off.
function trackBackground(a: number, b: number, overnight: boolean, sunrise: number, sunset: number) {
  const points = [...new Set([0, 24, a, b, sunrise, sunset].map((p) => Math.min(24, Math.max(0, p))))].sort(
    (x, y) => x - y,
  )
  const stops: string[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1] = [points[i], points[i + 1]]
    const mid = (p0 + p1) / 2
    const running = overnight ? mid < a || mid > b : mid > a && mid < b
    const tone = mid > sunrise && mid < sunset ? SEGMENT_COLORS.day : SEGMENT_COLORS.night
    const color = running ? tone.on : tone.off
    stops.push(`${color} ${trackPos(p0)}`, `${color} ${trackPos(p1)}`)
  }
  return `linear-gradient(to right, ${stops.join(', ')})`
}

const clamp24 = (v: number) => Math.min(24, Math.max(0, v))

// Always a 12am -> 12am slider. Overnight flips which part is "on": the handles mark the
// morning end and the evening start, and the filled part wraps around midnight outside them.
function TimeRange({
  from,
  to,
  sunrise,
  sunset,
  onChange,
}: {
  from: number
  to: number
  sunrise: number
  sunset: number
  onChange: (from: number, to: number) => void
}) {
  const [overnight, setOvernight] = useState(to > 24)
  const { t, clock, hours: fmtHours } = useI18n()
  const value = overnight ? [clamp24(to - 24), clamp24(from)] : [clamp24(from), clamp24(to)]
  const hours = overnight ? to - from : value[1] - value[0]

  // Handles stay where they are; only which side counts flips.
  const toggle = (on: boolean) => {
    setOvernight(on)
    const [left, right] = value
    if (on) onChange(right, left + 24)
    else onChange(left, right)
  }

  return (
    <div>
      <div className="relative mb-2 flex items-center text-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="size-3.5" />
          {t.runsFrom}
        </span>
        <span className="absolute left-1/2 -translate-x-1/2 font-semibold whitespace-nowrap tabular-nums">
          {hours > 0 ? `${clock(from)} - ${clock(to)}` : t.off}
        </span>
        <span className="ms-auto font-semibold tabular-nums">{fmtHours(hours)}</span>
      </div>
      <Slider
        dir="ltr"
        min={0}
        max={24}
        step={0.25}
        value={value}
        style={{ '--track': trackBackground(value[0], value[1], overnight, sunrise, sunset) } as React.CSSProperties}
        className="[&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-track]]:h-2.5! [&_[data-slot=slider-track]]:[background:var(--track)]"
        onValueChange={(v) => {
          if (!Array.isArray(v)) return
          if (overnight) onChange(v[1], v[0] + 24)
          else onChange(v[0], v[1])
        }}
      />
      <div dir="ltr" className="relative mt-1.5 h-2">
        {HOURS.map((h) => (
          <span
            key={h}
            className={cn('absolute top-0 w-px -translate-x-1/2', h % 3 ? 'h-1 bg-neutral-300' : 'h-2 bg-neutral-400')}
            style={{ left: trackPos(h) }}
          />
        ))}
      </div>
      <div dir="ltr" className="relative mt-0.5 h-6 text-xs text-muted-foreground">
        {TICKS.map((tick) => (
          <span key={tick} className="absolute -translate-x-1/2" style={{ left: trackPos(tick) }}>
            <TickLabel h={tick} />
          </span>
        ))}
      </div>
      <label className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        {t.overnight}
        <Switch checked={overnight} onCheckedChange={toggle} />
      </label>
    </div>
  )
}
