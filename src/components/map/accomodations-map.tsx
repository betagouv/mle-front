'use client'

import { FC, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { tss } from 'tss-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'

type AccomodationsMapProps = {
  center: [number, number]
}

export const AccomodationsMap: FC<AccomodationsMapProps> = ({ center }) => {
  const { classes } = useStyles()

  const memoizedMap = useMemo(() => {
    return (
      <MapContainer center={center} zoom={6} className={classes.mapContainer}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
    )
  }, [center])

  return memoizedMap
}

const useStyles = tss.create({
  mapContainer: {
    '[href]': {
      backgroundImage: 'unset !important',
    },
    height: '700px',
    width: '100%',
  },
})
