'use client'

import { startReactDsfr } from '@codegouvfr/react-dsfr/next-appdir'
import { defaultColorScheme } from './default-color-scheme'

import Link from 'next/link'

declare module '@codegouvfr/react-dsfr/next-appdir' {
  interface RegisterLink {
    Link: typeof Link
  }
}

startReactDsfr({ Link, defaultColorScheme })

export const StartDsfr = () => {
  return null
}
