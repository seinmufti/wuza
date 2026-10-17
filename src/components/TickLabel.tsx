import { useI18n } from '@/lib/i18n'

// Slider tick: hour on top, am/pm underneath.
export function TickLabel({ h }: { h: number }) {
  const { time, suffix } = useI18n().clockParts(h)
  return (
    <span className="flex flex-col items-center leading-tight tabular-nums">
      <span>{time}</span>
      <span className="text-[11px] opacity-70">{suffix}</span>
    </span>
  )
}
