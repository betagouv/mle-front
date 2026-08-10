import type { TLegalIssue, TRgaaFinding } from '../../types'
import { ZRgaaFindings } from '../../types'
import { findings as accueil } from './accueil'
import { findings as espaceEtudiant } from './espace-etudiant'
import { findings as ficheLogement } from './fiche-logement'
import { findings as gabarit } from './gabarit'
import { findings as preparerBudget } from './preparer-budget'
import { findings as recherche } from './recherche'
import { findings as simulateurAides } from './simulateur-aides'
import { findings as simulerBudget } from './simuler-budget'

const RAW_FINDINGS: Record<string, TRgaaFinding[]> = {
  accueil,
  recherche,
  'fiche-logement': ficheLogement,
  'simuler-budget': simulerBudget,
  'preparer-budget': preparerBudget,
  'simulateur-aides': simulateurAides,
  'espace-etudiant': espaceEtudiant,
  gabarit,
}

/**
 * Charge et valide la base de constats experts. Une erreur de saisie doit faire
 * échouer la commande, pas produire un classeur silencieusement incomplet.
 */
export function loadExpertFindings(knownCriteria: Set<string>): Record<string, TRgaaFinding[]> {
  const validated: Record<string, TRgaaFinding[]> = {}

  for (const [pageId, findings] of Object.entries(RAW_FINDINGS)) {
    const result = ZRgaaFindings.safeParse(findings)
    if (!result.success) {
      const details = result.error.issues.map((issue) => `  - ${issue.path.join('.')} : ${issue.message}`).join('\n')
      throw new Error(`Constats experts invalides pour « ${pageId} » :\n${details}`)
    }

    const unknown = result.data.filter((finding) => !knownCriteria.has(finding.criterion)).map((finding) => finding.criterion)
    if (unknown.length > 0) {
      throw new Error(`Constats experts « ${pageId} » : critère(s) inexistant(s) dans le référentiel RGAA 4.1 — ${unknown.join(', ')}`)
    }

    validated[pageId] = result.data
  }

  return validated
}

/**
 * Non-conformités au décret 2019-768 : ce sont des obligations légales, pas des critères
 * RGAA. Les noyer dans une ligne de critère les rendrait invisibles — elles ouvrent la synthèse.
 */
export const LEGAL_ISSUES: TLegalIssue[] = [
  {
    title: "Déclaration d'accessibilité absente",
    detail:
      "La page /accessibilite existe mais son contenu est du lorem ipsum (trois blocs « Lorem ipsum dolor consectetur », date figée au 01/01/25). Aucune des mentions obligatoires n'y figure : état de conformité, résultats des tests, contenus non accessibles et dérogations, date de publication, moyens de contact, voie de recours auprès du Défenseur des droits.",
    location: 'src/app/(public)/(utils-pages)/accessibilite/page.tsx',
    remediation:
      "Rédiger la déclaration à partir du modèle officiel de la DINUM, en s'appuyant sur les résultats du présent audit, et publier également le schéma pluriannuel de mise en accessibilité et son plan d'action annuel.",
  },
  {
    title: "Mention d'accessibilité du pied de page non cliquable",
    detail:
      'Le composant Footer du DSFR reçoit accessibility="non compliant" — la mention « Accessibilité : non conforme » s\'affiche donc bien — mais aucun accessibilityLinkProps n\'est fourni. Le DSFR retombe alors sur linkProps: {} et la mention ne renvoie pas vers /accessibilite, alors que le décret impose un lien vers la déclaration depuis toutes les pages.',
    location: 'src/components/ui/footer/footer.tsx:97',
    remediation: "Passer accessibilityLinkProps={{ href: '/accessibilite' }} au composant Footer.",
  },
]
