'use client'

import { useQuery } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { useTRPC } from '~/server/trpc/client'
import { ContactDetailAbout } from './contact-detail-about'
import { ContactDetailActions } from './contact-detail-actions'
import { ContactDetailLayout } from './contact-detail-layout'

interface Props {
  id: string
  slug: string
}

/** Fiche d'une demande de contact (mode `contacts`). */
export const ContactDetail = ({ id, slug }: Props) => {
  const trpc = useTRPC()
  const { data: contact, isLoading } = useQuery(trpc.bailleur.getContact.queryOptions({ id }))

  if (isLoading) {
    return (
      <div className="fr-container fr-pb-12w">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!contact) return notFound()

  return (
    <ContactDetailLayout
      studentName={contact.studentName}
      status={contact.status}
      slug={slug}
      source="contact"
      actions={<ContactDetailActions id={contact.id} source="contact" status={contact.status} reviewedAt={contact.reviewedAt} />}
    >
      <ContactDetailAbout
        email={contact.studentEmail}
        phone={contact.studentPhone}
        birthdate={contact.studentBirthdate}
        scholarshipStatus={contact.scholarshipStatus}
      />
    </ContactDetailLayout>
  )
}
