import Footer, { type FooterProps } from '@codegouvfr/react-dsfr/Footer'
import { getTranslations } from 'next-intl/server'
import styles from './footer.module.css'

export const FooterComponent = async () => {
  const t = await getTranslations('footer')

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

  const linkList: NonNullable<FooterProps['linkList']> = [
    {
      categoryName: t('linkList.departmentsCategoryName'),
      links: [
        {
          linkProps: {
            href: '#',
          },
          text: 'Lien de navigation',
        },
      ],
    },
    {
      categoryName: t('linkList.citiesCategoryName'),
      links: [
        {
          linkProps: {
            href: '#',
          },
          text: 'Lien de navigation',
        },
      ],
    },
  ]

  return (
    <Footer
      classes={{
        logo: styles.logo,
      }}
      accessibility="fully compliant"
      linkList={linkList}
      contentDescription={
        <>
          Mon logement étudiant
          <br />
          Simplifier l&apos;accès aux droits et logements étudiants
        </>
      }
      operatorLogo={operatorLogo}
      partnersLogos={partnersLogos}
    />
  )
}
