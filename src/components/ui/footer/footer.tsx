import Footer, { type FooterProps } from '@codegouvfr/react-dsfr/Footer'
import { getTranslations } from 'next-intl/server'
import styles from './footer.module.css'
import { BrandTop } from '~/components/brand-top'
import { getPopularCities } from '~/server-only/get-popular-cities'

export const FooterComponent = async () => {
  const t = await getTranslations()
  const popularCities = await getPopularCities()

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

  const linkList = [
    {
      categoryName: t('footer.linkList.citiesCategoryName'),
      links: popularCities.map((city) => ({
        linkProps: {
          href: `/trouver-un-logement-etudiant/ville/${city.name}`,
        },
        text: `Logement étudiants ${city.name}`,
      })),
    },
  ]

  return (
    <Footer
      classes={{
        logo: styles.logo,
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
