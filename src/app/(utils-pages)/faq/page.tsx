import { getTranslations } from 'next-intl/server'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import styles from './faq.module.css'
import { Tile } from '@codegouvfr/react-dsfr/Tile'
import { fr } from '@codegouvfr/react-dsfr'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import clsx from 'clsx'

export default async function Faq() {
  const t = await getTranslations('faq')

  return (
    <div className={clsx(styles.faqContainer, fr.cx('fr-container'))}>
      <DynamicBreadcrumb margin={false} />
      <h1 style={{ margin: 0 }}>{t('title')}</h1>
      <div className={styles.descriptionContainer}>
        <p style={{ margin: 0 }}>{t('subTitle')}</p>
      </div>
      <div className={styles.tilesContainer}>
        <Tile
          linkProps={{
            href: '#',
          }}
          orientation="vertical"
          small
          title="Lorem ipsum dolor consectetur"
          titleAs="h3"
        />
        <Tile
          linkProps={{
            href: '#',
          }}
          orientation="vertical"
          small
          title="Lorem ipsum dolor consectetur"
          titleAs="h3"
        />
        <Tile
          enlargeLinkOrButton
          linkProps={{
            href: '#',
          }}
          orientation="vertical"
          small
          title="Lorem ipsum dolor consectetur"
          titleAs="h3"
        />
        <Tile
          linkProps={{
            href: '#',
          }}
          orientation="vertical"
          small
          title="Lorem ipsum dolor consectetur"
          titleAs="h3"
        />
      </div>
      <div className={fr.cx('fr-py-3w')}>
        <h2>Lorem ipsum dolor consectetur</h2>
        <div className={styles.accordionContainer}>
          <div className={fr.cx('fr-accordions-group')}>
            <Accordion label="Proident aliquip nisi aliqua irure fugiat elit commodo dolore in veniam.">
              Incididunt pariatur consectetur cillum nostrud esse in est ex aute. Non proident incididunt nulla eu incididunt ipsum dolore
              aliqua tempor incididunt culpa. Ad nisi excepteur do ea adipisicing. Velit enim esse irure adipisicing esse. Cupidatat culpa
              eu qui anim.
            </Accordion>
            <Accordion label="Proident aliquip nisi aliqua irure fugiat elit commodo dolore in veniam.">
              Incididunt pariatur consectetur cillum nostrud esse in est ex aute. Non proident incididunt nulla eu incididunt ipsum dolore
              aliqua tempor incididunt culpa. Ad nisi excepteur do ea adipisicing. Velit enim esse irure adipisicing esse. Cupidatat culpa
              eu qui anim.
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}
