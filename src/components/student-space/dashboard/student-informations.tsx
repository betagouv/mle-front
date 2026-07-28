import Card from '@codegouvfr/react-dsfr/Card'
import { getTranslations } from 'next-intl/server'
import { getLatestWordpressPosts } from '~/server/services/wordpress-posts'

export const StudentInformations = async () => {
  const t = await getTranslations('student.informations')
  const tA11y = await getTranslations('accessibility')
  const posts = await getLatestWordpressPosts({ limit: 4 })

  if (posts.length === 0) return null

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-4v fr-pt-4w fr-px-6w fr-pb-6w">
      <h2 className="fr-h4">{t('title')}</h2>
      <div className="fr-grid-row fr-grid-row--gutters">
        {posts.map((post) => {
          const commonCardProps = {
            background: true,
            border: true,
            classes: {
              root: 'fr-width-full fr-height-full',
              body: 'fr-height-full',
              content: 'fr-height-full',
              desc: 'fr-whitespace-wrap',
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
            <div key={post.id} className="fr-col-12 fr-col-md-6 fr-flex">
              {post.imageUrl ? (
                <Card {...commonCardProps} imageUrl={post.imageUrl} imageAlt={post.imageAlt} />
              ) : (
                <Card {...commonCardProps} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
