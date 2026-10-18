import { useState } from 'react'
import { Input } from '@/components/ui/input'

// Keeps its own text so the field can be emptied while typing.
// Valid numbers apply live; leaving the field empty or invalid restores the last value.
export function NumberInput({
  value,
  onChange,
  allowZero = false,
  className,
  integer = false,
  placeholder,
  onClear,
}: {
  value: number
  onChange: (n: number) => void
  allowZero?: boolean
  className?: string
  /** Whole numbers only: shows the numeric keypad (no decimal point) on phones. */
  integer?: boolean
  /** When set, a value of 0 shows as an empty field with this hint. */
  placeholder?: string
  /** Called when the field is left empty, instead of restoring the last value. */
  onClear?: () => void
}) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)
  const shown = (n: number) => (placeholder !== undefined && n === 0 ? '' : String(n))
  const valid = (n: number) => Number.isFinite(n) && (allowZero ? n >= 0 : n > 0)

  return (
    <Input
      className={className}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      placeholder={placeholder}
      value={focused ? text : shown(value)}
      onFocus={() => {
        setText(shown(value))
        setFocused(true)
      }}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value)
        if (e.target.value.trim() !== '' && valid(n)) onChange(n)
      }}
      onBlur={() => {
        setFocused(false)
        if (text.trim() === '') onClear?.()
      }}
    />
  )
}
