import { useEffect, useMemo, useState } from 'react'
import { Appliances } from '@/components/Appliances'
import { BottomNav, type Tab } from '@/components/BottomNav'
import { Hero } from '@/components/Hero'
import { LanguagePicker } from '@/components/LanguagePicker'
import { DEFAULT_ROI, Roi, type RoiInputs } from '@/components/Roi'
import { EMPTY_SAVED, Saved, type SavedAll } from '@/components/Saved'
import { SettingsPanel } from '@/components/Settings'
import { Sunlight } from '@/components/Sunlight'
import { calculate, DEFAULT_SETTINGS, migrateAppliance,
  usageHours, type Appliance, type LegacyAppliance, type Settings } from '@/lib/calc'
import { load, loadList, save } from '@/lib/storage'

export default function App() {
  const [items, setItems] = useState<Appliance[]>(() => loadList<LegacyAppliance>('wuza.appliances').map(migrateAppliance))
  const [settings, setSettings] = useState<Settings>(() => {
    const s = load('wuza.settings', DEFAULT_SETTINGS)
    // 550 W and 250 W were earlier defaults; move saves still on one of them to the current one.
    return s.panelWatts === 550 || s.panelWatts === 250 ? { ...s, panelWatts: DEFAULT_SETTINGS.panelWatts } : s
  })

  const [roi, setRoi] = useState<RoiInputs>(() => load('wuza.roi', DEFAULT_ROI))
  const [saved, setSaved] = useState<SavedAll>(() => load('wuza.saved', EMPTY_SAVED))

  const [tab, setTab] = useState<Tab>('home')
  const switchTab = (next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => save('wuza.appliances', items), [items])
  useEffect(() => save('wuza.settings', settings), [settings])
  useEffect(() => save('wuza.roi', roi), [roi])
  useEffect(() => save('wuza.saved', saved), [saved])

  const results = useMemo(() => calculate(items, settings), [items, settings])

  // On wider screens: a plain phone-width column, full height, centered (no device bezel).
  return (
    <div className="flex min-h-svh justify-center bg-neutral-200">
      {/* The page itself scrolls (not an inner box), so tapping the phone's status bar scrolls to the top. */}
      <div className="relative flex min-h-svh w-full flex-col bg-background sm:w-[430px] sm:border-x sm:shadow-lg">
        {/* The header stays pinned; tapping it also scrolls back to the top. */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between bg-background px-5 pt-5 pb-3"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <h1 className="text-xl font-bold">Wuza</h1>
          <LanguagePicker />
        </header>
        {/* Extra bottom padding keeps the last content clear of the fixed nav bar. */}
        <main className="flex-1 space-y-4 px-4 pb-28">
          {tab === 'home' ? (
            <>
              <Hero r={results} usage={usageHours(items, settings)} />
              <Sunlight settings={settings} onChange={setSettings} />
              <SettingsPanel value={settings} onChange={setSettings} />
              <Appliances items={items} settings={settings} onChange={setItems} />
            </>
          ) : tab === 'roi' ? (
            <Roi r={results} settings={settings} value={roi} onChange={setRoi} />
          ) : (
            <Saved
              saved={saved}
              onSavedChange={setSaved}
              items={items}
              settings={settings}
              roi={roi}
              r={results}
              // Loading a snapshot replaces the current page and jumps to it.
              onLoadHome={(s) => {
                setItems(s.items.map(migrateAppliance))
                setSettings({ ...DEFAULT_SETTINGS, ...s.settings })
                switchTab('home')
              }}
              onLoadRoi={(s) => {
                // Only prices come from the setup; sizes and usage follow the current Home project.
                setRoi({
                  ...DEFAULT_ROI,
                  ...s.roi,
                  panelWatts: null,
                  panelCount: null,
                  inverterKw: null,
                  batteryKwh: null,
                  monthKwh: null,
                })
                switchTab('roi')
              }}
            />
          )}
        </main>
        <BottomNav tab={tab} onChange={switchTab} />
      </div>
    </div>
  )
}
