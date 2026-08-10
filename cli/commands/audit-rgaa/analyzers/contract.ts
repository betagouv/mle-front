import type { TDocument } from '../dom'
import type { TRgaaPriority, TRgaaStatus } from '../types'

/** Verdict d'un analyseur sur un écran donné. */
export type TScopeVerdict = {
  status: 'C' | 'NC' | 'NA'
  /** Ce que l'analyseur a réellement observé — repris tel quel dans la colonne Constat. */
  detail: string
  /**
   * Couverture constatée sur cet écran, quand elle dépend de ce que la page contient.
   * Certaines règles couvrent l'intégralité des tests tant que la page reste dans ce qu'elles
   * savent mesurer — l'indicateur de focus est mesurable s'il s'agit d'un contour, pas s'il
   * s'agit d'une ombre portée. Le drapeau statique de l'analyseur ne peut pas exprimer cette
   * nuance : renseigné ici, il l'emporte, et il faut qu'il vaille pour *tous* les écrans de la
   * feuille pour autoriser un « Conforme ».
   */
  coversAllTests?: boolean
}

export type TAnalyzer = {
  criterion: string
  /**
   * Vrai uniquement si la règle couvre l'intégralité des tests RGAA du critère.
   * C'est la seule condition qui autorise l'analyseur à écrire « Conforme ».
   * Un analyseur partiel peut condamner, jamais absoudre.
   */
  coversAllTests: boolean
  analyze: (document: TDocument, scope: string) => TScopeVerdict
}

export type TAutoResult = {
  criterion: string
  status: TRgaaStatus
  observation: string
  fullyCovered: boolean
  /** Renseignés uniquement pour les non-conformités : une NC sans résolution est inexploitable. */
  priority?: TRgaaPriority
  remediation?: string
}

/** Formate une liste d'éléments fautifs sans noyer la cellule. */
export function listExamples(items: string[], max = 8): string {
  const shown = items.slice(0, max).join(' ; ')
  return items.length > max ? `${shown} ; … (+${items.length - max} autre(s))` : shown
}

export function conforming(detail: string, coversAllTests?: boolean): TScopeVerdict {
  return coversAllTests === undefined ? { status: 'C', detail } : { status: 'C', detail, coversAllTests }
}

export function failing(detail: string): TScopeVerdict {
  return { status: 'NC', detail }
}

export function notApplicable(detail: string): TScopeVerdict {
  return { status: 'NA', detail }
}
