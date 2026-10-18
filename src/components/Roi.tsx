import type { ReactNode } from 'react'
import { ArrowLeftRight, Battery, PlugZap, Sun, TrendingUp, Zap } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/NumberInput'
import type { Results, Settings } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// Sizes are null while they follow what the Home page calculates; typing one pins it.
export type RoiInputs = {
  panelWatts: number | null
  panelCount: number | null
  panelPrice: number
  inverterKw: number | null
  inverterPrice: number
  batteryKwh: number | null
  batteryPrice: number
  kwhPrice: number
  monthKwh: number | null
  exchange: number
}

export const DEFAULT_ROI: RoiInputs = {
  panelWatts: null,
  panelCount: null,
  panelPrice: 0,
  inverterKw: null,
  inverterPrice: 0,
  batteryKwh: null,
  batteryPrice: 0,
  kwhPrice: 0,
  monthKwh: null,
  exchange: 1500,
}

const TARIFFS = [
  { iqd: 72, label: 'residential' },
  { iqd: 185, label: 'commercial' },
] as const

const round2 = (n: number) => Math.round(n * 100) / 100
const money = (n: number) => Math.round(n).toLocaleString('en-US')
// Dollar amounts keep their cents.
export const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Equipment cost in dollars; panels follow the Home count unless one was typed. */
export const roiTotal = (v: RoiInputs, r: Results) =>
  (v.panelCount ?? r.panelCount) * v.panelPrice + v.inverterPrice + v.batteryPrice

export function Roi({
  r,
  settings,
  value: v,
  onChange,
}: {
  r: Results
  settings: Settings
  value: RoiInputs
  onChange: (v: RoiInputs) => void
}) {
  const { t } = useI18n()
  const set = (patch: Partial<RoiInputs>) => onChange({ ...v, ...patch })

  // What the Home page says you need.
  const home = {
    panelWatts: settings.panelWatts,
    panelCount: r.panelCount,
    inverterKw: round2(r.inverterKw),
    batteryKwh: round2(r.batteryKwh),
    monthKwh: round2(((r.dayWh + r.nightWh) / 1000) * 30),
  }
  const panelWatts = v.panelWatts ?? home.panelWatts
  const panelCount = v.panelCount ?? home.panelCount
  const inverterKw = v.inverterKw ?? home.inverterKw
  const batteryKwh = v.batteryKwh ?? home.batteryKwh
  const monthKwh = v.monthKwh ?? home.monthKwh
  // Typing the Home value back un-pins the field so it follows Home again.
  const pin = <K extends keyof typeof home>(k: K, n: number) => set({ [k]: n === home[k] ? null : n })

  const panelsCost = panelCount * v.panelPrice
  const totalUsd = panelsCost + v.inverterPrice + v.batteryPrice
  const monthIqd = monthKwh * v.kwhPrice
  const monthUsd = monthIqd / v.exchange
  const months = totalUsd > 0 && monthUsd > 0 ? totalUsd / monthUsd : null

  return (
    <div className="space-y-4">
      <Card icon={<Sun className="size-4" />} title={t.solar} head="bg-amber-300" total={panelsCost}>
        <div className="grid grid-cols-3 gap-2">
          <Field label={t.panelW} value={panelWatts} changed={v.panelWatts !== null} integer onChange={(n) => pin('panelWatts', n)} onClear={() => set({ panelWatts: null })} />
          <Field label={t.quantity} value={panelCount} changed={v.panelCount !== null} integer onChange={(n) => pin('panelCount', n)} onClear={() => set({ panelCount: null })} />
          <Field label={t.priceEach} value={v.panelPrice} price onChange={(n) => set({ panelPrice: n })} />
        </div>
      </Card>

      <Card icon={<Zap className="size-4" />} title={t.inverter} head="bg-neutral-200" total={v.inverterPrice}>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t.sizeKw} value={inverterKw} changed={v.inverterKw !== null} onChange={(n) => pin('inverterKw', n)} onClear={() => set({ inverterKw: null })} />
          <Field label={t.price} value={v.inverterPrice} price onChange={(n) => set({ inverterPrice: n })} />
        </div>
      </Card>

      <Card icon={<Battery className="size-4" />} title={t.battery} head="bg-indigo-400" total={v.batteryPrice}>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t.sizeKwh} value={batteryKwh} changed={v.batteryKwh !== null} onChange={(n) => pin('batteryKwh', n)} onClear={() => set({ batteryKwh: null })} />
          <Field label={t.price} value={v.batteryPrice} price onChange={(n) => set({ batteryPrice: n })} />
        </div>
      </Card>

      <Card icon={<PlugZap className="size-4" />} title={t.electricity} head="bg-emerald-200">
        <div className="grid grid-cols-2 items-start gap-2">
          <div className="space-y-2">
            <Field label={t.kwhPrice} value={v.kwhPrice} price onChange={(n) => set({ kwhPrice: n })} />
            {/* Quick picks for the common tariffs. */}
            <div className="grid grid-cols-2 gap-1.5">
              {TARIFFS.map(({ iqd, label }) => (
                <button
                  key={iqd}
                  onClick={() => set({ kwhPrice: iqd })}
                  className={cn(
                    'flex flex-col items-center rounded-lg border px-1 py-1.5 leading-tight transition-colors',
                    v.kwhPrice === iqd ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white text-neutral-900',
                  )}
                >
                  <bdi dir="ltr" className="text-sm font-semibold">{iqd} IQD</bdi>
                  <span className={cn('text-xs', v.kwhPrice === iqd ? 'text-neutral-300' : 'text-muted-foreground')}>{t[label]}</span>
                </button>
              ))}
            </div>
          </div>
          <Field label={t.monthKwh} value={monthKwh} changed={v.monthKwh !== null} onChange={(n) => pin('monthKwh', n)} onClear={() => set({ monthKwh: null })} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-base">
          <span className="text-muted-foreground">{t.monthSpend}</span>
          <span className="text-end">
            <bdi dir="ltr" className="block font-semibold">{money(monthIqd)} IQD</bdi>
            <bdi dir="ltr" className="block text-sm text-muted-foreground">{usd(monthUsd)}</bdi>
          </span>
        </div>
      </Card>

      <Card icon={<ArrowLeftRight className="size-4" />} title={t.exchange} head="bg-neutral-200">
        <Field label={t.exchangeHint} value={v.exchange} changed={v.exchange !== DEFAULT_ROI.exchange} onChange={(n) => set({ exchange: n })} onClear={() => set({ exchange: DEFAULT_ROI.exchange })} />
      </Card>

      <section className="rounded-3xl bg-neutral-900 p-5 text-white">
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <TrendingUp className="size-4" />
          {t.breakEven}
        </div>
        {months === null ? (
          <p className="mt-2 text-base text-neutral-300">{t.breakEvenEmpty}</p>
        ) : (
          <p className="mt-1 text-3xl font-bold">{t.duration(Math.floor(Math.round(months) / 12), Math.round(months) % 12)}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
          <Total label={t.totalCost} main={usd(totalUsd)} sub={`${money(totalUsd * v.exchange)} IQD`} />
          <Total label={t.monthlySaving} main={usd(monthUsd)} sub={`${money(monthIqd)} IQD`} />
        </div>
      </section>
    </div>
  )
}

