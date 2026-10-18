import { useState, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/NumberInput'
import type { Results, Settings } from '@/lib/calc'
import { useBorsaRate } from '@/lib/borsa'
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
  /** IQD for $100; null follows the live Borsa Alam rate. */
  usdRate: number | null
}

export const DEFAULT_ROI: RoiInputs = {
  panelWatts: null,
  panelCount: null,
  panelPrice: 0,
  inverterKw: null,
  inverterPrice: 0,
  batteryKwh: null,
  batteryPrice: 0,
  // Residential tariff, preselected.
  kwhPrice: 72,
  monthKwh: null,
  usdRate: null,
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
  const [view, setView] = useState<'equipment' | 'electricity'>('equipment')
  const { quote, failed } = useBorsaRate()
  // Typed rate, else live Borsa, else 1,500 IQD per dollar (150,000 for $100).
  const rate100 = v.usdRate ?? quote?.rate100 ?? 150000
  const perUsd = rate100 / 100

  // What the Home page says you need.
  const home = {
    panelCount: r.panelCount,
    inverterKw: round2(r.inverterKw),
    batteryKwh: round2(r.batteryKwh),
    monthKwh: round2(((r.dayWh + r.nightWh) / 1000) * 30),
  }
  const panelWatts = v.panelWatts ?? settings.panelWatts
  const panelCount = v.panelCount ?? home.panelCount
  const inverterKw = v.inverterKw ?? home.inverterKw
  const batteryKwh = v.batteryKwh ?? home.batteryKwh
  const monthKwh = v.monthKwh ?? home.monthKwh
  // Typing the Home value back un-pins the field so it follows Home again.
  const pin = <K extends keyof typeof home>(k: K, n: number) => set({ [k]: n === home[k] ? null : n })

  const panelsCost = panelCount * v.panelPrice
  const totalUsd = panelsCost + v.inverterPrice + v.batteryPrice
  const monthIqd = monthKwh * v.kwhPrice
  const monthUsd = monthIqd / perUsd
  const months = totalUsd > 0 && monthUsd > 0 ? totalUsd / monthUsd : null

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border bg-card p-4">
        <div className="text-sm text-muted-foreground">{t.breakEven}</div>
        {months === null ? (
          <p className="mt-1 text-base text-muted-foreground">{t.breakEvenEmpty}</p>
        ) : (
          <>
            <p className="text-3xl font-bold">{t.duration(Math.floor(Math.round(months) / 12), Math.round(months) % 12)}</p>
            <PaybackChart months={months} totalUsd={totalUsd} />
          </>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
          <Total label={t.totalCost} main={usd(totalUsd)} sub={`${money(totalUsd * perUsd)} IQD`} />
          <Total label={t.monthlySaving} main={usd(monthUsd)} sub={`${money(monthIqd)} IQD`} />
        </div>
      </section>

      <div className="grid grid-cols-2 rounded-xl bg-neutral-100 p-1 text-base font-semibold">
        {(['equipment', 'electricity'] as const).map((id) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn('rounded-lg py-2.5 transition-colors', view === id ? 'bg-white shadow-sm' : 'text-muted-foreground')}
          >
            {t[id]}
          </button>
        ))}
      </div>

      {view === 'equipment' ? (
        <section className="divide-y overflow-hidden rounded-2xl border bg-card">
          <Row bar="bg-amber-300" title={t.solar} sub={`${panelWatts} W${panelsCost > 0 ? ` · ${usd(panelsCost)}` : ''}`}>
            <Field small label={t.qty} value={panelCount} changed={v.panelCount !== null} integer onChange={(n) => pin('panelCount', n)} onClear={() => set({ panelCount: null })} />
            <Field className="w-24 shrink-0" label={t.priceEach} value={v.panelPrice} price onChange={(n) => set({ panelPrice: n })} />
          </Row>
          <Row bar="bg-neutral-400" title={t.inverter} sub="kW">
            <Field small label={t.size} value={inverterKw} changed={v.inverterKw !== null} onChange={(n) => pin('inverterKw', n)} onClear={() => set({ inverterKw: null })} />
            <Field className="w-24 shrink-0" label={t.price} value={v.inverterPrice} price onChange={(n) => set({ inverterPrice: n })} />
          </Row>
          <Row bar="bg-indigo-400" title={t.battery} sub="kWh">
            <Field small label={t.size} value={batteryKwh} changed={v.batteryKwh !== null} onChange={(n) => pin('batteryKwh', n)} onClear={() => set({ batteryKwh: null })} />
            <Field className="w-24 shrink-0" label={t.price} value={v.batteryPrice} price onChange={(n) => set({ batteryPrice: n })} />
          </Row>
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border bg-card p-3">
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
          {/* Kurdistan's official Runaki tariff calculator, to check the kWh price. */}
          <a
            href="https://runaki.gov.krd/calculator/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-2 active:underline"
          >
            <ExternalLink className="size-4 shrink-0" />
            {t.runakiLink}
          </a>
          {/* Laid out like Wasl: $100 bill = live Borsa rate (tap to use it) above your own rate. */}
          <div className="space-y-1.5 border-t pt-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2">
              <span className="col-span-2 text-base font-medium">{t.exchange}</span>
              <a href="https://borsa-alam.com/" target="_blank" rel="noopener noreferrer" className="text-center text-xs font-medium text-amber-600 underline-offset-2 active:underline">
                {t.borsaRate}
              </a>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-x-2 gap-y-1.5">
              <div className="relative row-span-2 aspect-[446/195] w-full overflow-hidden rounded-xl shadow-sm">
                <img
                  src={`${import.meta.env.BASE_URL}hundred-dollar-bill.png`}
                  alt={t.usdBillAlt}
                  decoding="async"
                  className="absolute inset-0 size-full object-fill"
                />
              </div>
              <span className="row-span-2 flex items-center self-stretch px-0.5 text-base font-medium text-muted-foreground">=</span>
              <button
                onClick={() => set({ usdRate: null })}
                className="flex h-11 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-2 text-amber-600 active:bg-amber-100"
              >
                {quote ? (
                  <bdi dir="ltr" className="text-xl leading-none font-semibold tabular-nums">{money(quote.rate100)}</bdi>
                ) : (
                  <span className="text-sm">{failed ? t.rateFailed : t.loading}</span>
                )}
              </button>
              <NumberInput
                aria-label={t.yourRate}
                className={cn(
                  'h-11 rounded-xl px-2 text-center text-xl font-semibold tabular-nums',
                  v.usdRate !== null && 'border-neutral-700 bg-neutral-700 text-white',
                )}
                integer
                thousands
                value={rate100}
                onChange={(n) => set({ usdRate: quote && n === quote.rate100 ? null : n })}
                onClear={() => set({ usdRate: null })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3 text-base">
            <span className="text-muted-foreground">{t.monthSpend}</span>
            <span className="text-end">
              <bdi dir="ltr" className="block font-semibold">{money(monthIqd)} IQD</bdi>
              <bdi dir="ltr" className="block text-sm text-muted-foreground">{usd(monthUsd)}</bdi>
            </span>
          </div>
        </section>
      )}
    </div>
  )
}

