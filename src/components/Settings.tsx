import { useState, type ReactNode } from 'react'
import { Battery, ChevronDown, SlidersHorizontal, Sun, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { InfoTip } from '@/components/InfoTip'
import { NumberInput } from '@/components/NumberInput'
import { DEFAULT_SETTINGS, type Settings } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function SettingsPanel({ value, onChange }: { value: Settings; onChange: (s: Settings) => void }) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  const num = (k: keyof Settings, v: string, scale = 1) => {
    const n = Number(v)
    if (!Number.isNaN(n) && n > 0) onChange({ ...value, [k]: n / scale })
  }
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <button className="flex w-full items-center gap-2 p-3 text-start text-base" onClick={() => setOpen(!open)}>
        <SlidersHorizontal className="size-4 text-muted-foreground" />
        <span className="flex-1 font-medium">{t.equipmentDetails}</span>
        <span className="text-sm text-muted-foreground">
          {t.wPanels(value.panelWatts)}
        </span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="animate-in fade-in-0 duration-150">
          <div className="grid grid-cols-3 gap-2 border-t p-3">
            <Column icon={<Sun className="size-3.5 text-amber-500" />} title={t.solar}>
              <Field label={t.panelW} info={t.panelWInfo} value={value.panelWatts} onChange={(v) => num('panelWatts', v)} />
              <Field label={t.derate} info={t.derateInfo} value={Math.round(value.derate * 100)} onChange={(v) => num('derate', v, 100)} />
            </Column>
            <Column icon={<Battery className="size-3.5 text-emerald-600" />} title={t.battery}>
              <Field label={t.usable} info={t.usableInfo} value={Math.round(value.dod * 100)} onChange={(v) => num('dod', v, 100)} />
              <Field label={t.efficiency} info={t.batteryEffInfo} value={Math.round(value.batteryEff * 100)} onChange={(v) => num('batteryEff', v, 100)} />
            </Column>
            <Column icon={<Zap className="size-3.5 text-indigo-500" />} title={t.inverter}>
              <Field label={t.efficiency} info={t.inverterEffInfo} value={Math.round(value.inverterEff * 100)} onChange={(v) => num('inverterEff', v, 100)} />
              <Field label={t.margin} info={t.marginInfo} value={value.safetyMargin} onChange={(v) => num('safetyMargin', v)} />
              <Field label={t.surge} info={t.surgeInfo} value={value.surgeMultiplier} onChange={(v) => num('surgeMultiplier', v)} />
            </Column>
            <Button
              variant="outline"
              className="col-span-3"
              onClick={() => onChange({ ...DEFAULT_SETTINGS, sunrise: value.sunrise, sunset: value.sunset, location: value.location })}
            >
              {t.resetDefaults}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function Column({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl bg-muted/50 p-2">
      <div className="flex items-center gap-1 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  info,
  value,
  onChange,
}: {
  label: string
  info: string
  value: number
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label className="text-[13px] font-normal text-muted-foreground">{label}</Label>
        <InfoTip text={info} />
      </div>
      <NumberInput value={value} onChange={(n) => onChange(String(n))} />
    </div>
  )
}
