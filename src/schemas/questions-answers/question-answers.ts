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

const ZGlobalQuestionsAnswer = ZQuestionAnswers.omit({ object_id: true, territory: true })

export const ZGlobalQuestionsAnswers = z.array(ZGlobalQuestionsAnswer)
export type TGlobalQuestionsAnswers = z.infer<typeof ZGlobalQuestionsAnswers>
