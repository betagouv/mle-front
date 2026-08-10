import { z } from 'zod'
import type { TReviewFamily } from './review/extract'

/**
 * Statuts de la grille d'audit officielle RGAA (DINUM) :
 * C = Conforme, NC = Non conforme, NA = Non applicable, NT = Non testé.
 * NT est restitué dans le classeur sous le libellé « À vérifier manuellement ».
 */
export const RGAA_STATUSES = ['C', 'NC', 'NA', 'NT'] as const
export const ZRgaaStatus = z.enum(RGAA_STATUSES)
export type TRgaaStatus = z.infer<typeof ZRgaaStatus>

export const STATUS_LABELS: Record<TRgaaStatus, string> = {
  C: 'Conforme',
  NC: 'Non conforme',
  NA: 'Non applicable',
  NT: 'À vérifier manuellement',
}

export const RGAA_PRIORITIES = ['P1', 'P2', 'P3'] as const
export const ZRgaaPriority = z.enum(RGAA_PRIORITIES)
export type TRgaaPriority = z.infer<typeof ZRgaaPriority>

/**
 * Provenance du statut. Permet de distinguer dans le classeur une non-conformité
 * prouvée par le DOM d'une non-conformité d'appréciation.
 */
export const RGAA_ORIGINS = ['automatique', 'expert', 'automatique + expert', 'non testé'] as const
export const ZRgaaOrigin = z.enum(RGAA_ORIGINS)
export type TRgaaOrigin = z.infer<typeof ZRgaaOrigin>

export const ZRgaaLevel = z.enum(['A', 'AA'])
export type TRgaaLevel = z.infer<typeof ZRgaaLevel>

const CRITERION_PATTERN = /^\d{1,2}\.\d{1,2}$/

/** Constat saisi par un auditeur humain. Une entrée = un critère sur une page. */
export const ZRgaaFinding = z.object({
  criterion: z.string().regex(CRITERION_PATTERN, { message: 'Numéro de critère invalide (attendu : « 9.1 »)' }),
  status: ZRgaaStatus,
  priority: ZRgaaPriority.optional(),
  /** Fichier:ligne dans src/, ou sélecteur DOM. */
  location: z.string().optional(),
  /** Écran concerné quand la feuille en regroupe plusieurs (ex. « favoris »). */
  scope: z.string().optional(),
  observation: z.string().min(1, { message: 'Le constat est obligatoire' }),
  remediation: z.string().optional(),
  /** Numéros de tests RGAA couverts par le constat (ex. ['7.3.1']). */
  tests: z.array(z.string()).optional(),
  /** Obligatoire pour promouvoir en « Conforme » un critère condamné automatiquement. */
  overrides: z.object({ reason: z.string().min(1) }).optional(),
  quickWin: z.boolean().optional(),
})
export type TRgaaFinding = z.infer<typeof ZRgaaFinding>

export const ZRgaaFindings = z.array(ZRgaaFinding).superRefine((findings, ctx) => {
  findings.forEach((finding, index) => {
    if (finding.status === 'NC' && !finding.priority) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'priority'],
        message: `Critère ${finding.criterion} : priorité obligatoire pour un constat NC`,
      })
    }
    if (finding.status !== 'NC' && finding.priority) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'priority'],
        message: `Critère ${finding.criterion} : priorité réservée aux constats NC`,
      })
    }
    if (finding.status === 'NC' && !finding.remediation?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'remediation'],
        message: `Critère ${finding.criterion} : résolution obligatoire pour un constat NC`,
      })
    }
  })
})

/** Widgets rendus uniquement côté client : la collecte SSR ne les voit pas. */
export const CLIENT_ONLY_WIDGETS = ['leaflet-map', 'recharts-pie', 'dsfr-modals'] as const
export const ZClientOnlyWidget = z.enum(CLIENT_ONLY_WIDGETS)
export type TClientOnlyWidget = z.infer<typeof ZClientOnlyWidget>

