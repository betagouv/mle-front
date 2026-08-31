'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { EContactStatus } from '~/enums/contact-status'
import { useSignedDocumentUrl } from '~/hooks/use-signed-document-url'
import type { TCandidatureDetail } from '~/schemas/contacts/contact-detail'
import styles from './contact-detail.module.css'

/**
 * Bloc DossierFacile de la fiche contact : tant que la demande est « à modérer »,
 * les pièces du dossier restent inaccessibles au gestionnaire.
 */
export const ContactDetailDossierFacile = ({ candidature }: { candidature: TCandidatureDetail }) => {
  const t = useTranslations('bailleur.contacts.dossierFacile')
  const { openDocument, isLoading } = useSignedDocumentUrl()

  const { status, dfTenantId, hasTenantUrl, hasPdfUrl, documents } = candidature
  const isLocked = status === EContactStatus.A_MODERER
  const allDocs = [...documents.tenant, ...documents.guarantor]

  const documentLabel = (category: string, subCategory: string | null) => {
    const catLabel = t.has(`categories.${category}`) ? t(`categories.${category}`) : category
    if (!subCategory || !t.has(`subCategories.${subCategory}`)) return catLabel
    return `${catLabel} — ${t(`subCategories.${subCategory}`)}`
  }

  return (
    <div className="fr-mt-4w">
      <hr className="fr-mb-3w" />

      <div className="fr-flex fr-align-items-center fr-justify-content-space-between fr-flex-gap-2v fr-mb-2w">
        <span className="fr-text--lg fr-text-default--grey">
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
            {t('openButton')}
          </Button>
        )}
      </div>

      {isLocked ? (
        <Alert severity="info" small description={t('lockedAlert')} />
      ) : (
        <div className="fr-flex fr-direction-column">
          {hasPdfUrl && (
            <button
              type="button"
              onClick={() => openDocument('tenantPdf', dfTenantId)}
              disabled={isLoading}
              className={clsx('fr-link fr-text--left', styles.document)}
            >
              {t('pdfLink')}
            </button>
          )}
          {allDocs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => openDocument('document', doc.id)}
              disabled={isLoading}
              className={clsx('fr-link fr-text--left', styles.document)}
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
