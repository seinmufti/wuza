import { useEffect, useMemo, useState } from 'react'
import { Appliances } from '@/components/Appliances'
import { Hero } from '@/components/Hero'
import { LanguagePicker } from '@/components/LanguagePicker'
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

  useEffect(() => save('wuza.appliances', items), [items])
  useEffect(() => save('wuza.settings', settings), [settings])

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
        <main className="flex-1 space-y-4 px-4 pb-6">
          <Hero r={results} usage={usageHours(items, settings)} />
          <Sunlight settings={settings} onChange={setSettings} />
          <SettingsPanel value={settings} onChange={setSettings} />
          <Appliances items={items} settings={settings} onChange={setItems} />
        </main>
      </div>
    </div>
  )
}
