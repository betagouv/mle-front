import type { MetadataRoute } from 'next'
import { z } from 'zod'
import { getPopularCities } from '~/server-only/get-popular-cities'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const popularCities = await getPopularCities()
  const baseUrl = z.string().parse(process.env.BASE_URL)
  const lastModified = new Date()
  const prepareStudentLifeMap: MetadataRoute.Sitemap = popularCities.map((city) => ({
    url: `${baseUrl}/preparer-sa-vie-etudiante/${city.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))
  const findStudentAccommodationMap: MetadataRoute.Sitemap = popularCities.map((city) => ({
    url: `${baseUrl}/trouver-un-logement-etudiant/ville/${city.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/simuler-mes-aides-au-logement`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/preparer-sa-vie-etudiante`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...prepareStudentLifeMap,
    {
      url: `${baseUrl}/trouver-un-logement-etudiant`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...findStudentAccommodationMap,
    {
      url: `${baseUrl}/faq`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/alerte-logement`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/plan-du-site`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/donnees-personnelles`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/gestion-des-cookies`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.1,
    },
  ]
}
