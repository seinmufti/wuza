import { Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useI18n } from '@/lib/i18n'

// Tap on phones, hover on desktop.
export function InfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        aria-label={useI18n().t.moreInfo}
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" className="w-56 text-sm leading-snug">
        {text}
      </PopoverContent>
    </Popover>
  )
}
