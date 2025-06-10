'use client'

import init from '@socialgouv/matomo-next'
import { useEffect } from 'react'

export default function Matomo() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
      init({
        url: process.env.NEXT_PUBLIC_MATOMO_URL || '',
        siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID || '',
        disableCookies: true,
      })
    }
  }, [])

  return null
}
