'use client'

import MainNavigation, { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { FC } from 'react'

export const HeaderNavigation: FC = () => {
  const t = useTranslations('header')

  const pathname = usePathname()
  const items: MainNavigationProps.Item[] = [
    {
      isActive: pathname === '/',
      linkProps: {
        href: '/',
        target: '_self',
      },
      text: t('home'),
    },
    {
      isActive: pathname === '/faq',
      linkProps: {
        href: '/faq',
        target: '_self',
      },
      text: t('faq'),
    },
  ]
  return <MainNavigation items={items} />
}
