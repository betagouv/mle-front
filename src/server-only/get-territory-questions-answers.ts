import { TGetQuestionsAnswersResponse } from '~/schemas/questions-answers/question-answers'

export const getTerritoryQuestionsAnswers = async (searchParams?: { content_type?: string; object_id?: number }) => {
  const params = new URLSearchParams()
  const franceQaPromise = fetch(`${process.env.API_URL}/questions-answers/by-territory?content_type=country&object_id=1`, {
    next: { revalidate: 60 * 60 * 24, tags: ['qa'] },
  })
  if (searchParams?.object_id) params.append('object_id', String(searchParams.object_id))
  if (searchParams?.content_type) params.append('content_type', searchParams.content_type)
  const specificQaPromise = fetch(`${process.env.API_URL}/questions-answers/by-territory?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 24, tags: ['qa'] },
  })

  const [franceQa, specificQa] = await Promise.all([franceQaPromise, specificQaPromise])

  if (!franceQa.ok) {
    throw new Error('Error occurred calling API while retrieving questions answers for france')
  }
  const franceQaData = await franceQa.json()
  const specificQaData = await specificQa.json()

  if (specificQaData.length > 0) {
    return specificQaData as TGetQuestionsAnswersResponse
  }
  return franceQaData as TGetQuestionsAnswersResponse
}
