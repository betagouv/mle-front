'use client'

import { useQuery } from '@tanstack/react-query'
import type L from 'leaflet'
import { FC, useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { tss } from 'tss-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { usePathname } from 'next/navigation'
import { parseAsBoolean, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useAccomodations } from '~/hooks/use-accomodations'
import { useTRPC } from '~/server/trpc/client'

const BoundsHandler: FC<{ markerPositions: L.LatLngTuple[]; cityBounds?: L.LatLngBoundsExpression }> = ({
  markerPositions,
  cityBounds,
}) => {
  const map = useMap()
  const [queryStates, setQueryStates] = useQueryStates({
    bbox: parseAsString,
    academie: parseAsString,
    ['recherche-par-carte']: parseAsString,
  })

  useEffect(() => {
    if (queryStates.bbox) {
      const [west, south, east, north] = queryStates.bbox.split(',').map(Number)
      map.fitBounds([
        [south, west],
        [north, east],
      ])
    } else if (markerPositions.length > 0) {
      map.fitBounds(markerPositions, { padding: [20, 20] })
    } else if (cityBounds) {
      map.fitBounds(cityBounds, { padding: [50, 50] })
    } else {
      map.setView([46.5, 2.4], 6)
    }
  }, [queryStates.bbox, markerPositions, cityBounds, map])

  useMapEvents({
    dragend: (e) => {
      const bounds = e.target.getBounds()
      setQueryStates({
        bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
        academie: null,
        ['recherche-par-carte']: 'true',
      })
    },
  })

  return null
}

const CustomZoomControls: FC = () => {
  const map = useMap()
  const [, setQueryStates] = useQueryStates({
    bbox: parseAsString,
    academie: parseAsString,
    ['recherche-par-carte']: parseAsString,
  })

  const handleZoomIn = () => {
    map.zoomIn()
    const bounds = map.getBounds()
    setQueryStates({
      bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
      academie: null,
      ['recherche-par-carte']: 'true',
    })
  }

  const handleZoomOut = () => {
    map.zoomOut()
    const bounds = map.getBounds()

    setQueryStates({
      bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
      academie: null,
      ['recherche-par-carte']: 'true',
    })
  }

  return (
    <div
      className="leaflet-control-zoom leaflet-bar leaflet-control "
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
      }}
    >
      <button
        className="leaflet-control-zoom-in"
        type="button"
        title="Zoom in"
        onClick={handleZoomIn}
        style={{
          width: '30px',
          height: '30px',
          display: 'block',
          border: 'none',
          backgroundColor: 'white',
          cursor: 'pointer',
        }}
      >
        +
      </button>
      <button
        className="leaflet-control-zoom-out"
        type="button"
        title="Zoom out"
        onClick={handleZoomOut}
        style={{
          width: '30px',
          height: '30px',
          display: 'block',
          border: 'none',
          backgroundColor: 'white',
          cursor: 'pointer',
        }}
      >
        −
      </button>
    </div>
  )
}

export const AccomodationsMap: FC = () => {
  const { classes } = useStyles()
  const [queryStates, setQueryStates] = useQueryStates({
    bbox: parseAsString,
    id: parseAsString,
  })

  const pathname = usePathname()
  const [rechercheParCarte] = useQueryState('recherche-par-carte', parseAsBoolean)
  const isMapSearch = !!rechercheParCarte

  const pathSegments = pathname.split('/')
  const villeIndex = pathSegments.indexOf('ville')
  const citySlugFromPath = villeIndex !== -1 ? decodeURIComponent(pathSegments[villeIndex + 1] ?? '') || undefined : undefined
  const effectiveCitySlug = citySlugFromPath && !isMapSearch ? citySlugFromPath : undefined

  const trpc = useTRPC()
  const { data: territory } = useQuery({
    ...trpc.territories.getBySlug.queryOptions({ type: 'ville', slug: effectiveCitySlug! }),
    enabled: !!effectiveCitySlug,
  })

  const cityBounds: L.LatLngBoundsExpression | undefined = territory?.bbox
    ? [
        [territory.bbox.ymin, territory.bbox.xmin],
        [territory.bbox.ymax, territory.bbox.xmax],
      ]
    : undefined

  const { data: accommodations } = useAccomodations()

  const accommodationsData = accommodations?.results || []

  const markerPositions = useMemo<L.LatLngTuple[]>(
    () => accommodationsData.map((a) => [a.latitude ?? 0, a.longitude ?? 0]),
    [accommodationsData],
  )

  const markers = useMemo(() => {
    return accommodationsData.map((accommodation, i) => (
      <Marker
        eventHandlers={{
          click: () => {
            const element = document.getElementById(`accomodation-${accommodation.id}`)
            if (element) {
              setQueryStates({ id: accommodation.id.toString() })
              element.scrollIntoView({ behavior: 'smooth' })
            }
          },
        }}
        key={accommodation.id}
        position={markerPositions[i]}
      />
    ))
  }, [accommodationsData, markerPositions, setQueryStates])

  const memoizedMap = useMemo(() => {
    return (
      <MapContainer center={[46.5, 2.4]} zoom={6} className={classes.mapContainer} scrollWheelZoom={false} zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <BoundsHandler markerPositions={markerPositions} cityBounds={cityBounds} />
        <CustomZoomControls />
        {markers}
      </MapContainer>
    )
  }, [markers, markerPositions, cityBounds, queryStates.bbox])

  return memoizedMap
}

const useStyles = tss.create({
  mapContainer: {
    '[href]': {
      backgroundImage: 'unset !important',
    },
    width: '100%',
  },
})