export const ZAuditUrl = z.object({
  /** Étiquette d'écran préfixée dans la colonne Constat (ex. « étape 2 »). */
  scope: z.string(),
  path: z.string(),
  /** En-tête Accept-Language, quand la page est collectée dans plusieurs langues. */
  acceptLanguage: z.string().optional(),
  /** Chaînes devant figurer dans le HTML : garde-fou contre une collecte silencieusement vide. */
  assertContains: z.array(z.string()).default([]),
})
export type TAuditUrl = z.infer<typeof ZAuditUrl>

export const ZAuditPage = z.object({
  id: z.string(),
  /** Nom de l'onglet Excel : 31 caractères max, sans : \ / ? * [ ] */
  sheetName: z.string().min(1).max(31),
  label: z.string(),
  urls: z.array(ZAuditUrl).min(1),
  auth: z.boolean().default(false),
  clientOnlyWidgets: z.array(ZClientOnlyWidget).default([]),
  /** Feuille de référence (gabarit) : exclue du calcul des taux de conformité. */
  isTemplate: z.boolean().default(false),
})
export type TAuditPage = z.infer<typeof ZAuditPage>

/** Une cellule du classeur : un critère sur une page. */
export const ZAuditCell = z.object({
  criterion: z.string(),
  status: ZRgaaStatus,
  origin: ZRgaaOrigin,
  observations: z.array(z.string()),
  remediations: z.array(z.string()),
  priority: ZRgaaPriority.optional(),
  /** Vrai si le statut vient d'un analyseur couvrant l'intégralité des tests du critère. */
  fullyCovered: z.boolean().default(false),
})
export type TAuditCell = z.infer<typeof ZAuditCell>

export const ZAuditSheet = z.object({
  pageId: z.string(),
  sheetName: z.string(),
  label: z.string(),
  isTemplate: z.boolean(),
  cells: z.array(ZAuditCell),
})
export type TAuditSheet = z.infer<typeof ZAuditSheet>

export type TPageRates = {
  pageId: string
  label: string
  counts: Record<TRgaaStatus, number>
  /** C / (C + NC) — formule officielle RGAA, appliquée au périmètre testé. */
  provisional: number | null
  /** C / (C + NC + NT) — hypothèse pessimiste. */
  floor: number
  /** (C + NC + NA) / 106 — part du référentiel réellement statuée. */
  coverage: number
}

export type TManualTask = {
  pageId: string
  pageLabel: string
  criterion: string
  criterionTitle: string
  level: TRgaaLevel
  topic: string
  reason: string
  methodology: string
  tooling: string
}

/**
 * Le même reste à faire que `TManualTask`, regroupé par critère. Un auditeur ne teste pas
 * un critère sept fois : il l'éprouve une fois, avec un outil, puis coche les pages où le
 * constat vaut. Les deux vues décrivent exactement le même périmètre, dans deux ordres.
 */
export type TManualCampaign = {
  tooling: string
  topic: string
  criterion: string
  criterionTitle: string
  level: TRgaaLevel
  /** Libellés des pages concernées, dans l'ordre du classeur. */
  pages: string[]
  /** Motifs de non-conclusion, dédoublonnés : un même motif vaut souvent pour plusieurs pages. */
  reasons: { reason: string; pages: string[] }[]
  methodology: string
}

export type TWorkbookModel = {
  generatedAt: string
  baseUrl: string
  commit: string
  referentialSha256: string
  sample: TAuditSample[]
  sheets: TAuditSheet[]
  rates: TPageRates[]
  manualTasks: TManualTask[]
  /** Même périmètre que `manualTasks`, regroupé par critère et rangé par campagne d'outillage. */
  manualCampaigns: TManualCampaign[]
  legalIssues: TLegalIssue[]
  /** Cahier de relevés : listes à juger, sans statut. */
  review: TReviewFamily[]
  warnings: string[]
}

export type TAuditSample = {
  pageId: string
  label: string
  urls: { scope: string; url: string; acceptLanguage: string; httpStatus: number; bytes: number }[]
  auth: boolean
  blindSpots: string[]
}

/** Non-conformité au décret 2019-768 : obligation légale, pas critère RGAA. */
export type TLegalIssue = {
  title: string
  detail: string
  location: string
  remediation: string
}
