import { describe, expect, it } from 'vitest'
import { normalizeCookie, SESSION_COOKIE_NAME } from '../collect'

describe('normalizeCookie', () => {
  it('préfixe le nom du cookie de session lorsque seule la valeur est fournie', () => {
    expect(normalizeCookie('udJdZzu9axqOPX5zeZMB7sTgbwLJvEdB.10ET7VNpHIZ88k0xTZn5oOs1afg37zfBs68K0%2F%2BxeoY%3D')).toBe(
      `${SESSION_COOKIE_NAME}=udJdZzu9axqOPX5zeZMB7sTgbwLJvEdB.10ET7VNpHIZ88k0xTZn5oOs1afg37zfBs68K0%2F%2BxeoY%3D`,
    )
  })

  it('laisse intacte une paire nom=valeur', () => {
    const pair = `${SESSION_COOKIE_NAME}=abc.def`
    expect(normalizeCookie(pair)).toBe(pair)
  })

  it('laisse intacte une liste de plusieurs cookies', () => {
    const header = `foo=1; ${SESSION_COOKIE_NAME}=abc`
    expect(normalizeCookie(header)).toBe(header)
  })

  it('ignore les valeurs vides ou blanches', () => {
    expect(normalizeCookie(undefined)).toBeUndefined()
    expect(normalizeCookie('   ')).toBeUndefined()
  })

  it('supprime les espaces autour de la valeur collée', () => {
    expect(normalizeCookie('  abc.def  ')).toBe(`${SESSION_COOKIE_NAME}=abc.def`)
  })
})
