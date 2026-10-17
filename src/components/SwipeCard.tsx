import { useRef, useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

const REVEAL = 88 // width of the Delete button behind the card

// Swipe left to reveal Delete; swipe most of the way to delete at once.
// Gestures starting inside [data-no-swipe] (e.g. sliders) are ignored, and vertical drags scroll.
export function SwipeCard({ onDelete, children }: { onDelete: () => void; children: ReactNode }) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ x: number; y: number; base: number; mode: 'none' | 'x' | 'y' } | null>(null)
  const swallowClick = useRef(false)

  const remove = () => {
    setOffset(-(ref.current?.offsetWidth ?? 400))
    setTimeout(onDelete, 180)
  }

  return (
    <div ref={ref} className="relative touch-pan-y overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex justify-end rounded-2xl bg-destructive">
        <button
          aria-label="Delete appliance"
          className="flex items-center justify-center gap-1 text-sm font-medium text-white"
          style={{ width: REVEAL }}
          onClick={remove}
        >
          <Trash2 className="size-4" /> Delete
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
