import DOMPurify from 'dompurify'
import { RICH_TEXT_ALLOWED_ATTR, RICH_TEXT_ALLOWED_TAGS } from '~/utils/sanitize-config'

export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    return html
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}
