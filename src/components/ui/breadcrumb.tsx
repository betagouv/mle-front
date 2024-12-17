'use client'

import { tss } from 'tss-react'
import { FC } from 'react'
import { useTranslations } from 'next-intl'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { usePathname } from 'next/navigation'

type DynamicBreadcrumbProps = {
  title?: string
}

export const DynamicBreadcrumb: FC<DynamicBreadcrumbProps> = ({ title }) => {
  const pathname = usePathname()
  const t = useTranslations()
  const { classes } = useStyles()

  const getCurrentPageLabel = () => {
    let currentPageLabel = t('breadcrumbs.home')
    switch (pathname) {
      case '/trouver-un-logement-etudiant':
        currentPageLabel = t('breadcrumbs.findAccomodation')
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

const useStyles = tss.create({
  breadcrumb: {
    marginTop: 0,
    paddingTop: '1rem',
  },
})
