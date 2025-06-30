'use client'

import { fr } from '@codegouvfr/react-dsfr'
import SideMenu from '@codegouvfr/react-dsfr/SideMenu'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { tss } from 'tss-react'

export const PrepareBudgetSidemenu = () => {
  const t = useTranslations('prepareBudget.sideMenu')
  const { classes } = useStyles()
  const items = [
    {
      isActive: true,
      linkProps: {
        href: '#definir-vos-ressources-mensuelles',
      },
      text: t('items.monthlyResources'),
    },
    {
      linkProps: {
        href: '#identifier-vos-charges-fixes',
      },
      text: t('items.fixedCharges'),
    },
    {
      linkProps: {
        href: '#estimer-vos-depenses-variables',
      },
      text: t('items.variableExpenses'),
    },
    {
      linkProps: {
        href: '#anticiper-les-depenses-exceptionnelles',
      },
      text: t('items.exceptionalExpenses'),
    },
    {
      linkProps: {
        href: '#aides-a-ne-pas-oublier',
      },
      text: t('items.aids'),
    },
  ]

  return (
    <div className={clsx(fr.cx('fr-col-md-4'), classes.sideMenuContainer)}>
      <SideMenu
        className={clsx(fr.cx('fr-px-4w', 'fr-py-5w'), classes.sideMenu)}
        align="left"
        classes={{
          inner: classes.innerMenu,
          title: classes.title,
        }}
        burgerMenuButtonText={t('title')}
        items={items}
        title={t('title').toUpperCase()}
      />
    </div>
  )
}

const useStyles = tss.create({
  sideMenuContainer: {
    [fr.breakpoints.down('md')]: {
      borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    },
    [fr.breakpoints.up('md')]: {
      position: 'sticky',
      top: '1rem',
      alignSelf: 'flex-start',
    },
  },
  sideMenu: {
    [fr.breakpoints.down('md')]: {
      boxShadow: 'none',
    },
    height: '100%',
  },
  innerMenu: {
    height: '100%',
  },
  title: {
    color: fr.colors.decisions.text.mention.grey.default,
    fontSize: '14px',
  },
})
