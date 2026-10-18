import { useRef, useState, type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const BUTTON = 88 // width of each action button behind the card

// Swipe left to reveal Delete (and Edit when given); swipe most of the way to delete at once.
// Gestures starting inside [data-no-swipe] (e.g. sliders) are ignored, and vertical drags scroll.
export function SwipeCard({
  onDelete,
  onEdit,
  label,
  children,
}: {
  onDelete: () => void
  onEdit?: () => void
  label?: string
  children: ReactNode
}) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ x: number; y: number; base: number; mode: 'none' | 'x' | 'y' } | null>(null)
  const swallowClick = useRef(false)
  const { t } = useI18n()
  const REVEAL = onEdit ? BUTTON * 2 : BUTTON

  const remove = () => {
    setOffset(-(ref.current?.offsetWidth ?? 400))
    setTimeout(onDelete, 180)
  }

  return (
    <div ref={ref} className="relative touch-pan-y overflow-hidden rounded-2xl">
      <div dir="ltr" className="absolute inset-0 flex justify-end rounded-2xl bg-destructive">
        {onEdit && (
          <button
            className="flex items-center justify-center gap-1 bg-neutral-700 text-sm font-medium text-white"
            style={{ width: BUTTON }}
            onClick={() => {
              setOffset(0)
              onEdit()
            }}
          >
            <Pencil className="size-4" /> {t.edit}
          </button>
        )}
        <button
          aria-label={label ?? t.deleteAppliance}
          className="flex items-center justify-center gap-1 text-sm font-medium text-white"
          style={{ width: BUTTON }}
          onClick={remove}
        >
          <Trash2 className="size-4" /> {t.delete}
        </button>
      </div>
      <div
        className={dragging ? '' : 'transition-transform duration-200 ease-out'}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('[data-no-swipe]')) return
          gesture.current = { x: e.clientX, y: e.clientY, base: offset, mode: 'none' }
        }}
        onPointerMove={(e) => {
          const g = gesture.current
          if (!g) return
          const dx = e.clientX - g.x
          const dy = e.clientY - g.y
          if (g.mode === 'none') {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
              g.mode = 'x'
              setDragging(true)
              e.currentTarget.setPointerCapture(e.pointerId)
            } else if (Math.abs(dy) > 8) g.mode = 'y'
          }
          if (g.mode === 'x') setOffset(Math.min(0, g.base + dx))
        }}
        onPointerUp={() => {
          const g = gesture.current
          gesture.current = null
          if (g?.mode !== 'x') return
          setDragging(false)
          swallowClick.current = true
          const width = ref.current?.offsetWidth ?? 400
          if (offset < -width * 0.55) remove()
          else setOffset(offset < -REVEAL / 2 ? -REVEAL : 0)
        }}
        onPointerCancel={() => {
          gesture.current = null
          setDragging(false)
          setOffset((o) => (o < -REVEAL / 2 ? -REVEAL : 0))
        }}
        onClickCapture={(e) => {
          // A swipe shouldn't also open the card; a tap on a swiped card just closes the swipe.
          if (swallowClick.current || offset !== 0) {
            e.preventDefault()
            e.stopPropagation()
            if (!swallowClick.current) setOffset(0)
          }
          swallowClick.current = false
        }}
      >
        {children}
      </div>
    </div>
  )
}
