'use client'

import dynamic from 'next/dynamic'

import { MapSkeleton } from '~/components/map/map-skeleton'

const AccomodationMap = dynamic(() => import('~/components/map/accomodation-map').then((mod) => mod.AccomodationMap), {
  loading: () => <MapSkeleton height={400} />,
  ssr: false,
})
const AccommodationMap = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
  return <AccomodationMap center={[latitude, longitude]} />
}

export default AccommodationMap
