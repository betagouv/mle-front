'use client'

import MainNavigation, { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { TAcademyOrDepartment } from '~/schemas/territories'
import styles from './navigation.module.css'

export const HeaderNavigation: FC<{ academies: TAcademyOrDepartment[] }> = ({ academies }) => {
  const t = useTranslations('navigation')

  const pathname = usePathname()

  const splitAcademies = (academies: TAcademyOrDepartment[]) => {
    const totalAcademies = academies.length
    const itemsPerArray = Math.ceil(totalAcademies / 4)

    return [
      academies.slice(0, itemsPerArray),
      academies.slice(itemsPerArray, itemsPerArray * 2),
      academies.slice(itemsPerArray * 2, itemsPerArray * 3),
      academies.slice(itemsPerArray * 3),
    ]
  }

  const academiesColumns = splitAcademies(academies)
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
      megaMenu: {
        categories: academiesColumns.map((academyColumn) => ({
          categoryMainLink: { linkProps: { href: '/par-academies', target: '_self' }, text: '' },
          links: academyColumn.map((academy) => ({
            linkProps: { href: `/${academy.name.toLowerCase()}`, target: '_self' },
            text: academy.name,
          })),
        })),
        leader: {
          paragraph: '',
          title: 'Académies de France',
        },
      },
      text: t('byAcademies'),
    },
  ]
  return <MainNavigation classes={{ megaMenuCategory: styles.megaMenuCategory }} items={items} />
}
