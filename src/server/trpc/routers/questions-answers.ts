import { db } from '~/server/db'
import { questionsAnswers } from '~/server/db/schema/questions-answers'
import { sanitizeEditorialHTML } from '~/utils/sanitize-editorial-html'
import { baseProcedure, createTRPCRouter } from '../init'

export const questionsAnswersRouter = createTRPCRouter({
  getGlobal: baseProcedure.query(async () => {
    const results = await db
      .select({
        id: questionsAnswers.id,
        titleFr: questionsAnswers.titleFr,
        contentFr: questionsAnswers.contentFr,
        order: questionsAnswers.order,
      })
      .from(questionsAnswers)
      .orderBy(questionsAnswers.order)

    // Sanitisation à la source plutôt qu'au rendu : ce contenu est saisi hors du code et
    // injecté via dangerouslySetInnerHTML. Les titres sont exclus pour que le plan de la
    // page reste maîtrisé par le code (RGAA 9.1).
    return results.map((row) => ({
      id: row.id,
      title_fr: row.titleFr,
      content_fr: sanitizeEditorialHTML(row.contentFr ?? ''),
    }))
  }),
})
