import { describe, expect, it } from 'vitest'
import { ZBirthDate, ZScholarshipStatus, ZStudentPhone, ZStudentProfileInfo } from '~/schemas/student-profile/student-profile'

describe('ZStudentPhone', () => {
  it('accepte un mobile français avec espaces et le normalise', () => {
    const result = ZStudentPhone.safeParse('06 01 02 03 04')
    expect(result.success).toBe(true)
    expect(result.data).toBe('0601020304')
  })

  it('accepte un format international +33 et retire les séparateurs', () => {
    const result = ZStudentPhone.safeParse('+33 6 12 34 56 78')
    expect(result.success).toBe(true)
    expect(result.data).toBe('+33612345678')
  })

  it('accepte les tirets, points et parenthèses', () => {
    expect(ZStudentPhone.safeParse('06-01.02(03)04').data).toBe('0601020304')
  })

  it('rejette une chaîne vide', () => {
    expect(ZStudentPhone.safeParse('').success).toBe(false)
  })

  it('rejette un numéro trop court', () => {
    expect(ZStudentPhone.safeParse('12345').success).toBe(false)
  })

  it('rejette un numéro contenant des lettres', () => {
    expect(ZStudentPhone.safeParse('06ABCD1234').success).toBe(false)
  })
})

describe('ZBirthDate', () => {
  it('accepte une date passée plausible', () => {
    expect(ZBirthDate.safeParse('2000-01-01').success).toBe(true)
  })

  it('rejette une chaîne vide', () => {
    expect(ZBirthDate.safeParse('').success).toBe(false)
  })

  it('rejette un mauvais format', () => {
    expect(ZBirthDate.safeParse('01/12/2006').success).toBe(false)
  })

  it('rejette une date dans le futur', () => {
    expect(ZBirthDate.safeParse('2999-01-01').success).toBe(false)
  })

  it('rejette un âge trop élevé (> 100 ans)', () => {
    expect(ZBirthDate.safeParse('1850-01-01').success).toBe(false)
  })

  it('rejette une date invalide', () => {
    expect(ZBirthDate.safeParse('2000-13-40').success).toBe(false)
  })
})

describe('ZScholarshipStatus', () => {
  it('accepte les valeurs valides', () => {
    expect(ZScholarshipStatus.safeParse('yes').success).toBe(true)
    expect(ZScholarshipStatus.safeParse('no').success).toBe(true)
    expect(ZScholarshipStatus.safeParse('unknown').success).toBe(true)
  })

  it('rejette une valeur inconnue', () => {
    expect(ZScholarshipStatus.safeParse('peut-etre').success).toBe(false)
  })

  it('rejette une chaîne vide', () => {
    expect(ZScholarshipStatus.safeParse('').success).toBe(false)
  })
})

describe('ZStudentProfileInfo', () => {
  it('valide et normalise un profil complet', () => {
    const result = ZStudentProfileInfo.safeParse({
      phone: '06 01 02 03 04',
      birthdate: '2000-01-01',
      scholarshipStatus: 'yes',
    })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ phone: '0601020304', birthdate: '2000-01-01', scholarshipStatus: 'yes' })
  })

  it('échoue si un champ est manquant', () => {
    expect(ZStudentProfileInfo.safeParse({ phone: '0601020304', birthdate: '2000-01-01' }).success).toBe(false)
  })
})
