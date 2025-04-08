import { fr } from '@codegouvfr/react-dsfr'
import Badge from '@codegouvfr/react-dsfr/Badge'
import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import compteur from '~/images/compteur.png'
import logoCrous from '~/images/logo-crous.svg'
import styles from './prepare-student-life-stats.module.css'
interface PrepareStudentLifeStatsProps {
  average_rent: number
  location: string
  nb_total_apartments: number
}

export default function PrepareStudentLifeStats({ average_rent, location, nb_total_apartments }: PrepareStudentLifeStatsProps) {
  const locationAids = ['Aides nationales', 'Aides régionales', 'Aides départementales', 'Aides de la ville']

  return (
    <div className={styles.mainContainer}>
      <div className={fr.cx('fr-container', 'fr-py-6w', 'fr-col-md-12')}>
        <div className={styles.cardsContainer}>
          <h1 className={styles.title}>Se loger à {location}</h1>
          <div className={styles.cardContainer}>
            <div className={fr.cx('fr-col-md-4')}>
              <div className={styles.card}>
                <h4>
                  {nb_total_apartments} logements étudiants <br /> sur la ville de {location}
                </h4>
                <p style={{ margin: 0 }}>soit 7% des logements de la ville</p>
                <div className={styles.divider}></div>
                <p>3 bailleurs sociaux à {location}</p>
                <div className={styles.logosContainer}>
                  <Image src={logoCrous.src} alt="Crous" width={40} height={40} />
                  <Image src={logoCrous.src} alt="Crous" width={40} height={40} />
                  <Image src={logoCrous.src} alt="Crous" width={40} height={40} />
                </div>
              </div>
            </div>
            <div className={fr.cx('fr-col-md-8')} style={{ textAlign: 'center' }}>
              <div className={clsx(styles.card, styles.marginLeft)}>
                <div className={styles.counterContainer}>
                  <div>
                    <h4>Facilité à trouver un logement</h4>
                    <Image src={compteur.src} alt="compteur" quality={100} width={142} height={72} />
                    <h4>Facile</h4>
                    <p>
                      <span className={fr.cx('fr-text--bold')}>3 semaines</span> en moyenne pour trouver un logement étudiant à {location}
                    </p>
                  </div>
                  <div>
                    <h4>Budget des locataires</h4>
                    <Image src={compteur.src} alt="compteur" quality={100} width={142} height={72} />
                    <h4>Équilibré</h4>
                    <p>Le budget des étudiants locataires à Créteil est équilibré.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.cardContainer}>
            <div className={fr.cx('fr-col-md-8')}>
              <div className={styles.priceContainer}>
                <h3 style={{ margin: 0 }}>Prix moyen des loyers étudiants à {location}</h3>
                <div className={styles.studioColocContainer}>
                  <div className={styles.studioColocBorderBottom}>
                    <div className={styles.studioColocItemsContainer}>
                      <div className={styles.studioColocItem}>
                        <span
                          className={fr.cx('ri-user-line', 'fr-text--bold')}
                          style={{ color: fr.colors.decisions.text.mention.grey.default }}
                        >
                          STUDIO
                        </span>
                        <div>
                          <span
                            style={{
                              backgroundColor: fr.colors.options.yellowTournesol._950_100.default,
                              borderRadius: '4px',
                              color: fr.colors.options.yellowTournesol.sun407moon922.default,
                              padding: '0 0.5rem',
                            }}
                            className={fr.cx('fr-text--bold')}
                          >
                            294.98 €
                          </span>
                        </div>
                        <div>
                          <Link href="#" className={fr.cx('fr-link')}>
                            {/* TODO -reset margin right on ::before {' '} */}
                            <span className={fr.cx('fr-icon-arrow-right-line')}>Consulter les 34 offres</span>
                          </Link>
                        </div>
                      </div>
                      <div style={{ borderLeft: '1px solid #ddd' }}></div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          justifyContent: 'start',
                        }}
                      >
                        <span
                          className={fr.cx('ri-user-line', 'fr-text--bold')}
                          style={{ color: fr.colors.decisions.text.mention.grey.default }}
                        >
                          CHAMBRE EN COLOCATION
                        </span>
                        <div>
                          <span
                            style={{
                              backgroundColor: fr.colors.options.yellowTournesol._950_100.default,
                              borderRadius: '4px',
                              color: fr.colors.options.yellowTournesol.sun407moon922.default,
                              padding: '0 0.5rem',
                            }}
                            className={fr.cx('fr-text--bold')}
                          >
                            219 €
                          </span>
                        </div>
                        <div>
                          <Link href="#" className={fr.cx('fr-link')}>
                            {/* TODO -reset margin right on ::before Consulter les 42 offres{' '} */}
                            <span className={fr.cx('fr-icon-arrow-right-line')}>Consulter les 42 offres</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.warrantyContainer}>
                    <span className={fr.cx('ri-information-line')}>
                      Prévoir un dépôt de garantie ainsi que le versement d&apos;un premier loyer
                    </span>
                  </div>
                </div>
                <p style={{ margin: 0 }}>
                  <span className={fr.cx('ri-thumb-up-line')}>
                    Un <span className={fr.cx('fr-text--bold')}>plafonnement des loyers est en vigueur à {location}</span> afin de limiter
                    les abus
                  </span>
                </p>
              </div>
            </div>
            <div className={fr.cx('fr-col-md-4')}>
              <div className={clsx(styles.card, styles.helpersMainContainer, styles.marginLeft)}>
                <div className={styles.helpersContainer}>
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M70 68.9996C69.4486 68.9996 69 68.551 69 67.9996C69 67.4482 69.4486 66.9996 70 66.9996C70.5514 66.9996 71 67.4482 71 67.9996C71 68.551 70.5514 68.9996 70 68.9996Z"
                      fill="#CACAFB"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M68 12.9996C67.4486 12.9996 67 12.551 67 11.9996C67 11.4482 67.4486 10.9996 68 10.9996C68.5514 10.9996 69 11.4482 69 11.9996C69 12.551 68.5514 12.9996 68 12.9996Z"
                      fill="#CACAFB"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M14 68.9996C13.4486 68.9996 13 68.551 13 67.9996C13 67.4482 13.4486 66.9996 14 66.9996C14.5514 66.9996 15 67.4482 15 67.9996C15 68.551 14.5514 68.9996 14 68.9996Z"
                      fill="#CACAFB"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M19.3966 12.0059C19.5956 12.0017 19.7968 11.9996 20 11.9996L20.3032 12.0012C20.4038 12.0022 20.5039 12.0038 20.6034 12.0059L21.1937 12.0246L21.7694 12.0558C22.0534 12.0746 22.3314 12.098 22.6026 12.126L23.1355 12.1884C26.014 12.5654 28 13.5062 28 14.9996V20.9996C28 21.5519 27.5523 21.9996 27 21.9996C26.4872 21.9996 26.0645 21.6136 26.0067 21.1163L26 20.9996V17.1257C25.2189 17.4372 24.2433 17.6658 23.1355 17.8109L22.6026 17.8732C22.3314 17.9013 22.0534 17.9247 21.7694 17.9434L21.1937 17.9746L20.6034 17.9934C20.4044 17.9976 20.2032 17.9996 20 17.9996C19.7968 17.9996 19.5956 17.9976 19.3966 17.9934L18.8063 17.9746L18.2306 17.9434C17.9466 17.9247 17.6686 17.9013 17.3974 17.8732L16.8645 17.8109C13.986 17.4339 12 16.4931 12 14.9996C12 13.5062 13.986 12.5654 16.8645 12.1884L17.3974 12.126C17.6686 12.098 17.9466 12.0746 18.2306 12.0558L18.8063 12.0246L19.3966 12.0059ZM26 14.9996L25.9782 14.9856C25.7511 14.857 25.4307 14.7267 25.0337 14.6063L24.8288 14.5469C23.5811 14.2018 21.8536 13.9996 20.0005 13.9996C18.1474 13.9996 16.4199 14.2018 15.1722 14.5469C14.7501 14.6637 14.4018 14.7923 14.1441 14.9212L14 14.9996L14.1702 15.0909C14.3811 15.194 14.6497 15.2967 14.9674 15.393L15.1722 15.4523C16.4199 15.7975 18.1474 15.9996 20.0005 15.9996C21.8536 15.9996 23.5811 15.7975 24.8288 15.4523C25.2509 15.3356 25.5992 15.2069 25.8569 15.078L26 14.9996Z"
                      fill="#8C8CD9"
                    />
                    <path
                      d="M59.7317 49.8036C58.67
                        23 48.6589 57.2227 47.9996 55.6751 47.9996C53.2002 47.9996 51.1014 49.6719 50.3231 51.9996H49L48.8834 52.0064C48.386 52.0641 48 52.4868 48 52.9996C48 53.5519 48.4477 53.9996 49 53.9996H50C50 54.3402 50.0269 54.6743 50.0785 54.9996H49L48.8834 55.0064C48.386 55.0641 48 55.4868 48 55.9996C48 56.5519 48.4477 56.9996 49 56.9996H50.7594C51.7396 58.7915 53.5715 59.9996 55.6751 59.9996C57.087 59.9996 58.4199 59.4513 59.4512 58.4788C59.846 58.1066 59.874 57.4741 59.5138 57.0661C59.1535 56.6581 58.5414 56.6292 58.1466 57.0014C57.4673 57.6419 56.5979 57.9996 55.6751 57.9996C54.7284 57.9996 53.8618 57.6224 53.2017 56.9996H55L55.1166 56.9929C55.614 56.9351 56 56.5125 56 55.9996C56 55.4473 55.5523 54.9996 55 54.9996H52.0532C51.9764 54.6802 51.9355 54.3451 51.9355 53.9996H55L55.1166 53.9929C55.614 53.9351 56 53.5125 56 52.9996C56 52.4473 55.5523 51.9996 55 51.9996H52.4356C53.0832 50.8025 54.2939 49.9996 55.6751 49.9996C56.6867 49.9996 57.6335 50.4302 58.3329 51.1859C58.7023 51.585 59.3148 51.5991 59.7011 51.2174C60.0874 50.8357 60.1011 50.2027 59.7317 49.8036Z"
                      fill="#8C8CD9"
                    />
                    <path
                      d="M13 19.9996C13.5128 19.9996 13.9355 20.3506 13.9933 20.8027L14 20.9087V39.0905C14 39.5926 13.5523 39.9996 13 39.9996C12.4872 39.9996 12.0645 39.6487 12.0067 39.1966L12 39.0905V20.9087C12 20.4066 12.4477 19.9996 13 19.9996Z"
                      fill="#8C8CD9"
                    />
                    <path
                      d="M13 43.9996C13.5523 43.9996 14 43.5519 14 42.9996C14 42.4473 13.5523 41.9996 13 41.9996C12.4477 41.9996 12 42.4473 12 42.9996C12 43.5519 12.4477 43.9996 13 43.9996Z"
                      fill="#8C8CD9"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M60 27.9996C59.7968 27.9996 59.5956 28.0017 59.3966 28.0059L58.8063 28.0246L58.2306 28.0558C57.9466 28.0746 57.6686 28.098 57.3974 28.126L56.8645 28.1884C53.986 28.5654 52 29.5062 52 30.9996C52 32.4931 53.986 33.4339 56.8645 33.8109L57.3974 33.8732C57.6686 33.9013 57.9466 33.9247 58.2306 33.9434L58.8063 33.9746L59.3966 33.9934C59.5956 33.9975 59.7968 33.9996 60 33.9996C60.2032 33.9996 60.4044 33.9975 60.6034 33.9934L61.1937 33.9746L61.7694 33.9434C62.0534 33.9247 62.3314 33.9013 62.6026 33.8732L63.1355 33.8109C64.2433 33.6658 65.2189 33.4372 66 33.1257V36.9996L66.0067 37.1163C66.0645 37.6136 66.4872 37.9996 67 37.9996C67.5523 37.9996 68 37.5519 68 36.9996V30.9996C68 29.5062 66.014 28.5654 63.1355 28.1884L62.6026 28.126C62.3314 28.098 62.0534 28.0746 61.7694 28.0558L61.1937 28.0246L60.6034 28.0059C60.5039 28.0038 60.4038 28.0022 60.3032 28.0012L60 27.9996ZM65.8569 31.078L66 30.9996L65.9782 30.9856C65.7511 30.857 65.4307 30.7267 65.0337 30.6063L64.8288 30.5469C63.5811 30.2018 61.8536 29.9996 60.0005 29.9996C58.1474 29.9996 56.4199 30.2018 55.1722 30.5469C54.7501 30.6637 54.4018 30.7923 54.1441 30.9212L54 30.9996L54.1702 31.0909C54.3811 31.194 54.6497 31.2967 54.9674 31.393L55.1722 31.4523C56.4199 31.7975 58.1474 31.9996 60.0005 31.9996C61.8536 31.9996 63.5811 31.7975 64.8288 31.4523C65.2509 31.3356 65.5992 31.2069 65.8569 31.078Z"
                      fill="#8C8CD9"
                    />
                    <path
                      d="M53.9933 34.883C53.9355 34.3857 53.5128 33.9996 53 33.9996C52.4477 33.9996 52 34.4473 52 34.9996V38.9996L52.0067 39.1163C52.0645 39.6136 52.4872 39.9996 53 39.9996C53.5523 39.9996 54 39.5519 54 38.9996V34.9996L53.9933 34.883Z"
                      fill="#8C8CD9"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M36.662 21.9996L35.994 22.0116C35.8836 22.0146 35.7737 22.0181 35.6643 22.0221L35.0142 22.0519L34.3775 22.0935C34.0627 22.1171 33.7533 22.1452 33.45 22.1775L32.8516 22.2477C32.7533 22.2604 32.6557 22.2735 32.5588 22.2871L31.9868 22.3743C28.4228 22.9615 26 24.2166 26 25.9989V30.5713L26.0049 30.7195C26.0073 30.7558 26.0106 30.7919 26.0147 30.8279C26.005 30.8837 26 30.9411 26 30.9997V35.5713L26.0049 35.7195C26.0073 35.7558 26.0106 35.7919 26.0147 35.8279C26.005 35.8837 26 35.9411 26 35.9997V40.5713L26.0049 40.7195C26.0073 40.7556 26.0105 40.7916 26.0146 40.8273C26.005 40.883 26 40.9403 26 40.9988V45.5704L26.0049 45.7186C26.0141 45.8588 26.0365 45.9961 26.0715 46.1305C25.9231 46.1172 25.7734 46.1048 25.6225 46.0935L24.9858 46.0519L24.3357 46.0221C24.2263 46.0181 24.1164 46.0146 24.006 46.0117L23.338 45.9996H22.662L21.994 46.0117C21.8836 46.0146 21.7737 46.0181 21.6643 46.0221L21.0142 46.0519L20.3775 46.0935C20.0627 46.1171 19.7533 46.1452 19.45 46.1775L18.8516 46.2477C18.7533 46.2604 18.6557 46.2735 18.5588 46.2871L17.9868 46.3743C14.4228 46.9615 12 48.2166 12 49.9989V54.5707L12.0049 54.7189C12.0073 54.7552 12.0106 54.7914 12.0147 54.8274C12.005 54.8832 12 54.9406 12 54.9993V59.5708L12.0049 59.7191C12.1345 61.6815 14.838 63.0853 18.6512 63.6813L19.2313 63.7646C19.4273 63.7904 19.6259 63.814 19.8269 63.8356L20.437 63.8941C21.2597 63.9638 22.1179 63.9996 23 63.9996C23.8821 63.9996 24.7403 63.9638 25.563 63.8941L26.1731 63.8356C26.3741 63.814 26.5727 63.7904 26.7687 63.7646L27.3488 63.6813C31.0866 63.0971 33.7582 61.7367 33.9844 59.8348C34.9383 59.9436 35.9343 59.9996 36.9499 59.9996C39.4401 59.9996 42.4907 59.6813 44.184 59.2033C46.1223 63.2247 50.2371 65.9996 55 65.9996C61.6274 65.9996 67 60.6269 67 53.9992C67 47.3716 61.6274 41.9988 55 41.9988C52.3876 41.9988 49.9702 42.8336 48 44.251V40.9988L47.9933 40.8822C47.9922 40.8728 47.991 40.8636 47.9896 40.8543C47.9883 40.8453 47.9869 40.8363 47.9854 40.8273C47.9951 40.743 48 40.6577 48 40.5713V35.9997L47.9933 35.883C47.9911 35.8645 47.9885 35.8461 47.9853 35.8279C47.9951 35.7434 48 35.6578 48 35.5713V30.9997L47.9933 30.883C47.9911 30.8645 47.9885 30.8461 47.9853 30.8279C47.9951 30.7434 48 30.6578 48 30.5713V25.9997C48 24.2643 45.703 23.028 42.2922 22.422L41.7295 22.3293C41.5388 22.3003 41.345 22.2731 41.1484 22.2477L40.55 22.1775C40.2467 22.1452 39.9373 22.1171 39.6225 22.0935L38.9858 22.0519L38.3357 22.0221C38.2263 22.0181 38.1164 22.0146 38.006 22.0116L37.338 21.9996H36.662ZM44.0601 49.0604C43.2475 49.3184 42.3353 49.5266 41.3488 49.6808L40.7687 49.7641C40.5727 49.7899 40.3741 49.8136 40.1731 49.8352L39.563 49.8937C38.7403 49.9633 37.8821 49.9991 37 49.9991C36.1179 49.9991 35.2597 49.9633 34.437 49.8937L33.9944 49.8512C33.9981 49.9 34 49.9492 34 49.9989V52.5926C34.9538 52.7113 35.96 52.7729 36.99 52.7729C39.0254 52.7729 41.4511 52.5393 43.137 52.1801C43.3036 51.0845 43.6183 50.0376 44.0601 49.0604ZM43.009 54.4672C41.235 54.7975 38.9505 54.9996 36.99 54.9996C35.9608 54.9996 34.9516 54.9421 33.9858 54.8305L33.9889 54.8498L33.9916 54.8691L33.9933 54.8826L34 54.9993V57.6048C34.9418 57.7204 35.9342 57.7803 36.9499 57.7803C39.1511 57.7803 41.8479 57.5121 43.4115 57.1265C43.182 56.2739 43.0441 55.3837 43.009 54.4672ZM28 30.5713V28.4452C28.9631 28.933 30.2311 29.3134 31.7078 29.5757L32.2705 29.6685C32.4612 29.6975 32.655 29.7247 32.8516 29.75L33.45 29.8203C33.7533 29.8526 34.0627 29.8806 34.3775 29.9043L35.0142 29.9458L35.6643 29.9756C35.7737 29.9796 35.8836 29.9831 35.994 29.9861L36.662 29.9981C36.7742 29.9991 36.8869 29.9996 37 29.9996L37.338 29.9981L38.006 29.9861C38.1164 29.9831 38.2263 29.9796 38.3357 29.9756L38.9858 29.9458L39.6225 29.9043C39.9373 29.8806 40.2467 29.8526 40.55 29.8203L41.1484 29.75C41.2467 29.7374 41.3443 29.7242 41.4412 29.7106L42.0132 29.6235C43.6094 29.3605 44.9767 28.9635 46 28.4452V30.5713L45.993 30.6324C45.9138 30.9915 45.1613 31.5647 43.7467 32.0497C41.9954 32.6502 39.584 32.9999 37 32.9999C34.416 32.9999 32.0046 32.6502 30.2533 32.0497C28.7555 31.5362 28 30.9238 28 30.5713ZM28.7727 26.6716C28.2764 26.4376 28 26.2039 28 26C28 25.7961 28.2764 25.5625 28.7727 25.3285L29.0389 25.2116C29.1336 25.1727 29.2341 25.1339 29.3402 25.0954L29.6749 24.9809C29.7919 24.943 29.9143 24.9056 30.0417 24.8687L30.4387 24.7597C30.5073 24.7419 30.5772 24.7242 30.6481 24.7067L31.0878 24.6041C31.2389 24.5707 31.3943 24.5382 31.5539 24.5067L32.0449 24.4154L32.5591 24.331C32.6467 24.3175 32.7352 24.3044 32.8245 24.2916L33.3708 24.2191L33.9364 24.1554L34.5198 24.1015C34.7171 24.0853 34.917 24.0708 35.1194 24.0582L35.7337 24.0262L36.3611 24.0064C36.4667 24.0042 36.5727 24.0025 36.6792 24.0013L37 23.9996C37.2147 23.9996 37.4278 24.0019 37.6389 24.0064L38.2663 24.0262L38.8806 24.0582C39.083 24.0708 39.2829 24.0853 39.4802 24.1015L40.0636 24.1554L40.6292 24.2191L41.1755 24.2916L41.7008 24.3723C41.7865 24.3864 41.8713 24.4008 41.9551 24.4154L42.4461 24.5067C42.5259 24.5225 42.6046 24.5385 42.6823 24.5547L43.1354 24.6548C43.282 24.689 43.424 24.724 43.5613 24.7597L43.9583 24.8687C44.022 24.8871 44.0845 24.9057 44.1456 24.9244L44.4965 25.0379C44.664 25.0952 44.8191 25.1532 44.9611 25.2116L45.2273 25.3285C45.7236 25.5625 46 25.7961 46 26C46 26.2039 45.7236 26.4376 45.2273 26.6716L44.9611 26.7885C44.8664 26.8273 44.7659 26.8661 44.6598 26.9046L44.3251 27.0192C44.2081 27.057 44.0857 27.0944 43.9583 27.1313L43.5613 27.2403C43.4927 27.2581 43.4228 27.2758 43.3519 27.2933L42.9122 27.3959C42.7611 27.4293 42.6057 27.4618 42.4461 27.4933L41.9551 27.5846L41.4409 27.669C41.3533 27.6825 41.2648 27.6956 41.1755 27.7084L40.6292 27.781L40.0636 27.8446L39.4802 27.8985C39.2829 27.9148 39.083 27.9293 38.8806 27.9419L38.2663 27.9738L37.6389 27.9936C37.4278 27.9981 37.2147 28.0004 37 28.0004C36.7853 28.0004 36.5722 27.9981 36.3611 27.9936L35.7337 27.9738L35.1194 27.9419C34.917 27.9293 34.7171 27.9148 34.5198 27.8985L33.9364 27.8446L33.3708 27.781L32.8245 27.7084L32.2992 27.6277C32.2135 27.6136 32.1287 27.5993 32.0449 27.5846L31.5539 27.4933C31.4741 27.4776 31.3954 27.4616 31.3177 27.4453L30.8646 27.3452C30.718 27.311 30.576 27.276 30.4387 27.2403L30.0417 27.1313C29.978 27.1129 29.9155 27.0943 29.8544 27.0756L29.5035 26.9621C29.336 26.9048 29.1809 26.8468 29.0389 26.7885L28.7727 26.6716ZM28 35.5713V33.2433C29.1647 33.8988 30.7734 34.3882 32.6512 34.6817L33.2313 34.765C33.4273 34.7908 33.6259 34.8144 33.8269 34.836L34.437 34.8946C35.2597 34.9642 36.1179 35 37 35C37.8821 35 38.7403 34.9642 39.563 34.8946L40.1731 34.836C40.3741 34.8144 40.5727 34.7908 40.7687 34.765L41.3488 34.6817C43.2266 34.3882 44.8353 33.8988 46 33.2433V35.5713L45.993 35.6324C45.9138 35.9915 45.1613 36.5647 43.7467 37.0497C41.9954 37.6502 39.584 37.9999 37 37.9999C34.416 37.9999 32.0046 37.6502 30.2533 37.0497C28.7555 36.5362 28 35.9238 28 35.5713ZM32 57.2427C30.8353 57.8983 29.2266 58.3876 27.3488 58.6811L26.7687 58.7645C26.5727 58.7902 26.3741 58.8139 26.1731 58.8355L25.563 58.894C24.7403 58.9636 23.8821 58.9994 23 58.9994C22.1179 58.9994 21.2597 58.9636 20.437 58.894L19.8269 58.8355C19.6259 58.8139 19.4273 58.7902 19.2313 58.7645L18.6512 58.6811C16.7734 58.3876 15.1647 57.8983 14 57.2427V59.5708C14 59.9234 14.7555 60.5358 16.2533 61.0493C18.0046 61.6498 20.416 61.9995 23 61.9995C25.584 61.9995 27.9954 61.6498 29.7467 61.0493C31.1613 60.5643 31.9138 59.9911 31.993 59.6319L32 59.5708V57.2427ZM28 38.2433C29.1647 38.8988 30.7734 39.3882 32.6512 39.6817L33.2313 39.765C33.4273 39.7908 33.6259 39.8144 33.8269 39.836L34.437 39.8946C35.2597 39.9642 36.1179 40 37 40C37.8821 40 38.7403 39.9642 39.563 39.8946L40.1731 39.836C40.3741 39.8144 40.5727 39.7908 40.7687 39.765L41.3488 39.6817C43.2266 39.3882 44.8353 38.8988 46 38.2433V40.5713L45.993 40.6324C45.9138 40.9915 45.1613 41.5647 43.7467 42.0497C41.9954 42.6502 39.584 42.9999 37 42.9999C34.416 42.9999 32.0046 42.6502 30.2533 42.0497C28.7555 41.5362 28 40.9238 28 40.5713V38.2433ZM46 45.5704V43.2433C44.8353 43.8988 43.2266 44.3882 41.3488 44.6817L40.7687 44.765C40.5727 44.7908 40.3741 44.8144 40.1731 44.836L39.563 44.8946C38.7403 44.9642 37.8821 45 37 45C36.1179 45 35.2597 44.9642 34.437 44.8946L33.8269 44.836C33.6259 44.8144 33.4273 44.7908 33.2313 44.765L32.6512 44.6817C30.7734 44.3882 29.1647 43.8988 28 43.2433V45.5704C28 45.8224 28.386 46.2072 29.1534 46.5937C30.2099 46.8289 31.1345 47.131 31.8851 47.4956C33.3812 47.819 35.1462 47.999 37 47.999C39.584 47.999 41.9954 47.6493 43.7467 47.0488C45.1613 46.5638 45.9138 45.9906 45.993 45.6315L46 45.5704ZM31.4988 49.4689C30.3806 49.2302 29.3864 48.9146 28.5615 48.5298C28.5233 48.5221 28.4848 48.5144 28.4461 48.5067L27.9551 48.4154C27.8713 48.4008 27.7865 48.3864 27.7008 48.3723L27.1755 48.2916L26.6292 48.2191L26.0636 48.1554L25.4802 48.1015C25.2829 48.0853 25.083 48.0708 24.8806 48.0582L24.2663 48.0262L23.6389 48.0064C23.4278 48.0019 23.2147 47.9996 23 47.9996L22.6792 48.0013C22.5727 48.0025 22.4667 48.0042 22.3611 48.0064L21.7337 48.0262L21.1194 48.0582C20.917 48.0708 20.7171 48.0853 20.5198 48.1015L19.9364 48.1554L19.3708 48.2191L18.8245 48.2916C18.7352 48.3044 18.6467 48.3175 18.5591 48.331L18.0449 48.4154L17.5539 48.5067C17.3943 48.5382 17.2389 48.5707 17.0878 48.6041L16.6481 48.7067C16.5772 48.7242 16.5073 48.7419 16.4387 48.7597L16.0417 48.8687C15.9143 48.9056 15.7919 48.943 15.6749 48.9809L15.3402 49.0954C15.2341 49.1339 15.1336 49.1727 15.0389 49.2116L14.7727 49.3285C14.2764 49.5625 14 49.7961 14 50C14 50.2039 14.2764 50.4376 14.7727 50.6716L15.0389 50.7885C15.1809 50.8468 15.336 50.9048 15.5035 50.9621L15.8544 51.0756C15.9155 51.0943 15.978 51.1129 16.0417 51.1313L16.4387 51.2403C16.576 51.276 16.718 51.311 16.8646 51.3452L17.3177 51.4453C17.3954 51.4616 17.4741 51.4776 17.5539 51.4933L18.0449 51.5846C18.1287 51.5993 18.2135 51.6136 18.2992 51.6277L18.8245 51.7084L19.3708 51.781L19.9364 51.8446L20.5198 51.8985C20.7171 51.9148 20.917 51.9293 21.1194 51.9419L21.7337 51.9738L22.3611 51.9936C22.5722 51.9981 22.7853 52.0004 23 52.0004C23.2147 52.0004 23.4278 51.9981 23.6389 51.9936L24.2663 51.9738L24.8806 51.9419C25.083 51.9293 25.2829 51.9148 25.4802 51.8985L26.0636 51.8446L26.6292 51.781L27.1755 51.7084C27.2648 51.6956 27.3533 51.6825 27.4409 51.669L27.9551 51.5846L28.4461 51.4933C28.6057 51.4618 28.7611 51.4293 28.9122 51.3959L29.3519 51.2933C29.4228 51.2758 29.4927 51.2581 29.5613 51.2403L29.9583 51.1313C30.0857 51.0944 30.2081 51.057 30.3251 51.0192L30.6598 50.9046C30.7659 50.8661 30.8664 50.8273 30.9611 50.7885L31.2273 50.6716C31.7236 50.4376 32 50.2039 32 50C32 49.837 31.8233 49.6549 31.4988 49.4689ZM32 54.5707V52.4452C30.9767 52.9635 29.6094 53.3605 28.0132 53.6235L27.4412 53.7106C27.3443 53.7242 27.2467 53.7374 27.1484 53.75L26.55 53.8203C26.2467 53.8526 25.9373 53.8806 25.6225 53.9043L24.9858 53.9458L24.3357 53.9756C24.2263 53.9796 24.1164 53.9831 24.006 53.9861L23.338 53.9981L23 53.9996C22.8869 53.9996 22.7742 53.9991 22.662 53.9981L21.994 53.9861C21.8836 53.9831 21.7737 53.9796 21.6643 53.9756L21.0142 53.9458L20.3775 53.9043C20.0627 53.8806 19.7533 53.8526 19.45 53.8203L18.8516 53.75C18.655 53.7247 18.4612 53.6975 18.2705 53.6685L17.7078 53.5757C16.2311 53.3134 14.9631 52.933 14 52.4452V54.5707C14 54.9232 14.7555 55.5356 16.2533 56.0491C18.0046 56.6496 20.416 56.9993 23 56.9993C25.584 56.9993 27.9954 56.6496 29.7467 56.0491C31.1613 55.5641 31.9138 54.9909 31.993 54.6318L32 54.5707ZM55 43.9989C60.5229 43.9989 65 48.4762 65 53.9992C65 59.5223 60.5229 63.9996 55 63.9996C49.4772 63.9996 45 59.5223 45 53.9992C45 48.4762 49.4772 43.9989 55 43.9989Z"
                      fill="#4C4C95"
                    />
                    <path
                      d="M61.4214 40.0929C60.9205 39.8603 60.3259 40.0778 60.0933 40.5787C59.8606 41.0796 60.0781 41.6743 60.5791 41.9069C65.0635 43.9895 68.0002 48.3546 68.0002 53.0003C68.0002 53.5526 68.448 54.0004 69.0002 54.0004C69.5525 54.0004 70.0002 53.5526 70.0002 53.0003C70.0002 47.5566 66.5954 42.4957 61.4214 40.0929Z"
                      fill="#4C4C95"
                    />
                  </svg>
                  <div>
                    <h4 style={{ margin: 0 }}>17 aides disponibles</h4>
                    <h6 style={{ margin: 0 }}>pour les étudiants résidant à {location}</h6>
                  </div>
                  <div className={styles.helpersItems}>
                    {locationAids.map((aid) => (
                      <div key={aid}>
                        <i style={{ color: '#17753C' }} className={fr.cx('ri-check-line')}></i>
                        {aid}
                      </div>
                    ))}
                  </div>
                  <Button iconId="ri-money-euro-circle-line">Simuler mes aides</Button>
                </div>
              </div>
            </div>
          </div>
          <div className={clsx(fr.cx('fr-container'), styles.costContainer)}>
            <div className={styles.costHeaderContainer}>
              <div className={styles.costHeaderTitleContainer}>
                <h3>
                  Le coût de la vie <br />
                  étudiante à {location}
                </h3>
                <p>
                  Une estimation générale des principaux postes de dépense pour un étudiant à Créteil. Les coûts peuvent varier en fonction
                  du style de vie, des aides perçues et des choix personnels.
                </p>
              </div>
              <div className={styles.budgetsMainContainer}>
                <div className={styles.budgetsContainer}>
                  <div>
                    <h5 style={{ marginBottom: '0.5rem' }}>Budget minimal</h5>
                    <p style={{ marginBottom: '0.5rem' }}>Résidence Crous, repas RU, et peu de sorties.</p>
                    <Badge noIcon severity="new">
                      Entre 600 et 800 €
                    </Badge>
                  </div>
                  <div className={fr.cx('fr-hidden', 'fr-unhidden-sm')} style={{ backgroundColor: '#DDDDDD', width: '1px' }} />
                  <div>
                    <h5 style={{ marginBottom: '0.5rem' }}>Budget confortable</h5>
                    <p style={{ marginBottom: '0.5rem' }}>Logement privé et activités diverses.</p>
                    <Badge noIcon severity="new">
                      Entre 1000 et 1200 €
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.costGridContainer}>
              <div className={clsx(styles.costGridItem, styles.borderRight, styles.borderBottom)}>
                <div className={styles.summaryCardTitle}>
                  <span className={fr.cx('ri-community-line')} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span className={fr.cx('fr-text--bold')}>Logement</span>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Prix moyen du m²</span> : {Math.round(average_rent)} €.
                  </div>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Loyer moyen pour un logement de 20m²</span> : {Math.round(average_rent * 20)} €
                    par mois.
                  </div>
                </div>
              </div>
              <div className={clsx(styles.costGridItem, styles.borderBottom)}>
                <div className={styles.summaryCardTitle}>
                  <span className={fr.cx('ri-train-line')} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span className={fr.cx('fr-text--bold')}>Transport</span>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Navigo Imagine&apos;R</span> (carte pour étudiants) : environ 38 € par mois.
                    (APL déduite)
                  </div>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Frais occasionnels</span> (covoiturage, taxis, etc.): 10-30 € par mois.
                  </div>
                </div>
              </div>
              <div className={clsx(styles.costGridItem, styles.borderRight, styles.borderBottom)}>
                <div className={styles.summaryCardTitle}>
                  <span className={fr.cx('ri-restaurant-line')} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span className={fr.cx('fr-text--bold')}>Alimentation</span>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Courses alimentaires</span> : 150-200 € par mois. (APL déduite)
                  </div>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Repas universitaires (Crous)</span> : environ 3.30 € par repas. (si pris au RU)
                  </div>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Repas à 1€ pour les étudiants boursiers et précaires.</span>
                  </div>
                </div>
              </div>
              <div className={clsx(styles.costGridItem, styles.borderBottom)}>
                <div className={styles.summaryCardTitle}>
                  <span className={fr.cx('ri-pencil-ruler-line')} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span className={fr.cx('fr-text--bold')}>Frais universitaires</span>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Frais d&apos;inscription annuels</span> : <br />
                    Licence: 170 € / Master: 243 €
                  </div>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Mutuelle santé</span> : 10-40 € par mois. (selon les besoins et le statut)
                  </div>
                </div>
              </div>
              <div className={clsx(styles.costGridItem, styles.borderRight, styles.borderBottom)}>
                <div className={styles.summaryCardTitle}>
                  <span className={fr.cx('ri-clapperboard-line')} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span className={fr.cx('fr-text--bold')}>Loisirs et sorties</span>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Sorties</span> (cinéma, bars, restaurants) : 50-100 € par mois.
                  </div>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Activités sportives ou culturelles</span> : 20-50 € par mois.
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  padding: '2rem 3rem',
                }}
              >
                <div className={styles.summaryCardTitle}>
                  <span className={fr.cx('ri-wifi-line')} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span className={fr.cx('fr-text--bold')}>Autres dépenses</span>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Internet et téléphone</span> : 20-40 € par mois.
                  </div>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Fournitures scolaires</span> : 20-30 € par mois.
                  </div>
                  <div>
                    <span className={fr.cx('fr-text--bold')}>Assurance habitation</span> : 10-20 € par mois.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
