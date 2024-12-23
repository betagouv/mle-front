import { TGetQuestionsAnswersResponse } from '~/schemas/questions-answers/question-answers'

export const getQuestionsAnswers = async () => {
  const params = new URLSearchParams()
  params.append('content_type', 'country')
  params.append('object_id', '1')
  const response = await fetch(`${process.env.API_URL}/questions-answers/?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving questions answers')
  }
  const data = await response.json()

  return data as TGetQuestionsAnswersResponse
}
