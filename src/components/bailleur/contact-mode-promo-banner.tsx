import { hasPermission } from '~/server/bailleur/permissions'
import { getServerSession } from '~/services/better-auth'
import { ContactModePromoBannerClient } from './contact-mode-promo-banner-client'

/**
 * Bandeau incitant à activer la réception des candidatures.
 * N'apparaît que si le gestionnaire courant a `contactMode === 'none'`.
 */
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
      contactMode={auth.user.owner?.contactMode ?? 'none'}
      adminOwners={adminOwners}
      defaultOwnerId={auth.user.owner?.id ?? adminOwners[0]?.id}
    />
  )
}
