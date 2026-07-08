import { notFound } from 'next/navigation'
import { FC } from 'react'
import { hasPermission } from '~/server/bailleur/permissions'
import { getServerSession } from '~/services/better-auth'
import { WorkspaceHeaderClient } from './workspace-header-client'

export const WorkspaceHeaderComponent: FC = async () => {
  const auth = await getServerSession()

  if (!auth || !auth.session || !auth.user) {
    return notFound()
  }

  const isAdmin = auth.user.role === 'admin'
  const adminOwners = auth.user.adminOwners ?? []
  const showSwitcher = isAdmin && adminOwners.length > 1
  const defaultOwnerId = auth.user.owner?.id ?? adminOwners[0]?.id

  const canManageUsers = hasPermission(
    {
      role: auth.user.role,
      bailleurRole: auth.user.bailleurRole ?? null,
      bailleurPermissions: auth.user.bailleurPermissions ?? [],
    },
    'manage_users',
  )

  return (
    <WorkspaceHeaderClient
      user={auth.user}
      adminOwners={adminOwners}
      defaultOwnerId={defaultOwnerId}
      showSwitcher={showSwitcher}
      contactMode={auth.user.owner?.contactMode ?? 'none'}
      canManageUsers={canManageUsers}
      isAdmin={isAdmin}
    />
  )
}
