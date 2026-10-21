import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Hero } from '@/components/Hero'
import { NumberInput } from '@/components/NumberInput'
import { SettingsPanel } from '@/components/Settings'
import { Shell } from '@/components/Shell'
import { Sunlight } from '@/components/Sunlight'
import { DEFAULT_SETTINGS, sizeSystem, type Settings } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { load, save } from '@/lib/storage'
import { cn } from '@/lib/utils'

// /reverse: start from the amps you draw by day and by night instead of a list of appliances.
type AmpInputs = { dayAmps: number; nightAmps: number }

const DEFAULT_AMPS: AmpInputs = { dayAmps: 0, nightAmps: 0 }

export function ReversePage() {
  const { t } = useI18n()
  const [v, setV] = useState<AmpInputs>(() => load('wuza.reverse', DEFAULT_AMPS))
  // Its own location, daylight and equipment settings, separate from Home's.
  const [settings, setSettings] = useState<Settings>(() => load('wuza.reverse.settings', DEFAULT_SETTINGS))
  useEffect(() => save('wuza.reverse', v), [v])
  useEffect(() => save('wuza.reverse.settings', settings), [settings])
  const set = (patch: Partial<AmpInputs>) => setV((p) => ({ ...p, ...patch }))

  // Day runs from sunrise to sunset; night is the rest of the 24 hours.
  const dayHours = Math.max(0, settings.sunset - settings.sunrise)
  const nightHours = 24 - dayHours
  // Watts = amps × volts. Day and night loads don't run at the same time, so the peak is the larger one.
  const dayW = v.dayAmps * settings.volts
  const nightW = v.nightAmps * settings.volts
  const results = useMemo(
    // For now this page assumes panels give their full rated watts all daylight (to be refined later).
    () => sizeSystem(dayW * dayHours, nightW * nightHours, Math.max(dayW, nightW), 0, settings, true),
    [dayW, nightW, dayHours, nightHours, settings],
  )

  return (
    <Shell>
      <Hero r={results} usage={{ day: dayHours, night: nightHours }} />
      <Sunlight settings={settings} onChange={setSettings} />

      <section className="space-y-3 rounded-2xl border bg-card p-3">
        <h2 className="px-1 text-base font-semibold">{t.ampsTitle}</h2>
        <Period
          icon={<Sun className="size-4" />}
          bar="bg-amber-400"
          title={t.day}
          amps={v.dayAmps}
          hours={dayHours}
          watts={dayW}
          onAmps={(n) => set({ dayAmps: n })}
        />
        <Period
          icon={<Moon className="size-4" />}
          bar="bg-indigo-400"
          title={t.night}
          amps={v.nightAmps}
          hours={nightHours}
          watts={nightW}
          onAmps={(n) => set({ nightAmps: n })}
        />
      </section>

      <SettingsPanel amps value={settings} onChange={setSettings} />
    </Shell>
  )
}

function Period({
  icon,
  bar,
  title,
  amps,
  hours,
  watts,
  onAmps,
}: {
  icon: ReactNode
  bar: string
  title: string
  amps: number
  hours: number
  watts: number
  onAmps: (n: number) => void
}) {
  const { t, hours: fmtHours } = useI18n()
  return (
    <div className="flex items-end gap-2.5 rounded-xl bg-neutral-50 p-3">
      <span className={cn('h-10 w-2.5 shrink-0 self-center rounded-full', bar)} />
      <div className="min-w-0 flex-1 self-center">
        <div className="flex items-center gap-1 text-base font-semibold">
          {icon}
          {title}
        </div>
        <bdi dir="ltr" className="block truncate text-sm text-muted-foreground tabular-nums">
          {(watts / 1000).toFixed(2)} kW · {((watts * hours) / 1000).toFixed(2)} kWh
        </bdi>
      </div>
      {/* Read-only: comes from sunrise and sunset in Location & daylight. */}
      <div className="w-20 shrink-0 space-y-1">
        <Label className="text-sm font-normal text-muted-foreground">{t.hoursShort}</Label>
        <div className="flex h-11 items-center rounded-lg bg-neutral-200/60 px-3 text-base text-neutral-600 tabular-nums">
          {fmtHours(hours)}
        </div>
      </div>
      <div className="w-24 shrink-0 space-y-1">
        <Label className="text-sm font-normal text-muted-foreground">{t.amps}</Label>
        <NumberInput className="border-transparent bg-white" allowZero placeholder="0" value={amps} onChange={onAmps} />
      </div>
    </div>
  )
}
