'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import { useSignedDocumentUrl } from '~/hooks/use-signed-document-url'
import styles from './contact-detail.module.css'

const CATEGORY_LABELS: Record<string, string> = {
  IDENTIFICATION: 'Pièce d’identité',
  RESIDENCY: 'Justificatif de domicile',
  PROFESSIONAL: 'Justificatif de situation professionnelle',
  FINANCIAL: 'Justificatif de ressources',
  TAX: 'Avis d’imposition',
}

const SUB_CATEGORY_LABELS: Record<string, string> = {
  FRENCH_IDENTITY_CARD: 'Carte d’identité',
  FRENCH_PASSPORT: 'Passeport',
  GUEST: 'Hébergé',
  TENANT: 'Locataire',
  OWNER: 'Propriétaire',
  OTHER_TAX: 'Autre document fiscal',
  MY_NAME: 'À mon nom',
  LESS_THAN_YEAR: 'Moins d’un an',
  NO_INCOME: 'Sans revenu',
  STUDENT: 'Étudiant',
  CDI: 'CDI',
  CDD: 'CDD',
  ALTERNATION: 'Alternance',
  INTERNSHIP: 'Stage',
}

function documentLabel(category: string, subCategory: string | null): string {
  const catLabel = CATEGORY_LABELS[category] ?? category
  if (!subCategory) return catLabel
  const subLabel = SUB_CATEGORY_LABELS[subCategory]
  return subLabel ? `${catLabel} — ${subLabel}` : catLabel
}

export type DocumentItem = { id: string; documentCategory: string; documentSubCategory: string | null }

interface Props {
  status: string
  dfTenantId: string
  hasTenantUrl: boolean
  hasPdfUrl: boolean
  documents: { tenant: DocumentItem[]; guarantor: DocumentItem[] }
}

/**
 * Bloc DossierFacile de la fiche contact : tant que la demande est « à modérer »,
 * les pièces du dossier restent inaccessibles au gestionnaire.
 */
export const ContactDetailDossierFacile = ({ status, dfTenantId, hasTenantUrl, hasPdfUrl, documents }: Props) => {
  const { openDocument, isLoading } = useSignedDocumentUrl()

  const isLocked = status === 'a_moderer'
  const allDocs = [...documents.tenant, ...documents.guarantor]

  return (
    <div className="fr-mt-4w">
      <hr className="fr-mb-3w" />

      <div className="fr-flex fr-align-items-center fr-justify-content-space-between fr-flex-gap-2v fr-mb-2w">
        <span className={styles.dfLogo}>
          Dossier<strong>Facile</strong>
        </span>
        {hasTenantUrl && (
          <Button
            priority="secondary"
            iconId="ri-external-link-line"
            iconPosition="right"
            size="small"
            onClick={() => openDocument('tenantUrl', dfTenantId)}
            disabled={isLoading || isLocked}
          >
            DossierFacile
          </Button>
        )}
      </div>

      {isLocked ? (
        <Alert
          severity="info"
          small
          description={
            <>
              Veuillez modérer la demande de contact pour accéder au Dossier<strong>Facile</strong> de l&apos;étudiant
            </>
          }
        />
      ) : (
        <div className={styles.documents}>
          {hasPdfUrl && (
            <button
              type="button"
              onClick={() => openDocument('tenantPdf', dfTenantId)}
              disabled={isLoading}
              className={`fr-link ${styles.document}`}
            >
              Dossier DossierFacile (PDF)
            </button>
          )}
          {allDocs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => openDocument('document', doc.id)}
              disabled={isLoading}
              className={`fr-link ${styles.document}`}
            >
              {documentLabel(doc.documentCategory, doc.documentSubCategory)}
              <span className="ri-eye-line fr-ml-1v" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
