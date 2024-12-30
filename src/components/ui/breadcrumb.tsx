'use client'

import { tss } from 'tss-react'
import { FC } from 'react'
import { useTranslations } from 'next-intl'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { usePathname } from 'next/navigation'

type DynamicBreadcrumbProps = {
  color?: string
  title?: string
}

export const DynamicBreadcrumb: FC<DynamicBreadcrumbProps> = ({ color, title }) => {
  const pathname = usePathname()
  const t = useTranslations()
  const { classes } = useStyles({ color })

  const getCurrentPageLabel = () => {
    let currentPageLabel = t('breadcrumbs.home')
    switch (pathname) {
      case '/trouver-un-logement-etudiant':
        currentPageLabel = t('breadcrumbs.findAccomodation')
        break
      case '/preparer-sa-vie-etudiante':
        currentPageLabel = t('breadcrumbs.prepareStudentLife')
        break
      case pathname.match(/^\/vie-etudiante\/[a-zA-Z0-9-]+$/)?.input:
        currentPageLabel = t('breadcrumbs.prepareStudentLifeTitle', { title })
        break
      case pathname.match(/^\/logement\/[a-zA-Z0-9-]+$/)?.input:
        currentPageLabel = t('breadcrumbs.logement', { title })
        break
    }
    return currentPageLabel
  }

  const currentPageLabel = getCurrentPageLabel()

  return (
    <div className={classes.breadcrumb}>
      <Breadcrumb
        className={classes.breadcrumb}
        currentPageLabel={currentPageLabel}
        homeLinkProps={{
          href: '/',
        }}
        segments={[]}
      />
    </div>
  )
}
const useStyles = tss.withParams<{ color?: string }>().create(({ color }) => ({
  breadcrumb: {
    '& .fr-breadcrumb__link': {
      color: `${color} !important` ?? undefined,
    },
    color: color ?? undefined,
    marginTop: 0,
    paddingTop: '1rem',
  },
}))
