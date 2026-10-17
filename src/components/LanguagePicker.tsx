import { useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LANGUAGES, useI18n, type Language } from '@/lib/i18n'
import { Flag } from '@/components/Flag'
import { cn } from '@/lib/utils'

export function LanguagePicker() {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  // Switching to Arabic/Kurdish flips the whole page right-to-left, which would make the menu
  // jump mid close-animation. Close first, then apply the language once it has finished.
  const pending = useRef<Language | null>(null)

  const choose = (code: Language) => {
    pending.current = code
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (isOpen || !pending.current) return
        setLang(pending.current)
        pending.current = null
      }}
    >
      <PopoverTrigger
        aria-label={t.language}
        className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
      >
        <Globe className="size-5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 gap-1 p-2">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            aria-label={label}
            title={label}
            onClick={() => choose(code)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-3 hover:bg-muted',
              lang === code && 'bg-muted/60',
            )}
          >
            <Flag lang={code} className="h-10 w-15 rounded-[5px] shadow-[0_0_0_1px_rgb(0_0_0/0.1)]" />
            {lang === code ? <Check className="size-6" /> : <span className="size-6" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
