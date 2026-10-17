import { useState } from 'react'
import { Input } from '@/components/ui/input'

// Keeps its own text so the field can be emptied while typing.
// Valid numbers apply live; leaving the field empty or invalid restores the last value.
export function NumberInput({
  value,
  onChange,
  allowZero = false,
}: {
  value: number
  onChange: (n: number) => void
  allowZero?: boolean
}) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)
  const valid = (n: number) => Number.isFinite(n) && (allowZero ? n >= 0 : n > 0)

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={focused ? text : String(value)}
      onFocus={() => {
        setText(String(value))
        setFocused(true)
      }}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value)
        if (e.target.value.trim() !== '' && valid(n)) onChange(n)
      }}
      onBlur={() => setFocused(false)}
    />
  )
}
