'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { FC } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { tss } from 'tss-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'

export const AccomodationMap: FC<{ center: [number, number]; withScroll: boolean }> = ({ center, withScroll }) => {
  const { classes } = useStyles()

  return (
    <MapContainer
      center={center}
      zoom={16}
      className={classes.mapContainer}
      scrollWheelZoom={withScroll}
      dragging={withScroll}
      touchZoom={withScroll}
      doubleClickZoom={withScroll}
      zoomControl={withScroll}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={center} />
    </MapContainer>
  )
}

const useStyles = tss.create({
  mapContainer: {
    '[href]': {
      backgroundImage: 'unset !important',
    },
    [fr.breakpoints.down('sm')]: {
      height: '300px',
    },
    height: '300px',
    width: '100%',
  },
})
