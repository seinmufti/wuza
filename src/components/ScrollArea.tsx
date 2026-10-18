import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// A scroll area with its own always-visible scrollbar. Phone browsers (iOS Safari in particular)
// hide native scrollbars and ignore scrollbar styling, so the thumb is drawn by hand.
export function ScrollArea({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ top: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight <= clientHeight + 1) return setThumb({ top: 0, height: 0 })
      const height = Math.max(24, (clientHeight / scrollHeight) * clientHeight)
      const top = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - height)
      setThumb({ top, height })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const resize = new ResizeObserver(update)
    resize.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      resize.disconnect()
    }
  }, [])

  return (
    <div className="relative flex min-h-0 flex-1">
      <div ref={ref} className={cn('min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
        {children}
      </div>
      {thumb.height > 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-y-1 end-1 w-1.5 rounded-full bg-black/5">
          <div className="absolute inset-x-0 rounded-full bg-black/40" style={{ top: thumb.top, height: thumb.height }} />
        </div>
      )}
    </div>
  )
}
