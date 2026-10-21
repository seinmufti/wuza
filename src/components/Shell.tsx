import type { ReactNode } from 'react'
import { LanguagePicker } from '@/components/LanguagePicker'

// On wider screens: a plain phone-width column, full height, centered (no device bezel).
export function Shell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
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
        {/* Extra bottom padding keeps the last content clear of a fixed nav bar. */}
        <main className={footer ? 'flex-1 space-y-4 px-4 pb-28' : 'flex-1 space-y-4 px-4 pb-8'}>{children}</main>
        {footer}
      </div>
    </div>
  )
}
