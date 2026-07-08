'use client'

import { useQuery } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { ContactDetailAbout } from '~/components/bailleur/contacts/contact-detail-about'
import { ContactDetailActions } from '~/components/bailleur/contacts/contact-detail-actions'
import { ContactDetailDossierFacile } from '~/components/bailleur/contacts/contact-detail-dossier-facile'
import { ContactDetailLayout } from '~/components/bailleur/contacts/contact-detail-layout'
import { useTRPC } from '~/server/trpc/client'

interface CandidatureDetailProps {
  id: string
  slug: string
}

/** Fiche d'une candidature DossierFacile (mode `dossier_facile`). */
export const CandidatureDetail = ({ id, slug }: CandidatureDetailProps) => {
  const trpc = useTRPC()
  const { data: candidature, isLoading } = useQuery(trpc.bailleur.getCandidature.queryOptions({ id }))

  if (isLoading) {
    return (
      <div className="fr-container fr-pb-12w">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!candidature) return notFound()

  return (
    <ContactDetailLayout
      studentName={candidature.studentName}
      status={candidature.status}
      slug={slug}
      source="dossier_facile"
      actions={
        <ContactDetailActions
          id={candidature.id}
          source="dossier_facile"
          status={candidature.status}
          dfTenantId={candidature.dfTenantId}
          reviewedAt={candidature.reviewedAt}
        />
      }
    >
      <ContactDetailAbout
        email={candidature.studentEmail}
        phone={candidature.studentPhone}
        birthdate={candidature.studentBirthdate}
        scholarshipStatus={candidature.scholarshipStatus}
      />

      <ContactDetailDossierFacile
        status={candidature.status}
        dfTenantId={candidature.dfTenantId}
        hasTenantUrl={candidature.hasTenantUrl}
        hasPdfUrl={candidature.hasPdfUrl}
        documents={candidature.documents}
      />
    </ContactDetailLayout>
  )
}