// Savings add up month by month against the equipment cost, over the panels' 25-year lifetime.
// The axis is fixed, so where the break-even dot lands shows whether the system is worth it.
const LIFETIME_YEARS = 25

function PaybackChart({ months, totalUsd }: { months: number; totalUsd: number }) {
  const { t } = useI18n()
  const W = 360
  const top = 12
  const bottom = 150
  const span = LIFETIME_YEARS * 12
  const savedAtEnd = (totalUsd / months) * span
  const yMax = Math.max(savedAtEnd, totalUsd) * 1.08
  const x = (m: number) => (m / span) * W
  const y = (usdValue: number) => bottom - (usdValue / yMax) * (bottom - top)
  const costY = y(totalUsd)
  const endY = y(savedAtEnd)
  const paysOff = months <= span
  const bx = x(months)
  // Keep the labels clear of the dot: cost on the other half, break-even above when the line sits low.
  const costRight = paysOff && bx < W / 2
  const labelAbove = costY > bottom - 40
  const flip = bx > W * 0.6
  const ticks = Array.from({ length: LIFETIME_YEARS / 5 + 1 }, (_, i) => i * 5)
  return (
    <>
      <svg style={{ direction: 'ltr' }} viewBox={`0 0 ${W} 172`} className="mt-3 w-full overflow-visible" aria-hidden="true">
        <polygon points={`0,${bottom} ${W},${endY} ${W},${bottom}`} className={paysOff ? 'fill-emerald-100' : 'fill-red-100'} />
        <line x1={0} y1={costY} x2={W} y2={costY} className="stroke-neutral-900" strokeWidth={2} strokeDasharray="5 5" />
        <text x={costRight ? W - 4 : 4} y={costY - 8} textAnchor={costRight ? 'end' : 'start'} fontSize={12} className="fill-neutral-600">
          {t.cost} {usd(totalUsd)}
        </text>
        <line x1={0} y1={bottom} x2={W} y2={endY} className={paysOff ? 'stroke-emerald-600' : 'stroke-red-500'} strokeWidth={3} strokeLinecap="round" />
        {paysOff && (
          <>
            <circle cx={bx} cy={costY} r={7} className="fill-emerald-600 stroke-white" strokeWidth={3} />
            <text
              x={bx + (flip ? -12 : 12)}
              y={labelAbove ? costY - 12 : costY + 24}
              textAnchor={flip ? 'end' : 'start'}
              fontSize={12}
              fontWeight={700}
              className="fill-emerald-700"
            >
              {t.breakEvenPoint}
            </text>
          </>
        )}
        <line x1={0} y1={bottom} x2={W} y2={bottom} className="stroke-neutral-200" />
        {ticks.map((yr) => (
          <text key={yr} x={x(yr * 12)} y={168} fontSize={11} textAnchor={yr === 0 ? 'start' : yr === LIFETIME_YEARS ? 'end' : 'middle'} className="fill-neutral-400">
            {yr === 0 ? '0' : t.yearsShort(yr)}
          </text>
        ))}
      </svg>
      {!paysOff && <p className="mt-2 text-sm font-medium text-red-600">{t.noPayback}</p>}
    </>
  )
}

