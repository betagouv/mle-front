import { computeAge } from '~/utils/dayjs'

interface Props {
  email: string | null
  phone: string | null
  birthdate: string | null
  scholarshipStatus: string | null
}

const Line = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <li className="fr-flex fr-align-items-center fr-flex-gap-2v">
    <span className={icon} aria-hidden="true" />
    <span>{children}</span>
  </li>
)

/** Carte « À propos du candidat » : seules les informations connues sont affichées. */
export const ContactDetailAbout = ({ email, phone, birthdate, scholarshipStatus }: Props) => {
  const age = computeAge(birthdate)

  return (
    <>
      <h2 className="fr-h4 fr-mb-3w">À propos du candidat</h2>

      <ul className="fr-flex fr-direction-column fr-flex-gap-3v fr-p-0 fr-m-0" style={{ listStyle: 'none' }}>
        {email && (
          <Line icon="ri-mail-line">
            <a href={`mailto:${email}`}>{email}</a>
          </Line>
        )}
        {phone && (
          <Line icon="ri-phone-line">
            <a href={`tel:${phone}`}>{phone}</a>
          </Line>
        )}
        {age !== null && <Line icon="ri-calendar-line">{age} ans</Line>}
        {scholarshipStatus === 'yes' && <Line icon="ri-money-euro-circle-line">Boursier</Line>}
      </ul>
    </>
  )
}
