import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook to detect if scrolling is happening outside of a specific element
 * @param {React.RefObject<HTMLElement>} excludedElementRef - Ref of the element to exclude from scroll detection
 * @param {number} scrollEndDelay - Delay in ms to consider scrolling ended (default: 150ms)
 * @returns {boolean} - Returns true if scrolling is happening outside the excluded element
 */
export const useScroll = (excludedElementRef: React.RefObject<HTMLElement>, scrollEndDelay = 150) => {
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = (event: Event) => {
      // If we don't have a valid ref yet, consider all scrolling as outside
      if (!excludedElementRef?.current) {
        setIsScrolling(true)
        resetScrollTimer()
        return
      }

      // Check if the event target is the excluded element or a child of it
      const isScrollingInExcludedElement = event.target instanceof Node && excludedElementRef.current.contains(event.target)

      // If scrolling is not in the excluded element, set state to true
      if (!isScrollingInExcludedElement) {
        setIsScrolling(true)
        resetScrollTimer()
      }
    }

    const resetScrollTimer = () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }

      scrollTimer.current = setTimeout(() => {
        setIsScrolling(false)
      }, scrollEndDelay)
    }

    window.addEventListener('scroll', handleScroll, true) // true for capture phase to detect all scroll events

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }
    }
  }, [excludedElementRef, scrollEndDelay])

  return isScrolling
}
