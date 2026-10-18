import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const COLLAPSE_MS = 220
// One easing for both the height animation (CSS) and the page scroll (JS) so they move together.
const COLLAPSE_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)'
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

// Scrolls `scroller` by `delta` px over the same time and curve as the card animation.
// Returns a cancel function so a restarted animation never runs two scrolls at once.
function scrollAlong(scroller: HTMLElement, delta: number) {
  if (Math.abs(delta) < 1) return () => {}
  const start = scroller.scrollTop
  const t0 = performance.now()
  let frame = 0
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / COLLAPSE_MS)
    scroller.scrollTop = start + delta * easeOutCubic(t)
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
  return () => cancelAnimationFrame(frame)
}

// Accordion: opening grows from zero height while fading in; closing is the exact reverse.
// `center`: when opening, scroll so the whole section ends up in the middle of the screen
// (or with its header at the top if it is taller than the screen).
export function Collapse({ open, center = false, children }: { open: boolean; center?: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(open)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Start from the current height so a quick re-tap reverses smoothly mid-animation.
    const from = open ? 0 : el.getBoundingClientRect().height
    const to = open ? el.scrollHeight : 0
    el.style.overflow = 'hidden'
    el.style.transition = 'none'
    el.style.height = `${from}px`
    el.style.opacity = open ? '0' : '1'
    void el.offsetHeight // apply the start state before transitioning
    el.style.transition = `height ${COLLAPSE_MS}ms ${COLLAPSE_EASE}, opacity ${COLLAPSE_MS}ms ${COLLAPSE_EASE}`
    el.style.height = `${to}px`
    el.style.opacity = open ? '1' : '0'

    // While opening, scroll in step with the growth so the whole card ends up in view
    // (never pushing its header off the top).
    let cancelScroll = () => {}
    const scroller = document.scrollingElement as HTMLElement | null
    const card = el.closest<HTMLElement>('[data-collapse-root]')
    if (open && scroller && card) {
      const c = card.getBoundingClientRect()
      const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
      const navTop = document.querySelector('[data-bottom-nav]')?.getBoundingClientRect().top ?? window.innerHeight
      const v = { top: headerBottom, bottom: navTop }
      const room = 8
      const toHeader = c.top - v.top - room
      if (center) {
        const finalHeight = c.height + (to - from)
        const space = v.bottom - v.top
        const targetTop = finalHeight < space - 2 * room ? v.top + (space - finalHeight) / 2 : v.top + room
        cancelScroll = scrollAlong(scroller, c.top - targetTop)
      } else {
        const overflow = c.bottom + (to - from) + room - v.bottom
        cancelScroll = scrollAlong(scroller, toHeader < 0 ? toHeader : Math.max(0, Math.min(overflow, toHeader)))
      }
    }

    const timer = setTimeout(() => {
      if (open) el.style.cssText = ''
      else setMounted(false)
    }, COLLAPSE_MS)
    return () => {
      clearTimeout(timer)
      cancelScroll()
    }
  }, [open, mounted])

  if (!mounted) return null
  return <div ref={ref}>{children}</div>
}

