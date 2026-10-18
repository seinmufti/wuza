import { Bookmark, House, TrendingUp, type LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type Tab = 'saved' | 'home' | 'roi'

// Fixed bar at the bottom of the screen. Sits inside the phone-width column on wider screens,
// and clears the home indicator on phones via the safe-area inset.
export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { t } = useI18n()
  const items: { id: Tab; label: string; Icon: LucideIcon }[] = [
    { id: 'saved', label: t.saved, Icon: Bookmark },
    { id: 'home', label: t.home, Icon: House },
    { id: 'roi', label: t.roi, Icon: TrendingUp },
  ]
  return (
    <nav
      data-bottom-nav
      dir="ltr"
      // inset-x-0 + mx-auto (not a translate) keeps the bar rock steady while phone toolbars show/hide.
      className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full grid-cols-3 border-t bg-white pb-[env(safe-area-inset-bottom)] sm:max-w-[430px]"
    >
      {items.map(({ id, label, Icon }) => {
        const active = tab === id
        return (
          <button
            key={id}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(id)}
            // Identical size, icon weight and label weight on both tabs; only the color changes.
            className="flex h-16 touch-manipulation flex-col items-center justify-center gap-1 text-sm font-medium [-webkit-tap-highlight-color:transparent] select-none active:bg-neutral-100"
          >
            <Icon className={cn('size-6 shrink-0', active ? 'text-emerald-600' : 'text-neutral-400')} strokeWidth={2} />
            <span className={active ? 'text-neutral-900' : 'text-neutral-400'}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
