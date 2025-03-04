import { useMutation } from '@tanstack/react-query'
import { TAlertAccommodationForm } from '~/schemas/alert-accommodation/alert-accommodation'

export const postSubscribeToNewsletter = async (body: TAlertAccommodationForm): Promise<void> => {
  const response = await fetch('/api/territories/newsletter/subscribe', {
    body: JSON.stringify(body),
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving territories')
  }
  return response.json()
}

export const useAlertAccommodation = () => {
  const { mutateAsync } = useMutation({
    mutationFn: async (data: TAlertAccommodationForm) => postSubscribeToNewsletter(data),
  })

  return {
    mutateAsync,
  }
}
