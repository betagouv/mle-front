import { FC } from 'react'
import { Skeleton } from '~/components/ui/skeleton/skeleton'

export const CardSkeleton: FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Skeleton style={{ height: '24rem', width: '100%' }} />
    </div>
  )
}
