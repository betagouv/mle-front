'use client'

import MainNavigation, { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { FC } from 'react'

export const HeaderNavigation: FC = () => {
  const t = useTranslations('navigation')

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
      isActive: pathname === '/preparer-mon-budget',
      linkProps: {
        href: '/preparer-mon-budget',
        target: '_self',
      },
      text: t('prepareBudget'),
    },
    {
      isActive: pathname === '/trouver-un-logement-etudiant',
      linkProps: {
        href: '/trouver-un-logement-etudiant',
        target: '_self',
      },
      text: t('findAccommodation'),
    },
    {
      isActive: pathname === '/par-academies',
      linkProps: {
        href: '/par-academies',
        target: '_self',
      },
      text: t('byAcademies'),
    },
  ]
  return <MainNavigation items={items} />
}
