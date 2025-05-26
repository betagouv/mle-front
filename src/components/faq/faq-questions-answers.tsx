import { fr } from '@codegouvfr/react-dsfr'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import { FAQ_CONTENTS } from '~/app/(utils-pages)/faq/page'
import { TFaqQuestionsAnswers } from '~/schemas/faq/faq-questions-answers'
import styles from './faq-questions-answers.module.css'

export const FaqQuestionsAnswers = ({ contents = FAQ_CONTENTS }: { contents?: TFaqQuestionsAnswers[] }) => {
  return (
    <div className={styles.accordionContainer}>
      <div className={fr.cx('fr-accordions-group')}>
        {contents.map((content, index) => (
          <Accordion key={index} label={content.question}>
            {content.answer}
          </Accordion>
        ))}
      </div>
    </div>
  )
}
