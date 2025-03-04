'use client'

import { FC, useEffect } from 'react'

const AidesSimplifiesSimulator: FC = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = process.env.NEXT_PUBLIC_AIDES_SIMPLIFIEES_IFRAME_URL ?? ''

    const container = document.getElementById('simulator-container')
    if (container) {
      container.appendChild(script)
    }

    return () => {
      if (container) {
        container.removeChild(script)
      }
    }
  }, [])

  return <div id="simulator-container" />
}

export default AidesSimplifiesSimulator
