import { useState } from 'react'
import { ChevronDown, Clock, Minus, Moon, Plus, RotateCcw, Sun, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InfoTip } from '@/components/InfoTip'
import { NumberInput } from '@/components/NumberInput'
import { SwipeCard } from '@/components/SwipeCard'
import { Collapse } from '@/components/Collapse'
import { ScrollArea } from '@/components/ScrollArea'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { APPLIANCE_ICONS, PRESETS, type ApplianceIcon } from '@/lib/presets'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { applianceHours, type Appliance, type Settings } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { TickLabel } from '@/components/TickLabel'
import { cn } from '@/lib/utils'

// crypto.randomUUID only exists on HTTPS/localhost, so it breaks over the LAN link.
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
      else next.add(id)
      return next
    })
  // Day / Night filter: shows only appliances used in that period and counts only those hours.
  const [filter, setFilter] = useState<'all' | 'day' | 'night'>('all')
  const periodHours = (a: Appliance) => {
    const h = applianceHours(a, settings)
    return filter === 'day' ? h.day : filter === 'night' ? h.night : h.total
  }
  const energy = (a: Appliance) => a.watts * a.qty * periodHours(a)
  const visible = filter === 'all' ? items : items.filter((a) => periodHours(a) > 0)
  const totalWh = visible.reduce((sum, a) => sum + energy(a), 0)

  const update = (id: string, patch: Partial<Appliance>) =>
    onChange(items.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  // Add starts from a preset (or "Other" with no name); details are editable in the card that opens.
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const add = (preset?: (typeof PRESETS)[number]) => {
    const a: Appliance = {
      id: newId(),
      name: preset ? t.presetNames[preset.icon] : '',
      icon: preset?.icon ?? 'plug',
      watts: preset?.watts ?? 100,
      qty: 1,
      surge: preset?.surge ?? 1,
      from: preset?.from ?? 8,
      to: preset?.to ?? 12,
    }
    onChange([a, ...items])
    return a.id
  }

  // The new card opens (and scrolls into view) the moment a preset is tapped, while the picker
  // slides away. The picker doesn't lock page scrolling, so that scroll can run straight away.
  const choose = (preset?: (typeof PRESETS)[number]) => {
    const id = add(preset)
    setOpenIds((prev) => new Set(prev).add(id))
    setPickerOpen(false)
  }

  return (
    <section className="space-y-2 rounded-3xl bg-[#49a47a] p-3">
      <div className="-mx-3 -mt-3 mb-3 flex items-center justify-between rounded-t-3xl bg-[#1b4332] px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          {t.yourAppliances}
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/15 px-2 text-sm tabular-nums">
            {visible.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              size="icon"
              aria-label={t.deleteAll}
              title={t.deleteAll}
              className="size-10 bg-white/15 text-white hover:bg-white/25"
              onClick={() => setConfirmClear(true)}
            >
              <RotateCcw className="size-5" />
            </Button>
          )}
          <Button
            className="h-10 gap-1.5 bg-white px-4 text-base text-neutral-900 hover:bg-[#d8f3dc]"
            onClick={() => setPickerOpen(true)}
          >
            <Plus /> {t.add}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['day', 'night'] as const).map((f) => {
          const active = filter === f
          const Icon = f === 'day' ? Sun : Moon
          return (
            <button
              key={f}
              aria-pressed={active}
              onClick={() => setFilter(active ? 'all' : f)}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors',
                active ? 'bg-white text-neutral-900' : 'bg-white/20 text-white hover:bg-white/30',
              )}
            >
              <Icon className={cn('size-4', active && (f === 'day' ? 'text-amber-500' : 'text-indigo-500'))} />
              {f === 'day' ? t.day : t.night}
            </button>
          )
        })}
      </div>

      {items.length === 0 && (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full rounded-2xl border-2 border-dashed border-white/40 py-8 text-base text-white"
        >
          {t.emptyTitle}
          <div className="text-sm">{t.emptyHint}</div>
        </button>
      )}

      {visible.map((a) => {
        const open = openIds.has(a.id)
        const wh = energy(a)
        const h = applianceHours(a, settings)
        const share = totalWh > 0 ? (wh / totalWh) * 100 : 0
        return (
          <SwipeCard key={a.id} onDelete={() => onChange(items.filter((i) => i.id !== a.id))}>
          <div id={`appliance-${a.id}`} data-collapse-root className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white text-neutral-900">
            {/* Fixed-height header (no wrapping) so the card doesn't jump while dragging the slider. */}
            <button className="flex w-full items-center gap-2.5 p-3.5 text-start" onClick={() => toggleOpen(a.id)}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                <ApplianceGlyph icon={a.icon} className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold">
                  {a.name || t.unnamed}
                  {a.qty > 1 && <span className="ms-1.5 font-normal text-neutral-500">×{a.qty}</span>}
                </div>
                <div className="truncate text-sm whitespace-nowrap text-neutral-500">
                  <bdi dir="ltr">{a.watts} W</bdi>
                  <span className="mx-1.5">·</span>
                  {h.total >= 24 ? t.allDay : h.total > 0 ? `${clock(a.from)}-${clock(a.to)}` : t.off}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm whitespace-nowrap text-neutral-500">
                  {filter !== 'night' && (
                    <span className="flex items-center gap-1">
                      <Sun className="size-3.5 text-amber-500" />
                      {hours(h.day)}
                    </span>
                  )}
                  {filter !== 'day' && (
                    <span className="flex items-center gap-1">
                      <Moon className="size-3.5 text-indigo-500" />
                      {hours(h.night)}
                    </span>
                  )}
                </div>
              </div>
              <ShareRing share={share} kwh={wh / 1000} />
              <ChevronDown
                className={cn('size-5 shrink-0 text-neutral-500 transition-transform', open && 'rotate-180')}
              />
            </button>

            <Collapse open={open} center>
              <div data-no-swipe>
                <div className="space-y-4 border-t border-neutral-200/70 bg-white p-4 text-neutral-900 [&_input:not([type=range])]:border-transparent [&_input:not([type=range])]:bg-neutral-100">
                  <Input
                    value={a.name}
                    className="h-11 text-base"
                    placeholder={t.namePlaceholder}
                    onChange={(e) => update(a.id, { name: e.target.value })}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="mb-1 text-sm text-muted-foreground">{t.power}</div>
                      <NumberInput className="h-11 text-base" allowZero value={a.watts} onChange={(n) => update(a.id, { watts: n })} />
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">{t.quantity}</div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="secondary" className="size-11 bg-neutral-100 hover:bg-neutral-200" onClick={() => update(a.id, { qty: Math.max(1, a.qty - 1) })}>
                          <Minus />
                        </Button>
                        <NumberInput
                          className="h-11 w-16 text-center text-base"
                          integer
                          value={a.qty}
                          onChange={(n) => update(a.id, { qty: Math.max(1, Math.round(n)) })}
                        />
                        <Button size="icon" variant="secondary" className="size-11 bg-neutral-100 hover:bg-neutral-200" onClick={() => update(a.id, { qty: a.qty + 1 })}>
                          <Plus />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2 pe-1.5">
                    <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                      {t.surge}
                      <InfoTip text={t.surgeInfo} />
                    </div>
                    <NumberInput className="h-11 text-base" value={a.surge} onChange={(n) => update(a.id, { surge: Math.max(1, n) })} />
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
            </Collapse>
          </div>
          </SwipeCard>
        )
      })}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen} modal="trap-focus">
        <DialogContent
          // Returning focus to the Add button would scroll the page to it, fighting the new card's scroll.
          finalFocus={false}
          className="flex max-h-[85svh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[400px]"
        >
          <DialogTitle className="px-4 pt-4 pb-3 pe-12 text-lg font-semibold">{t.chooseAppliance}</DialogTitle>
          {/* Presets scroll; "Other" stays pinned underneath as a footer. */}
          <ScrollArea className="grid grid-cols-2 content-start gap-2 px-4 pb-3">
            {PRESETS.map((p) => (
              <button
                key={p.icon}
                onClick={() => choose(p)}
                className="flex flex-col gap-2 rounded-2xl bg-neutral-100 p-3 text-start hover:bg-neutral-200"
              >
                {/* 48px square icon, matching three 16px detail lines beside it. */}
                <span className="flex items-start justify-between gap-2">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-700">
                    <ApplianceGlyph icon={p.icon} className="size-6" />
                  </span>
                  <span className="flex flex-col items-end text-xs leading-4 text-neutral-500 tabular-nums">
                    <bdi dir="ltr">{p.watts} W</bdi>
                    <span>×{p.surge} {t.surgeShort}</span>
                    <span className="whitespace-nowrap">
                      {p.to - p.from >= 24 ? t.allDay : `${clock(p.from)}-${clock(p.to)}`}
                    </span>
                  </span>
                </span>
                <span className="text-sm leading-tight font-semibold">{t.presetNames[p.icon]}</span>
              </button>
            ))}
          </ScrollArea>
          <div className="border-t bg-popover px-4 pt-3 pb-4">
              <button
                onClick={() => choose()}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 p-3 text-start hover:bg-neutral-100"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                  <ApplianceGlyph icon="plug" className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{t.other}</span>
                  <span className="block text-xs text-neutral-500">{t.otherHint}</span>
                </span>
              </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* In-app confirmation (the browser's confirm() pop-up is blocked in some views). */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] gap-3 rounded-3xl p-5 sm:max-w-[360px]">
          <DialogTitle className="text-lg font-semibold">{t.deleteAll}</DialogTitle>
          <DialogDescription className="text-base text-neutral-600">{t.deleteAllConfirm(items.length)}</DialogDescription>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11" onClick={() => setConfirmClear(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              onClick={() => {
                onChange([])
                setConfirmClear(false)
              }}
            >
              <Trash2 /> {t.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function ApplianceGlyph({ icon, className }: { icon?: ApplianceIcon; className?: string }) {
  const Icon = APPLIANCE_ICONS[icon ?? 'plug'] ?? APPLIANCE_ICONS.plug
  return <Icon className={className} />
}

// Circular share of the day's total (% in the middle), with this appliance's kWh underneath.
function ShareRing({ share, kwh }: { share: number; kwh: number }) {
  const r = 15.5
  const c = 2 * Math.PI * r
  return (
    <div dir="ltr" className="flex shrink-0 flex-col items-center gap-0.5">
      <div className="relative size-12">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r={r} fill="none" stroke="rgb(0 0 0 / 0.1)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(Math.min(100, share) / 100) * c} ${c}`}
            className="transition-[stroke-dasharray] duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
          {Math.round(share)}%
        </span>
      </div>
      <span className="text-xs font-semibold whitespace-nowrap tabular-nums">
        {kwh.toFixed(1)} <span className="font-normal text-neutral-500">kWh</span>
      </span>
    </div>
  )
}

const TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

// Thumbs (20px) sit inside the track edges, so hour h is at 10px + h/24 of the remaining width.
const trackPos = (h: number) => `calc(10px + (100% - 20px) * ${h / 24})`
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
      <div className="mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="size-4" />
          {t.runsFrom}
        </span>
        <span className="truncate text-center font-semibold whitespace-nowrap tabular-nums">
          {hours > 0 ? `${clock(from)}-${clock(to)}` : t.off}
        </span>
        <span className="font-semibold whitespace-nowrap tabular-nums">{fmtHours(hours)}</span>
      </div>
      <Slider
        dir="ltr"
        min={0}
        max={24}
        step={0.25}
        // Handles stop at each other (no pushing) and always keep at least one 15-min step apart.
        thumbCollisionBehavior="none"
        minStepsBetweenValues={1}
        value={value}
        style={{ '--track': trackBackground(value[0], value[1], overnight, sunrise, sunset) } as React.CSSProperties}
        className="[&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-track]]:h-3! [&_[data-slot=slider-track]]:[background:var(--track)]"
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
