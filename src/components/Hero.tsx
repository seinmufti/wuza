import { Battery, Moon, Sun, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Results } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'

function Stat({
  icon,
  label,
  value,
  unit,
  sub,
  className,
  bodyClassName,
}: {
  icon: ReactNode
  label: string
  value: number
  unit: string
  sub: string
  className: string
  bodyClassName: string
}) {
  const v = useAnimatedNumber(value)
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl ${bodyClassName}`}>
      <div className={`flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-neutral-900 ${className}`}>
        {icon}
        {label}
      </div>
      <div className="px-3 pt-2 text-2xl leading-none font-semibold tabular-nums">
        <span dir="ltr" className="inline-block">
          {v.toFixed(1)}
          <span className="ms-0.5 text-sm font-normal text-white/70">{unit}</span>
        </span>
      </div>
      <div className="min-h-[1lh] px-3 pt-1 pb-3 text-[13px] text-white/60">{sub}</div>
    </div>
  )
}

// usage: how long appliances run in daylight and at night (overlaps counted once).
export function Hero({ r, usage }: { r: Results; usage: { day: number; night: number } }) {
  const totalWh = r.dayWh + r.nightWh
  const dayPct = totalWh > 0 ? (r.dayWh / totalWh) * 100 : 50
  const total = useAnimatedNumber(totalWh / 1000)
  const { t, hours } = useI18n()

  return (
    <section className="rounded-3xl bg-neutral-900 p-4 text-white">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-white/70">{t.dailyNeed}</div>
          <div className="text-3xl font-bold tabular-nums">
            <span dir="ltr" className="inline-block">
              {total.toFixed(2)} <span className="text-base font-normal text-white/80">kWh</span>
            </span>
          </div>
        </div>
        <div className="text-end text-[13px] text-white/70">
          {t.peakLoad}
          <div className="text-base font-semibold text-white tabular-nums">
            <bdi dir="ltr">{r.peakW} W</bdi>
          </div>
        </div>
      </div>

      <div dir="ltr" className="relative mt-3 flex h-2 overflow-hidden rounded-full bg-white/15">
        <div className="bg-amber-400 transition-all duration-500" style={{ width: `${dayPct}%` }} />
        <div className="flex-1 bg-indigo-400 transition-all duration-500" />
        <span aria-hidden className="bar-sweep pointer-events-none absolute inset-0">
          <span className="absolute inset-y-0 left-0 w-6 -translate-x-full -skew-x-20 bg-linear-to-r from-transparent via-white/80 to-transparent" />
        </span>
      </div>
      <div dir="ltr" className="mt-1 flex justify-between text-[13px] text-white/80">
        <span className="flex items-center gap-1">
          <Sun className="size-3" /> {(r.dayWh / 1000).toFixed(2)} kWh
          <span className="text-white/50">({hours(usage.day)})</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-white/50">({hours(usage.night)})</span>
          {(r.nightWh / 1000).toFixed(2)} kWh <Moon className="size-3" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat className="bg-amber-300" bodyClassName="bg-amber-300/20" icon={<Sun className="size-3" />} label={t.solar} value={r.solarKw} unit="kW" sub={t.panels(r.panelCount)} />
        <Stat className="bg-neutral-200" bodyClassName="bg-neutral-200/20" icon={<Zap className="size-3" />} label={t.inverter} value={r.inverterKw} unit="kW" sub="" />
        <Stat className="bg-sky-300" bodyClassName="bg-sky-300/20" icon={<Battery className="size-3" />} label={t.battery} value={r.batteryKwh} unit="kWh" sub="" />
      </div>

    </section>
  )
}
