export enum AvailableLocales {
  EN = 'en',
  FR = 'fr',
}

export const SERVED_LOCALES: AvailableLocales[] = [AvailableLocales.FR, AvailableLocales.EN]

export const resolveLocale = (value?: string | null): AvailableLocales => {
  const normalizedValue = value?.toLowerCase()

  if (normalizedValue?.startsWith(AvailableLocales.EN) && SERVED_LOCALES.includes(AvailableLocales.EN)) {
    return AvailableLocales.EN
  }

  return AvailableLocales.FR
}
