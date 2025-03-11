import Image from 'next/image'
import { parseAsString, useQueryState } from 'nuqs'

export const FindStudentAccommodationImageCard = ({ image, name }: { image: string; name: string }) => {
  const [vue] = useQueryState('vue', parseAsString)
  return <Image style={{ objectFit: 'cover' }} src={image} alt={name} width={vue === 'carte' ? 344 : 376} height={193} />
}