function Total({ label, main, sub }: { label: string; main: string; sub: string }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <bdi dir="ltr" className="block text-xl font-semibold">{main}</bdi>
      <bdi dir="ltr" className="block text-sm text-muted-foreground">{sub}</bdi>
    </div>
  )
}

function Row({ bar, title, sub, children }: { bar: string; title: string; sub: string; children: ReactNode }) {
  return (
    <div className="flex items-end gap-2.5 p-3">
      <span className={cn('mb-0.5 h-10 w-2.5 shrink-0 self-center rounded-full', bar)} />
      <span className="min-w-0 flex-1 self-center">
        <span className="block text-base font-semibold">{title}</span>
        <bdi dir="ltr" className="block truncate text-sm text-muted-foreground">{sub}</bdi>
      </span>
      {children}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  changed = false,
  integer = false,
  price = false,
  small = false,
  onClear,
  className,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  /** Dark grey when it no longer matches the Home page, like the equipment settings. */
  changed?: boolean
  integer?: boolean
  /** Prices start empty and may be 0. */
  price?: boolean
  /** Narrow field for a quantity or size inside an equipment row. */
  small?: boolean
  /** Emptying the field goes back to the Home value. */
  onClear?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col justify-end gap-1', small && 'w-16 shrink-0', className)}>
      <Label className="text-sm leading-tight font-normal text-muted-foreground">{label}</Label>
      <NumberInput
        className={cn('border-transparent bg-neutral-100 px-2.5', changed && 'bg-neutral-700 text-white')}
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
