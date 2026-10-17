import { formatClock } from '@/lib/time'

// Slider tick: hour on top, am/pm underneath.
export function TickLabel({ h }: { h: number }) {
  const text = formatClock(h)
  return (
    <span className="flex flex-col items-center leading-tight tabular-nums">
      <span>{text.slice(0, -2)}</span>
      <span className="text-[11px] opacity-70">{text.slice(-2)}</span>
    </span>
  )
}
