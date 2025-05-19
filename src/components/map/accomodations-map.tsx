'use client'

import { FC, useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { tss } from 'tss-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { fr } from '@codegouvfr/react-dsfr'
import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useAccomodations } from '~/hooks/use-accomodations'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

interface AccomodationsMapProps {
  data: TGetAccomodationsResponse
}

const BoundsHandler: FC = () => {
  const map = useMap()
  const [queryBbox, setBbox] = useQueryState('bbox')

  useEffect(() => {
    if (queryBbox) {
      const [west, south, east, north] = queryBbox.split(',').map(Number)
      map.fitBounds([
        [south, west],
        [north, east],
      ])
    } else {
      map.setView([46.5, 2.4], 6)
    }
  }, [queryBbox, map])

  useMapEvents({
    dragend: (e) => {
      const bounds = e.target.getBounds()
      setBbox(`${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`)
    },
    zoomend: (e) => {
      const bounds = e.target.getBounds()
      setBbox(`${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`)
    },
  })

  return null
}

export const AccomodationsMap: FC<AccomodationsMapProps> = ({ data }) => {
  const { classes } = useStyles()
  const [queryStates, setQueryStates] = useQueryStates({
    bbox: parseAsString,
    id: parseAsString,
  })

  const { data: accommodations } = useAccomodations()

  const markers = useMemo(() => {
    const accommodationsData = queryStates.bbox ? accommodations?.results.features || [] : data.results.features
    return accommodationsData.map((accommodation) => (
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
        position={[accommodation.geometry.coordinates[1], accommodation.geometry.coordinates[0]]}
      />
    ))
  }, [accommodations, queryStates.bbox, setQueryStates, data])

  const memoizedMap = useMemo(() => {
    return (
      <MapContainer center={[46.5, 2.4]} zoom={6} className={classes.mapContainer} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <BoundsHandler />
        {markers}
      </MapContainer>
    )
  }, [markers, queryStates.bbox])

  return memoizedMap
}

const useStyles = tss.create({
  mapContainer: {
    '[href]': {
      backgroundImage: 'unset !important',
    },
    [fr.breakpoints.down('sm')]: {
      height: '400px',
    },
    height: '500px',
    width: '100%',
  },
})
