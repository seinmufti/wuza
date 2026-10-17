import { useEffect, useMemo, useState } from 'react'
import { Appliances } from '@/components/Appliances'
import { Hero } from '@/components/Hero'
import { SettingsPanel } from '@/components/Settings'
import { Sunlight } from '@/components/Sunlight'
import { calculate, DEFAULT_SETTINGS, migrateAppliance,
  usageHours, type Appliance, type LegacyAppliance, type Settings } from '@/lib/calc'
import { load, loadList, save } from '@/lib/storage'

export default function App() {
  const [items, setItems] = useState<Appliance[]>(() => loadList<LegacyAppliance>('wuza.appliances').map(migrateAppliance))
  const [settings, setSettings] = useState<Settings>(() => {
    const s = load('wuza.settings', DEFAULT_SETTINGS)
    // 550 W was the old default; move saves that never changed it to the new one.
    return s.panelWatts === 550 ? { ...s, panelWatts: DEFAULT_SETTINGS.panelWatts } : s
  })

  useEffect(() => save('wuza.appliances', items), [items])
  useEffect(() => save('wuza.settings', settings), [settings])

  const results = useMemo(() => calculate(items, settings), [items, settings])

  // On wider screens: a plain phone-width column, full height, centered (no device bezel).
  return (
    <div className="flex min-h-svh justify-center bg-neutral-200">
      <div className="relative flex h-svh w-full flex-col overflow-hidden bg-background sm:w-[430px] sm:border-x sm:shadow-lg">
        <header className="px-5 pt-5 pb-3">
          <h1 className="text-xl font-bold">Wuza</h1>
        </header>
        <main className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
          <Hero r={results} usage={usageHours(items, settings)} />
          <Sunlight settings={settings} onChange={setSettings} />
          <SettingsPanel value={settings} onChange={setSettings} />
          <Appliances items={items} settings={settings} onChange={setItems} />
        </main>
      </div>
    </div>
  )
}
