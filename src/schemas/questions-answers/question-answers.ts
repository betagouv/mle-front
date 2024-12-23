import { z } from 'zod'

export const ZQuestionAnswers = z.object({
  content_fr: z.string(),
  content_type: z.number(),
  id: z.number(),
  object_id: z.number(),
  territory: z.string(),
  title_fr: z.string(),
})

export const ZGetQuestionsAnswersResponse = z.array(ZQuestionAnswers)

export type TGetQuestionsAnswersResponse = z.infer<typeof ZGetQuestionsAnswersResponse>
