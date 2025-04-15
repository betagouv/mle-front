'use client'
import dynamic from 'next/dynamic'
import { MapSkeleton } from '~/components/map/map-skeleton'

const CityMap = dynamic(() => import('~/components/map/city-map').then((mod) => mod.CityMap), {
  loading: () => <MapSkeleton height={700} />,
  ssr: false,
})

const PrepareStudentLifeMap = ({ bbox }: { bbox: string }) => {
  return <CityMap bbox={bbox} />
}

export default PrepareStudentLifeMap
