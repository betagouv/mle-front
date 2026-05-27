import Alert from '@codegouvfr/react-dsfr/Alert'

interface WaitingListBadgeProps {
  acceptWaitingList: boolean
  nbAvailable: number | null
  waitingListText: string
  className?: string
}

export function WaitingListBadge({ acceptWaitingList, nbAvailable, waitingListText, className }: WaitingListBadgeProps) {
  if (!acceptWaitingList || (nbAvailable !== null && nbAvailable !== undefined && nbAvailable > 0)) {
    return null
  }

  return <Alert description={waitingListText} severity="info" small className={className} />
}
