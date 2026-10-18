import { useState, type ReactNode } from 'react'
import { Battery, ChevronDown, SlidersHorizontal, Sun, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { InfoTip } from '@/components/InfoTip'
import { NumberInput } from '@/components/NumberInput'
import { DEFAULT_SETTINGS, type Settings } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { Collapse } from '@/components/Collapse'
import { cn } from '@/lib/utils'

export function SettingsPanel({ value, onChange }: { value: Settings; onChange: (s: Settings) => void }) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  const num = (k: keyof Settings, v: string, scale = 1) => {
    const n = Number(v)
    if (!Number.isNaN(n) && n > 0) onChange({ ...value, [k]: n / scale })
  }
  return (
    <section data-collapse-root className="overflow-hidden rounded-2xl border bg-card">
      <button className="flex w-full items-center gap-2.5 p-4 text-start text-base" onClick={() => setOpen(!open)}>
        <SlidersHorizontal className="size-5 text-muted-foreground" />
        <span className="flex-1 font-medium">{t.equipmentDetails}</span>
        <span className="text-sm text-muted-foreground">
          {t.wPanels(value.panelWatts)}
        </span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      <Collapse open={open}>
        <div>
          <div className="grid grid-cols-3 gap-2 border-t p-3">
            <Column icon={<Sun className="size-4 text-amber-500" />} title={t.solar}>
              <Field label={t.panelW} info={t.panelWInfo} value={value.panelWatts} defaultValue={DEFAULT_SETTINGS.panelWatts} onChange={(v) => num('panelWatts', v)} />
              <Field label={t.panelLength} info={t.panelSizeInfo} value={value.panelLength} defaultValue={DEFAULT_SETTINGS.panelLength} onChange={(v) => num('panelLength', v)} />
              <Field label={t.panelWidth} info={t.panelSizeInfo} value={value.panelWidth} defaultValue={DEFAULT_SETTINGS.panelWidth} onChange={(v) => num('panelWidth', v)} />
              <Field label={t.derate} info={t.derateInfo} value={Math.round(value.derate * 100)} defaultValue={Math.round(DEFAULT_SETTINGS.derate * 100)} onChange={(v) => num('derate', v, 100)} />
            </Column>
            <Column icon={<Battery className="size-4 text-emerald-600" />} title={t.battery}>
              <Field label={t.usable} info={t.usableInfo} value={Math.round(value.dod * 100)} defaultValue={Math.round(DEFAULT_SETTINGS.dod * 100)} onChange={(v) => num('dod', v, 100)} />
              <Field label={t.efficiency} info={t.batteryEffInfo} value={Math.round(value.batteryEff * 100)} defaultValue={Math.round(DEFAULT_SETTINGS.batteryEff * 100)} onChange={(v) => num('batteryEff', v, 100)} />
            </Column>
            <Column icon={<Zap className="size-4 text-indigo-500" />} title={t.inverter}>
              <Field label={t.efficiency} info={t.inverterEffInfo} value={Math.round(value.inverterEff * 100)} defaultValue={Math.round(DEFAULT_SETTINGS.inverterEff * 100)} onChange={(v) => num('inverterEff', v, 100)} />
              <Field label={t.margin} info={t.marginInfo} value={value.safetyMargin} defaultValue={DEFAULT_SETTINGS.safetyMargin} onChange={(v) => num('safetyMargin', v)} />
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
      </Collapse>
    </section>
  )
}

function Column({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl bg-muted/50 p-2.5">
      <div className="flex items-center gap-1 text-base font-semibold">
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
  defaultValue,
  onChange,
}: {
  label: string
  info: string
  value: number
  /** Shown dark grey when the value differs from this, so changed settings stand out. */
  defaultValue: number
  onChange: (v: string) => void
}) {
  const changed = value !== defaultValue
  return (
    <div className="space-y-1">
      <div className="flex min-h-10 items-end gap-1">
        <Label className="text-sm leading-tight font-normal text-muted-foreground">{label}</Label>
        <InfoTip text={info} />
      </div>
      <NumberInput
        className={cn(changed && 'border-neutral-700 bg-neutral-700 text-white')}
        value={value}
        onChange={(n) => onChange(String(n))}
      />
    </div>
  )
}
