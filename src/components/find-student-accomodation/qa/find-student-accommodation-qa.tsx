import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import styles from './find-student-accommodation-qa.module.css'
import { getTranslations } from 'next-intl/server'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import { TGetQuestionsAnswersResponse } from '~/schemas/questions-answers/question-answers'

type FindStudentAccommodationQAProps = {
  qa: TGetQuestionsAnswersResponse
}
export default async function FindStudentAccommodationQA({ qa }: FindStudentAccommodationQAProps) {
  const t = await getTranslations('findAccomodation')

  return (
    <div className={clsx(styles.mainQaFaqContainer, 'primaryBackgroundColor')}>
      <div className={fr.cx('fr-container')}>
        <div className={styles.faqQaContainer}>
          <div className={styles.faqTitleCtaContainer}>
            <h2 className={clsx(styles.whiteColor, styles.titleMargin)}>{t('faq.title')}</h2>
            <Button iconId="ri-question-line" className="whiteButton" priority="secondary">
              {t('faq.cta')}
            </Button>
          </div>
          <div className={styles.qaContainer}>
            <div style={{ background: 'white', padding: '2rem' }} className={fr.cx('fr-accordions-group')}>
              {qa.map((qa, index) => (
                <Accordion key={index} label={qa.title_fr}>
                  <div dangerouslySetInnerHTML={{ __html: qa.content_fr }} />
                </Accordion>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
