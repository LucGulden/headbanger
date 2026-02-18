import { useEffect } from 'react'

export function useAnimFade(deps: unknown[] = []) {
  useEffect(() => {
    const elements = document.querySelectorAll('.anim-fade:not(.is-visible)')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = (entry.target as HTMLElement).dataset.delay ?? '0'
            ;(entry.target as HTMLElement).style.transitionDelay = `${Number(delay) * 0.12}s`
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, deps)
}
