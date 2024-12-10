'use client'

import { FC, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { tss } from 'tss-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { parseAsFloat, useQueryStates } from 'nuqs'
import { useAccomodations } from '~/hooks/use-accomodations'
import { fr } from '@codegouvfr/react-dsfr'

interface AccomodationsMapProps {
  center: [number, number]
}

const BoundsHandler: FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setBbox] = useQueryStates({
    xmax: parseAsFloat,
    xmin: parseAsFloat,
    ymax: parseAsFloat,
    ymin: parseAsFloat,
  })
  useMapEvents({
    moveend: (e) => {
      const bounds = e.target.getBounds()
      setBbox({
        xmax: bounds.getEast(),
        xmin: bounds.getWest(),
        ymax: bounds.getNorth(),
        ymin: bounds.getSouth(),
      })
    },
  })

  return null
}

export const AccomodationsMap: FC<AccomodationsMapProps> = ({ center }) => {
  const { classes } = useStyles()
  const { data } = useAccomodations()

  const markers = useMemo(() => {
    return data?.results.features.map((accommodation) => (
      <Marker key={accommodation.id} position={[accommodation.geometry.coordinates[1], accommodation.geometry.coordinates[0]]} />
    ))
  }, [data])

  const memoizedMap = useMemo(() => {
    return (
      <MapContainer center={center} zoom={6} className={classes.mapContainer}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <BoundsHandler />
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
