import { z } from 'zod'

/**
 * Schémas Zod pour le web service RAMSESE (référentiel des établissements du MEN).
 * On ne modélise que les champs réellement consommés — toutes les propriétés du
 * référentiel sont optionnelles côté API, donc traitées comme telles ici.
 */

// Valeur historisée (adresse, dénomination, appellation…)
const ZValeurDateDebutFin = z.object({
  VALEUR: z.string().optional(),
  DATE_DEBUT: z.string().optional(),
  DATE_FIN: z.string().optional(),
})

// Code historisé (nature, secteur…)
const ZCodeDateDebutFin = z.object({
  CODE: z.string().optional(),
  DATE_DEBUT: z.string().optional(),
  DATE_FIN: z.string().optional(),
})

const ZIdentificationUai = z.object({
  NUMERO_UAI: z.string().optional(),
  ETAT: z.string().optional(),
  CODE_ACADEMIE: z.string().optional(),
  CODE_DEPARTEMENT: z.string().optional(),
  NATURES: z.array(ZCodeDateDebutFin).optional(),
  SECTEURS: z.array(ZCodeDateDebutFin).optional(),
  DENOMINATIONS_PRINCIPALES: z.array(ZValeurDateDebutFin).optional(),
  APPELLATIONS_OFFICIELLES: z.array(ZValeurDateDebutFin).optional(),
  SIGLES: z.array(ZValeurDateDebutFin).optional(),
})

const ZLocalisationUai = z.object({
  COMPLEMENT_ADRESSE: z.string().optional(),
  CODE_POSTAL: z.string().optional(),
  LOCALITE_ACHEMINEMENT: z.string().optional(),
  TELEPHONE: z.string().optional(),
  MEL: z.string().optional(),
  ADRESSES: z.array(ZValeurDateDebutFin).optional(),
})

const ZAdministrationUai = z.object({
  CODE_INSEE_COMMUNE: z.string().optional(),
})

const ZGeolocalisationUai = z.object({
  COORDONNEES_X: z.string().optional(),
  COORDONNEES_Y: z.string().optional(),
  SYSTEME_REFERENCE: z.string().optional(),
})

/** Détail d'un UAI : `GET /v3/uai/{numeroUai}` */
export const ZUaiWs = z.object({
  IDENTIFICATION: ZIdentificationUai.optional(),
  LOCALISATION: ZLocalisationUai.optional(),
  ADMINISTRATION: ZAdministrationUai.optional(),
  GEOLOCALISATION: ZGeolocalisationUai.optional(),
})
export type TUaiWs = z.infer<typeof ZUaiWs>

/** Liste de numéros UAI : `POST /v3/listeUai/filtres`, `GET /v3/listeUai/*` */
export const ZUaisWs = z.object({
  UAIS: z.array(z.string()).default([]),
})
export type TUaisWs = z.infer<typeof ZUaisWs>

/** Réponse geo.api.gouv.fr — conversion code postal → communes INSEE */
export const ZGeoApiCommunes = z.array(
  z.object({
    code: z.string(),
    nom: z.string(),
  }),
)

/** Forme normalisée renvoyée au reste de l'application */
export const ZEtablissementSuperieur = z.object({
  numeroUai: z.string(),
  denomination: z.string().nullable(),
  sigle: z.string().nullable(),
  natureCodes: z.array(z.string()),
  secteur: z.string().nullable(),
  adresse: z.string().nullable(),
  codePostal: z.string().nullable(),
  commune: z.string().nullable(),
  codeInseeCommune: z.string().nullable(),
  telephone: z.string().nullable(),
  email: z.string().nullable(),
  coordonnees: z
    .object({
      x: z.string(),
      y: z.string(),
      systemeReference: z.string().nullable(),
    })
    .nullable(),
})
export type TEtablissementSuperieur = z.infer<typeof ZEtablissementSuperieur>

/** Établissement proche d'une résidence, avec distance calculée (fiche logement) */
export const ZNearbyEtablissement = z.object({
  numeroUai: z.string(),
  denomination: z.string().nullable(),
  sigle: z.string().nullable(),
  distanceMeters: z.number(),
  distanceKm: z.number(),
})
export type TNearbyEtablissement = z.infer<typeof ZNearbyEtablissement>
