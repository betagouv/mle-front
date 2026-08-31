import { useTranslations } from 'next-intl'

type PasswordRuleMessage = { severity: 'info' | 'error'; message: string }

export const usePasswordRuleMessages = (hasError: boolean): { messagesHint: string; messages: PasswordRuleMessage[] } => {
  const t = useTranslations('passwordInput')

  return {
    messagesHint: t('hint'),
    messages: [
      { severity: hasError ? 'error' : 'info', message: t('rule12') },
      { severity: 'info', message: t('ruleLetter') },
      { severity: 'info', message: t('ruleDigit') },
      { severity: 'info', message: t('ruleSpecial') },
    ],
  }
}
