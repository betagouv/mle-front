// Source de vérité partagée client/serveur pour la sanitisation du HTML riche
// (descriptions de résidences, etc.). Pas d'import DOMPurify ici afin que ce
// module reste utilisable côté serveur (isomorphic-dompurify) comme côté client.

export const RICH_TEXT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
]

export const RICH_TEXT_ALLOWED_ATTR = ['href', 'target']
