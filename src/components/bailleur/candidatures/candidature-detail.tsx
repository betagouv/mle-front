'use client'

import { useQuery } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ContactDetailAbout } from '~/components/bailleur/contacts/contact-detail-about'
import { ContactDetailActions } from '~/components/bailleur/contacts/contact-detail-actions'
import { ContactDetailDossierFacile } from '~/components/bailleur/contacts/contact-detail-dossier-facile'
import { ContactDetailLayout } from '~/components/bailleur/contacts/contact-detail-layout'
import { EContactSource } from '~/enums/contact-source'
import { useTRPC } from '~/server/trpc/client'

interface CandidatureDetailProps {
  id: string
  slug: string
}

export const CandidatureDetail = ({ id, slug }: CandidatureDetailProps) => {
  const t = useTranslations('bailleur.contacts')
  const trpc = useTRPC()
  const { data: candidature, isLoading } = useQuery(trpc.bailleur.getCandidature.queryOptions({ id }))

  if (isLoading) {
    return (
      <div className="fr-container fr-pb-12w">
        <p>{t('loading')}</p>
      </div>
    )
  }

  if (!candidature) return notFound()

  return (
    <ContactDetailLayout
      contact={candidature}
      slug={slug}
      actions={<ContactDetailActions contact={candidature} source={EContactSource.DOSSIER_FACILE} dfTenantId={candidature.dfTenantId} />}
    >
      <ContactDetailAbout contact={candidature} />

      <ContactDetailDossierFacile candidature={candidature} />
    </ContactDetailLayout>
  )
}
