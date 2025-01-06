import { TGlobalQuestionsAnswers } from '~/schemas/questions-answers/question-answers'

export const getGlobalQuestionsAnswers = async () => {
  const response = await fetch(`${process.env.API_URL}/questions-answers/global`, {})

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving global questions answers ')
  }
  return response.json() as Promise<TGlobalQuestionsAnswers>
}
