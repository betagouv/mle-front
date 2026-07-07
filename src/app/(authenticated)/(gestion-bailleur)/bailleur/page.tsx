import { redirect } from 'next/navigation'
import { buildHref } from '~/utils/preserve-query-params'

export default async function BailleurPage({ searchParams }: { searchParams: Promise<{ ownerId?: string }> }) {
  redirect(buildHref('/bailleur/tableau-de-bord', await searchParams))
}