function Total({ label, main, sub }: { label: string; main: string; sub: string }) {
  return (
    <div>
      <div className="text-sm text-neutral-400">{label}</div>
      <bdi dir="ltr" className="block text-xl font-semibold">{main}</bdi>
      <bdi dir="ltr" className="block text-sm text-neutral-400">{sub}</bdi>
    </div>
  )
}

function Card({ icon, title, head, total, children }: { icon: ReactNode; title: string; head: string; total?: number; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className={cn('flex items-center gap-1.5 px-4 py-2 text-base font-medium text-neutral-900', head)}>
        {icon}
        <span className="flex-1">{title}</span>
        {total !== undefined && total > 0 && <bdi dir="ltr" className="font-semibold">{usd(total)}</bdi>}
      </div>
      <div className="p-3">{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  changed = false,
  integer = false,
  price = false,
  onClear,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  /** Dark grey when it no longer matches the Home page, like the equipment settings. */
  changed?: boolean
  integer?: boolean
  /** Prices start empty and may be 0. */
  price?: boolean
  /** Emptying the field goes back to the Home value. */
  onClear?: () => void
}) {
  return (
    <div className="flex flex-col justify-end gap-1">
      <Label className="text-sm leading-tight font-normal text-muted-foreground">{label}</Label>
      <NumberInput
        className={cn('bg-neutral-100 border-transparent', changed && 'bg-neutral-700 text-white')}
        value={value}
        integer={integer}
        allowZero={price}
        placeholder={price ? '0' : undefined}
        onChange={onChange}
        onClear={onClear}
      />
    </div>
  )
}
