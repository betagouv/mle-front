import { getQueryClient, trpc } from '~/server/trpc/server'
import { getServerSession } from '~/services/better-auth'

export const getFavorites = async () => {
  const auth = await getServerSession()
  if (!auth) {
    return {
      count: 0,
      results: [] as Awaited<ReturnType<typeof fetchFavorites>>,
    }
  }

  const favorites = await fetchFavorites()
  return {
    // `results` contient aussi les résidences suivies via une seule candidature : le compteur
    // « favoris » du tableau de bord ne doit compter que les vrais coups de cœur.
    count: favorites.filter((favorite) => favorite.isFavorite).length,
    results: favorites,
  }
}

const fetchFavorites = () => getQueryClient().fetchQuery(trpc.favorites.list.queryOptions())
