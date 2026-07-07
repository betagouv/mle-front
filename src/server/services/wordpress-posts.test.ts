import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body }
}

const wpPost = {
  id: 12,
  title: { rendered: 'Demande de bourse&nbsp;: <strong>les étapes</strong>' },
  excerpt: { rendered: '<p>[vc_row]Description texte SM <em>regular</em>&hellip;</p>' },
  link: 'https://info.monlogementetudiant.beta.gouv.fr/demande-de-bourse/',
  _embedded: {
    'wp:featuredmedia': [
      {
        source_url: 'https://info.monlogementetudiant.beta.gouv.fr/wp-content/uploads/article.jpg',
        alt_text: 'Deux étudiants devant un ordinateur',
      },
    ],
  },
}

describe('wordpress posts service', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.resetModules()
  })

  it('fetches and normalizes latest WordPress posts', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([wpPost]))

    const { getLatestWordpressPosts } = await import('./wordpress-posts')
    const posts = await getLatestWordpressPosts({ limit: 3 })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://info.monlogementetudiant.beta.gouv.fr/wp-json/wp/v2/posts?per_page=3&_embed=1&orderby=date&order=desc',
    )
    expect(fetchMock.mock.calls[0][1]).toEqual({ next: { revalidate: 3600 } })
    expect(posts).toEqual([
      {
        id: 12,
        title: 'Demande de bourse : les étapes',
        excerpt: 'Description texte SM regular…',
        link: 'https://info.monlogementetudiant.beta.gouv.fr/demande-de-bourse/',
        imageUrl: 'https://info.monlogementetudiant.beta.gouv.fr/wp-content/uploads/article.jpg',
        imageAlt: 'Deux étudiants devant un ordinateur',
      },
    ])
  })

  it('supports posts without featured image', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ ...wpPost, _embedded: undefined }]))

    const { getLatestWordpressPosts } = await import('./wordpress-posts')
    const posts = await getLatestWordpressPosts()

    expect(posts[0]).toMatchObject({
      imageUrl: undefined,
      imageAlt: '',
    })
  })

  it('returns [] on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'error' }, false, 500))

    const { getLatestWordpressPosts } = await import('./wordpress-posts')

    await expect(getLatestWordpressPosts()).resolves.toEqual([])
  })

  it('returns [] on invalid JSON shape', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 12 }]))

    const { getLatestWordpressPosts } = await import('./wordpress-posts')

    await expect(getLatestWordpressPosts()).resolves.toEqual([])
  })

  it('returns [] when fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network error'))

    const { getLatestWordpressPosts } = await import('./wordpress-posts')

    await expect(getLatestWordpressPosts()).resolves.toEqual([])
  })
})
