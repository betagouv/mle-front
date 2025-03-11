import Footer, { type FooterProps } from '@codegouvfr/react-dsfr/Footer'
import { getTranslations } from 'next-intl/server'
import styles from './footer.module.css'
import { BrandTop } from '~/components/ui/brand-top'
import { getPopularCities } from '~/server-only/get-popular-cities'

export const FooterComponent = async () => {
  const t = await getTranslations()
  const popularCities = await getPopularCities()
  const sortedPopularCities = popularCities.sort((a, b) => b.nb_apartments - a.nb_apartments)

  const operatorLogo: NonNullable<FooterProps['operatorLogo']> = {
    alt: 'Mon logement étudiant - logo',
    imgUrl: '/images/logo.svg',
    orientation: 'horizontal',
  }

  const partnersLogos: NonNullable<FooterProps['partnersLogos']> = {
    sub: [
      {
        alt: 'Crous - logo',
        imgUrl: '/images/logo-crous.svg',
        linkProps: {
          href: 'https://www.lescrous.fr/',
          title: 'Lien vers le site du CROUS',
        },
      },
      {
        alt: 'Beta.gouv - logo',
        imgUrl: '/images/logo-beta-gouv.svg',
        linkProps: {
          href: 'https://beta.gouv.fr/',
          title: 'Lien vers le site de beta.gouv',
        },
      },
      {
        alt: "Ministère de l'Enseignement Supérieur et de la Recherche - logo",
        imgUrl: '/images/logo-parcours-sup.svg',
        linkProps: {
          href: 'https://www.enseignementsup-recherche.gouv.fr/',
          title: "Lien vers le site du ministère de l'Enseignement Supérieur et de la Recherche",
        },
      },
    ],
  }

  const ITEMS_PER_COLUMN = 8
  const linkList = [
    {
      links: sortedPopularCities.slice(0, ITEMS_PER_COLUMN).map((city) => ({
        linkProps: {
          href: `/trouver-un-logement-etudiant/ville/${city.name}?vue=carte`,
        },
        text: `Logement étudiants ${city.name}`,
      })),
    },
    {
      links: sortedPopularCities.slice(ITEMS_PER_COLUMN, ITEMS_PER_COLUMN * 2).map((city) => ({
        linkProps: {
          href: `/trouver-un-logement-etudiant/ville/${city.name}?vue=carte`,
        },
        text: `Logement étudiants ${city.name}`,
      })),
    },
    {
      links: sortedPopularCities.slice(ITEMS_PER_COLUMN * 2, ITEMS_PER_COLUMN * 3).map((city) => ({
        linkProps: {
          href: `/trouver-un-logement-etudiant/ville/${city.name}?vue=carte`,
        },
        text: `Logement étudiants ${city.name}`,
      })),
    },
    {
      links: sortedPopularCities.slice(ITEMS_PER_COLUMN * 3).map((city) => ({
        linkProps: {
          href: `/trouver-un-logement-etudiant/ville/${city.name}?vue=carte`,
        },
        text: `Logement étudiants ${city.name}`,
      })),
    },
  ]

  return (
    <Footer
      classes={{
        logo: styles.logo,
        root: styles.footer,
      }}
      brandTop={<BrandTop />}
      accessibility="partially compliant"
      linkList={linkList as NonNullable<FooterProps['linkList']>}
      homeLinkProps={{
        href: '/',
        title: t('metadata.homeLinkTitle'),
      }}
      contentDescription={
        <>
          <span style={{ fontWeight: 'bold' }}>Mon Logement Étudiant</span>
          <br />
          {t('header.description')}
        </>
      }
      operatorLogo={operatorLogo}
      partnersLogos={partnersLogos}
      termsLinkProps={{
        href: '/mentions-legales',
      }}
      accessibilityLinkProps={{
        href: '/accessibilite',
      }}
      websiteMapLinkProps={{
        href: '/plan-du-site',
      }}
    />
  )
}
