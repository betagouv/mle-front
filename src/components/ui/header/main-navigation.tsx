'use client'

import { fr } from '@codegouvfr/react-dsfr/fr'
import type { RegisteredLinkProps } from '@codegouvfr/react-dsfr/link'
import { Menu } from '@codegouvfr/react-dsfr/MainNavigation/Menu'
import { cx } from '@codegouvfr/react-dsfr/tools/cx'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { MegaMenu, type TMegaMenuCategory, type TMegaMenuCategoryTag, type TMegaMenuLeader } from '~/components/ui/header/mega-menu'

/**
 * Reprise du MainNavigation du DSFR.
 *
 * Le composant d'origine importe son MegaMenu en dur : impossible d'y injecter le nôtre, qui
 * rend le niveau de titre des catégories paramétrable (cf. mega-menu.tsx et le critère RGAA 9.1).
 * Cette reprise se limite donc à ce branchement — la structure, les classes et les identifiants
 * générés sont identiques, et les menus simples restent délégués au composant Menu du DSFR.
 */
type TItem = {
  className?: string
  text: ReactNode
  isActive?: boolean
  linkProps?: RegisteredLinkProps
  menuLinks?: { text: ReactNode; linkProps: RegisteredLinkProps; isActive?: boolean }[]
  megaMenu?: { leader?: TMegaMenuLeader; categories: TMegaMenuCategory[] }
  buttonProps?: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
}

type TProps = {
  id: string
  items: TItem[]
  className?: string
  style?: CSSProperties
  classes?: Partial<
    Record<'root' | 'list' | 'item' | 'link' | 'btn' | 'menuList' | 'megaMenu' | 'megaMenuLeader' | 'megaMenuCategory', string>
  >
  /** Balise des intitulés de catégorie du méga-menu, transmise telle quelle. */
  megaMenuCategoryAs?: TMegaMenuCategoryTag
  /** Intitulés à fournir traduits, le composant n'embarque pas de dictionnaire. */
  ariaLabel: string
  megaMenuCloseLabel: string
}

export const MainNavigation = ({
  id,
  items,
  className,
  style,
  classes = {},
  megaMenuCategoryAs,
  ariaLabel,
  megaMenuCloseLabel,
}: TProps) => {
  const getMenuId = (index: number) => `${id}-menu-${index}`

  return (
    <nav id={id} className={cx(fr.cx('fr-nav'), classes.root, className)} style={style} role="navigation" aria-label={ariaLabel}>
      <ul className={cx(fr.cx('fr-nav__list'), classes.list)}>
        {items.map(({ className: itemClassName, text, isActive = false, linkProps, menuLinks = [], megaMenu, buttonProps = {} }, index) => (
          <li key={index} className={cx(fr.cx('fr-nav__item'), classes.item, itemClassName)}>
            {linkProps !== undefined ? (
              <Link
                {...linkProps}
                id={linkProps.id ?? `${id}-link-${index}`}
                className={cx(fr.cx('fr-nav__link'), classes.link, linkProps.className)}
                {...(isActive ? { 'aria-current': 'page' as const } : {})}
              >
                {text}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  {...buttonProps}
                  id={buttonProps.id ?? `${id}-button-${index}`}
                  className={cx(fr.cx('fr-nav__btn'), buttonProps.className, classes.btn)}
                  aria-expanded={false}
                  aria-controls={getMenuId(index)}
                  {...(isActive ? { 'aria-current': true } : {})}
                >
                  {text}
                </button>
                {menuLinks.length !== 0 && (
                  <Menu
                    classes={{ root: cx(fr.cx('fr-collapse'), classes.root), list: classes.menuList }}
                    links={menuLinks}
                    id={getMenuId(index)}
                  />
                )}
                {megaMenu !== undefined && (
                  <MegaMenu
                    classes={{
                      root: cx(fr.cx('fr-collapse'), classes.megaMenu),
                      leader: classes.megaMenuLeader,
                      category: classes.megaMenuCategory,
                      list: classes.menuList,
                    }}
                    id={getMenuId(index)}
                    leader={megaMenu.leader}
                    categories={megaMenu.categories}
                    as={megaMenuCategoryAs}
                    closeLabel={megaMenuCloseLabel}
                  />
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
