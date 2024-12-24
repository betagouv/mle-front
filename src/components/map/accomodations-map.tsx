'use client'

import { FC, useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { tss } from 'tss-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { useAccomodations } from '~/hooks/use-accomodations'
import { fr } from '@codegouvfr/react-dsfr'
import { useQueryState } from 'nuqs'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

interface AccomodationsMapProps {
  bbox: { xmax: number; xmin: number; ymax: number; ymin: number } | undefined
  data: TGetAccomodationsResponse
}

const BoundsHandler: FC<{ bbox: { xmax: number; xmin: number; ymax: number; ymin: number } | undefined }> = ({ bbox }) => {
  const map = useMap()
  const [queryBbox, setBbox] = useQueryState('bbox')

  useEffect(() => {
    if (map) {
      if (queryBbox) {
        const [west, south, east, north] = queryBbox.split(',').map(Number)
        map.fitBounds([
          [south, west],
          [north, east],
        ])
      }
      if (bbox) {
        map.fitBounds([
          [bbox.ymin, bbox.xmin],
          [bbox.ymax, bbox.xmax],
        ])
      }
    }
  }, [queryBbox, bbox])

  useMapEvents({
    moveend: (e) => {
      const bounds = e.target.getBounds()
      setBbox(`${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`)
    },
  })

  return null
}

export const AccomodationsMap: FC<AccomodationsMapProps> = ({ bbox, data }) => {
  const { classes } = useStyles()
  const { data: accommodations } = useAccomodations()

  const markers = useMemo(() => {
    return (accommodations?.results.features || data.results.features).map((accommodation) => (
      <Marker key={accommodation.id} position={[accommodation.geometry.coordinates[1], accommodation.geometry.coordinates[0]]} />
    ))
  }, [data, accommodations])

  const memoizedMap = useMemo(() => {
    return (
      <MapContainer center={[46.5, 2.4]} zoom={6} className={classes.mapContainer}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <BoundsHandler bbox={bbox} />
        {markers}
      </MapContainer>
    )
  }, [markers])

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
    height: '700px',
    width: '100%',
  },
})
