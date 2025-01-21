'use client'

import { tss } from 'tss-react'
import { FC, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { usePathname } from 'next/navigation'
import { RegisteredLinkProps } from '@codegouvfr/react-dsfr/link'

type DynamicBreadcrumbProps = {
  color?: string
  margin?: boolean
  title?: string
}

export const DynamicBreadcrumb: FC<DynamicBreadcrumbProps> = ({ color, margin = true, title }) => {
  const pathname = usePathname()
  const t = useTranslations()
  const { classes } = useStyles({ color, margin })

  const getCurrentPageDetails = () => {
    let currentPageLabel = t('breadcrumbs.home')
    const segments: {
      label: ReactNode
      linkProps: RegisteredLinkProps
    }[] = []
    switch (pathname) {
      case '/faq':
        currentPageLabel = t('breadcrumbs.faq')
        break
      case '/trouver-un-logement-etudiant':
        currentPageLabel = t('breadcrumbs.findAccomodation')
        break
      case '/preparer-sa-vie-etudiante':
        currentPageLabel = t('breadcrumbs.prepareStudentLife')
        break
      case pathname.match(/^\/preparer-sa-vie-etudiante\/[a-zA-Z0-9-]+$/)?.input:
        currentPageLabel = t('breadcrumbs.prepareStudentLifeTitle', { title })
        segments.push({
          label: t('breadcrumbs.prepareStudentLife'),
          linkProps: {
            href: `/preparer-sa-vie-etudiante/`,
          },
        })
        break
      case pathname.match(/^\/logement\/[a-zA-Z0-9-]+$/)?.input:
        currentPageLabel = t('breadcrumbs.logement', { title })
        break
    }
    return { currentPageLabel, segments }
  }

  const { currentPageLabel, segments } = getCurrentPageDetails()

  return (
    <div className={classes.breadcrumb}>
      <Breadcrumb
        className={classes.breadcrumb}
        currentPageLabel={currentPageLabel}
        homeLinkProps={{
          href: '/',
        }}
        segments={segments}
      />
    </div>
  )
}
const useStyles = tss.withParams<{ color?: string; margin?: boolean }>().create(({ color, margin }) => ({
  breadcrumb: {
    ...(!margin
      ? {
          '& .fr-breadcrumb': {
            margin: 0,
          },
        }
      : {}),
    '& .fr-breadcrumb__link': {
      color: color ? `${color} !important` : undefined,
    },
    color: color ?? undefined,
    marginTop: 0,
    paddingTop: '1rem',
  },
}))
