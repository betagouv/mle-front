import { EOwnerContactMode } from '~/enums/owner-contact-mode'
import { hasPermission } from '~/server/bailleur/permissions'
import { getServerSession } from '~/services/better-auth'
import { ContactModePromoBannerClient } from './contact-mode-promo-banner-client'

export const ContactModePromoBanner = async () => {
  const auth = await getServerSession()
  if (!auth?.user) return null

  const canManageApplications = hasPermission(
    {
      role: auth.user.role,
      bailleurRole: auth.user.bailleurRole ?? null,
      bailleurPermissions: auth.user.bailleurPermissions ?? [],
    },
    'manage_applications',
  )
  if (!canManageApplications) return null

  const adminOwners = auth.user.adminOwners ?? []

  return (
    <ContactModePromoBannerClient
      contactMode={auth.user.owner?.contactMode ?? EOwnerContactMode.NONE}
      adminOwners={adminOwners}
      defaultOwnerId={auth.user.owner?.id ?? adminOwners[0]?.id}
    />
  )
}
