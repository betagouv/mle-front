import Accordion from '@codegouvfr/react-dsfr/Accordion'
import { FAQ_CONTENTS } from '~/components/faq/faq-content'
import { TFaqQuestionsAnswers } from '~/schemas/faq/faq-questions-answers'
import { sanitizeEditorialHTML } from '~/utils/sanitize-editorial-html'
import styles from './faq-questions-answers.module.css'

export const FaqQuestionsAnswers = ({ contents = FAQ_CONTENTS }: { contents?: TFaqQuestionsAnswers[] }) => {
  return (
    <div className={styles.accordionContainer}>
      <div className="fr-accordions-group">
        {contents.map((content, index) => (
          <Accordion key={index} label={content.question}>
            {typeof content.answer === 'string' ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeEditorialHTML(content.answer) }} />
            ) : (
              content.answer
            )}
          </Accordion>
        ))}
      </div>
    </div>
  )
}
