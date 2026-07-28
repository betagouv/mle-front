import Button from '@codegouvfr/react-dsfr/Button'
import Card from '@codegouvfr/react-dsfr/Card'
import clsx from 'clsx'
import { getTranslations } from 'next-intl/server'
import { getLatestWordpressPosts } from '~/server/services/wordpress-posts'
import styles from './news.module.css'

export const NewsSection = async () => {
  const tHome = await getTranslations('home')
  const tA11y = await getTranslations('accessibility')
  const posts = await getLatestWordpressPosts({ limit: 3 })

  return (
    <section className="fr-container fr-py-4w fr-py-md-8w">
      <div className={clsx('fr-flex fr-direction-column', styles.newsSectionHeader)}>
        <h2 className="fr-h2 fr-mb-0">{tHome('news.title')}</h2>
        <p className={styles.newsHeaderDescription}>{tHome('news.description')}</p>
      </div>
      <div
        className={clsx(
          'fr-flex fr-direction-column fr-direction-md-row fr-justify-content-space-between fr-flex-gap-4v fr-mb-4w',
          styles.newsCards,
        )}
      >
        {posts.map((post) => {
          const commonCardProps = {
            background: true,
            border: true,
            classes: {
              root: styles.newsCard,
              body: styles.newsCardBody,
              content: styles.newsCardContent,
              desc: styles.newsCardDesc,
            },
            desc: post.excerpt,
            enlargeLink: true,
            linkProps: {
              href: post.link,
              target: '_blank' as const,
              rel: 'noopener noreferrer',
              title: tA11y('linkNewWindow', { label: post.title }),
            },
            size: 'medium' as const,
            title: post.title,
            titleAs: 'h3' as const,
          } as const

          return (
            <div key={post.id} className={clsx('fr-col-12 fr-col-md-4', styles.newsCardColumn)}>
              {post.imageUrl ? (
                <Card {...commonCardProps} imageUrl={post.imageUrl} imageAlt={post.imageAlt || ''} />
              ) : (
                <Card {...commonCardProps} />
              )}
            </div>
          )
        })}
      </div>
      <div className="fr-flex fr-justify-content-center fr-mt-4w">
        <Button
          priority="secondary"
          linkProps={{
            href: 'https://info.monlogementetudiant.beta.gouv.fr/category/conseils-pratiques/',
            title: tA11y('linkNewWindow', { label: tHome('news.moreButton') }),
          }}
          iconPosition="right"
          iconId="ri-arrow-right-line"
        >
          {tHome('news.moreButton')}
        </Button>
      </div>
    </section>
  )
}
