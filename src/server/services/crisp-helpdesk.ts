import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'
import { z } from 'zod'
import { env } from '~/server/env'

const CrispArticleSummarySchema = z.object({
  article_id: z.string(),
  title: z.string(),
  status: z.string(),
  order: z.number(),
})

const CrispArticleDetailSchema = z.object({
  article_id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  status: z.string(),
  order: z.number(),
})

export async function getCrispFaqArticles() {
  if (!env.CRISP_BASIC_AUTH || !env.CRISP_BASE_URL) return []
  const headers = {
    Authorization: `Basic ${env.CRISP_BASIC_AUTH}`,
    'X-Crisp-Tier': 'website',
  }

  const allQuestions: z.infer<typeof CrispArticleSummarySchema>[] = []
  let page = 1
  while (true) {
    const listResponse = await fetch(`${env.CRISP_BASE_URL}/articles/${page}`, {
      headers,
      next: { revalidate: 3600 },
    })
    if (!listResponse.ok) throw new Error(`Crisp Helpdesk list failed: ${listResponse.status}`)
    const listData = await listResponse.json()
    const summariesResult = z.array(CrispArticleSummarySchema).safeParse(listData.data ?? [])
    if (!summariesResult.success || summariesResult.data.length === 0) break
    allQuestions.push(...summariesResult.data)
    page++
  }

  const published = allQuestions.filter((a) => a.status === 'published').sort((a, b) => a.order - b.order)

  const articles = await Promise.all(
    published.map(async (summary) => {
      const res = await fetch(`${env.CRISP_BASE_URL}/article/${summary.article_id}`, {
        headers,
        next: { revalidate: 3600 },
      })
      if (!res.ok) return null
      const data = await res.json()
      const detailResult = CrispArticleDetailSchema.safeParse(data.data)
      if (!detailResult.success) return null
      const html = await marked(detailResult.data.content ?? '')
      return { question: detailResult.data.title, answer: DOMPurify.sanitize(html) }
    }),
  )

  return articles.filter((a) => a !== null)
}
