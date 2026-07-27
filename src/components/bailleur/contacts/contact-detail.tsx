'use client'

import { useQuery } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { EContactSource } from '~/enums/contact-source'
import { useTRPC } from '~/server/trpc/client'
import { ContactDetailAbout } from './contact-detail-about'
import { ContactDetailActions } from './contact-detail-actions'
import { ContactDetailLayout } from './contact-detail-layout'

interface Props {
  id: string
  slug: string
}

export const ContactDetail = ({ id, slug }: Props) => {
  const t = useTranslations('bailleur.contacts')
  const trpc = useTRPC()
  const { data: contact, isLoading } = useQuery(trpc.bailleur.getContact.queryOptions({ id }))

  if (isLoading) {
    return (
      <div className="fr-container fr-pb-12w">
        <p>{t('loading')}</p>
      </div>
    )
  }

  if (!contact) return notFound()

  return (
    <ContactDetailLayout contact={contact} slug={slug} actions={<ContactDetailActions contact={contact} source={EContactSource.CONTACT} />}>
      <ContactDetailAbout contact={contact} />
    </ContactDetailLayout>
  )
}
