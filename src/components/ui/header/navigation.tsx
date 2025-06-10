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

  let items: MainNavigationProps.Item[] = [
    {
      isActive: pathname === '/simuler-mes-aides-au-logement',
      linkProps: {
        href: '/simuler-mes-aides-au-logement',
        target: '_self',
      },
      text: t('home'),
    },
    {
      isActive: pathname === '/preparer-mon-budget-etudiant',
      linkProps: {
        href: '/preparer-mon-budget-etudiant',
        target: '_self',
      },
      text: t('prepareBudget'),
    },
    // {
    //   isActive: pathname === '/preparer-sa-vie-etudiante',
    //   linkProps: {
    //     href: '/preparer-sa-vie-etudiante',
    //     target: '_self',
    //   },
    //   text: t('prepareStudentLife'),
    // },
    {
      isActive: pathname === '/trouver-un-logement-etudiant',
      linkProps: {
        href: '/trouver-un-logement-etudiant?vue=carte',
        target: '_self',
      },
      text: t('findAccommodation'),
    },
    {
      megaMenu: {
        categories: academiesColumns.map((academyColumn) => ({
          categoryMainLink: { linkProps: { href: '/par-academies', target: '_self' }, text: '' },
          links: academyColumn.map((academy) => ({
            linkProps: { href: `/trouver-un-logement-etudiant/academie/${academy.name}?vue=carte`, target: '_self' },
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
  if (pathname.includes('landing')) {
    items = []
  }
  return <MainNavigation classes={{ megaMenuCategory: styles.megaMenuCategory }} items={items} />
}
