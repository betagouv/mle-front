'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { FC, useEffect, useRef } from 'react'

interface AidesSimplifiesSimulatorProps {
  onHeightChange?: (height: number) => void
}

const AidesSimplifiesSimulator: FC<AidesSimplifiesSimulatorProps> = ({ onHeightChange }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = process.env.NEXT_PUBLIC_AIDES_SIMPLIFIEES_IFRAME_URL ?? ''

    const container = containerRef.current
    if (container) {
      container.appendChild(script)
    }

    // Create a MutationObserver to watch for height changes
    const observer = new MutationObserver(() => {
      if (container && onHeightChange) {
        onHeightChange(container.offsetHeight)
      }
    })

    if (container) {
      observer.observe(container, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      })
    }

    return () => {
      if (container) {
        container.removeChild(script)
        observer.disconnect()
      }
    }
  }, [onHeightChange])

  return <div ref={containerRef} id="simulator-container" />
}

export default AidesSimplifiesSimulator
