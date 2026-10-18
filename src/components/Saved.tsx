import { useState, type ReactNode } from 'react'
import { Bookmark, ChevronRight, House, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SwipeCard } from '@/components/SwipeCard'
import { roiTotal, usd, type RoiInputs } from '@/components/Roi'
import { calculate, type Appliance, type Results, type Settings } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { PRESET_HOME, PRESET_ROI } from '@/lib/savedPresets'

export type SavedHome = { id: string; name: string; savedAt: number; items: Appliance[]; settings: Settings }
export type SavedRoi = { id: string; name: string; savedAt: number; roi: RoiInputs }
export type SavedAll = { home: SavedHome[]; roi: SavedRoi[] }
export const EMPTY_SAVED: SavedAll = { home: [], roi: [] }

type Kind = keyof SavedAll

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
const date = (ms: number) => new Date(ms).toLocaleDateString('en-GB')

// Saved snapshots of the Home page (appliances + settings) and of the Investment prices.
export function Saved({
  saved,
  onSavedChange,
  items,
  settings,
  roi,
  r,
  onLoadHome,
  onLoadRoi,
}: {
  saved: SavedAll
  onSavedChange: (s: SavedAll) => void
  items: Appliance[]
  settings: Settings
  roi: RoiInputs
  r: Results
  onLoadHome: (s: SavedHome) => void
  onLoadRoi: (s: SavedRoi) => void
}) {
  const { t } = useI18n()
  const [naming, setNaming] = useState<Kind | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState<{ kind: Kind; id: string } | null>(null)
  // Renaming an existing save reuses the name window.
  const [renaming, setRenaming] = useState<string | null>(null)

  const startSave = (kind: Kind) => {
    setRenaming(null)
    setName(t.setupName(saved[kind].length + 1))
    setNaming(kind)
  }
  const startRename = (kind: Kind, id: string) => {
    setRenaming(id)
    setName(saved[kind].find((s) => s.id === id)?.name ?? '')
    setNaming(kind)
  }
  const confirmSave = () => {
    if (!naming) return
    if (renaming) {
      const next = name.trim()
      if (next)
        onSavedChange({
          ...saved,
          [naming]: saved[naming].map((s) => (s.id === renaming ? { ...s, name: next } : s)),
        } as SavedAll)
      setNaming(null)
      return
    }
    const base = { id: newId(), name: name.trim() || t.setupName(saved[naming].length + 1), savedAt: Date.now() }
    // Newest first.
    if (naming === 'home') onSavedChange({ ...saved, home: [{ ...base, items, settings }, ...saved.home] })
    else onSavedChange({ ...saved, roi: [{ ...base, roi }, ...saved.roi] })
    setNaming(null)
  }
  const remove = (kind: Kind, id: string) =>
    onSavedChange({ ...saved, [kind]: saved[kind].filter((s) => s.id !== id) } as SavedAll)

  // Built-in presets come first, then the user's own saves.
  const homeList = [...PRESET_HOME, ...saved.home]
  const roiList = [...PRESET_ROI, ...saved.roi]
  const isPreset = (id: string) => id.startsWith('preset-')
  const label = (s: { id: string; name: string }) => (isPreset(s.id) ? (t.presetSetups[s.name] ?? s.name) : s.name)
  const when = (s: { id: string; savedAt: number }) => (isPreset(s.id) ? '' : `${date(s.savedAt)} · `)

  const toLoad = loading && (loading.kind === 'home' ? homeList : roiList).find((s) => s.id === loading.id)
  const confirmLoad = () => {
    if (!loading || !toLoad) return
    if (loading.kind === 'home') onLoadHome(toLoad as SavedHome)
    else onLoadRoi(toLoad as SavedRoi)
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <Group
        icon={<House className="size-5" />}
        title={t.homeSetups}
        onSave={() => startSave('home')}
        rows={homeList.map((s) => {
          const res = calculate(s.items, s.settings)
          return {
            id: s.id,
            name: label(s),
            preset: isPreset(s.id),
            sub: `${when(s)}${t.appliancesCount(s.items.length)} · ${t.dailyKwh(((res.dayWh + res.nightWh) / 1000).toFixed(2))}`,
          }
        })}
        onOpen={(id) => setLoading({ kind: 'home', id })}
        onDelete={(id) => remove('home', id)}
        onEdit={(id) => startRename('home', id)}
      />
      <Group
        icon={<TrendingUp className="size-5" />}
        title={t.roiSetups}
        onSave={() => startSave('roi')}
        rows={roiList.map((s) => ({
          id: s.id,
          name: label(s),
          preset: isPreset(s.id),
          sub: `${when(s)}${usd(roiTotal(s.roi, r))}`,
        }))}
        onOpen={(id) => setLoading({ kind: 'roi', id })}
        onDelete={(id) => remove('roi', id)}
        onEdit={(id) => startRename('roi', id)}
      />

      <Dialog open={naming !== null} onOpenChange={(o) => !o && setNaming(null)}>
        <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] gap-3 rounded-3xl p-5 sm:max-w-[360px]">
          <DialogTitle className="text-lg font-semibold">{renaming ? t.rename : naming === 'roi' ? t.roiSetups : t.homeSetups}</DialogTitle>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              confirmSave()
            }}
          >
            <Input aria-label={t.saveName} className="h-11 border-transparent bg-neutral-100" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="h-11" onClick={() => setNaming(null)}>
                {t.cancel}
              </Button>
              <Button type="submit" className="h-11">
                {t.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={loading !== null} onOpenChange={(o) => !o && setLoading(null)}>
        <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] gap-3 rounded-3xl p-5 sm:max-w-[360px]">
          <DialogTitle className="text-lg font-semibold">{t.loadTitle(toLoad ? label(toLoad) : '')}</DialogTitle>
          <DialogDescription className="text-base text-neutral-600">
            {loading?.kind === 'roi' ? t.loadConfirmRoi : t.loadConfirmHome}
          </DialogDescription>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11" onClick={() => setLoading(null)}>
              {t.cancel}
            </Button>
            <Button className="h-11" onClick={confirmLoad}>
              {t.load}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Group({
  icon,
  title,
  onSave,
  rows,
  onOpen,
  onDelete,
  onEdit,
}: {
  icon: ReactNode
  title: string
  onSave: () => void
  rows: { id: string; name: string; sub: string; preset: boolean }[]
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  const { t } = useI18n()
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h2 className="flex-1 text-lg font-semibold">{title}</h2>
        <Button className="h-10 gap-1.5 px-4 text-base" onClick={onSave}>
          <Plus className="size-4" />
          {t.save}
        </Button>
      </div>
      {rows.length === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed p-4 text-base text-muted-foreground">
          <Bookmark className="size-4" />
          {t.nothingSaved}
        </div>
      ) : (
        rows.map((row) => {
          const card = (
            <button
              className="flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-start"
              onClick={() => onOpen(row.id)}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-base font-semibold">{row.name}</span>
                  {row.preset && (
                    <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
                      {t.presetTag}
                    </span>
                  )}
                </span>
                <span className="block truncate text-sm text-muted-foreground">{row.sub}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-neutral-400 rtl:rotate-180" />
            </button>
          )
          return row.preset ? (
            <div key={row.id}>{card}</div>
          ) : (
            <SwipeCard key={row.id} label={t.delete} onDelete={() => onDelete(row.id)} onEdit={() => onEdit(row.id)}>
              {card}
            </SwipeCard>
          )
        })
      )}
    </section>
  )
}
