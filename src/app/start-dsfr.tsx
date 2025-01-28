'use client'

import type { DefaultColorScheme } from '@codegouvfr/react-dsfr/next-appdir'
import { startReactDsfr } from '@codegouvfr/react-dsfr/next-appdir'
import Link from 'next/link'

declare module '@codegouvfr/react-dsfr/next-appdir' {
  interface RegisterLink {
    Link: typeof Link
  }
}

export const defaultColorScheme: DefaultColorScheme = 'light'

startReactDsfr({ Link, defaultColorScheme })

export const StartDsfr = () => {
  return null
}
