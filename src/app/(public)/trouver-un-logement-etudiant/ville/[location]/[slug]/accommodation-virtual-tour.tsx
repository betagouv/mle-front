'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import DOMPurify from 'dompurify'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './logement.module.css'

type VirtualTourType = 'iframe' | 'video' | 'link'

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?.*)?$/i

function toEmbedUrl(url: string): string {
  // youtube.com/watch?v=ID → youtube.com/embed/ID
  const ytWatch = url.match(/(?:youtube\.com\/watch\?v=)([\w-]+)/)
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`

  // youtu.be/ID → youtube.com/embed/ID
  const ytShort = url.match(/youtu\.be\/([\w-]+)/)
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`

  return url
}

function detectVirtualTourType(input: string): VirtualTourType | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.includes('<iframe')) return 'iframe'
  if (VIDEO_EXTENSIONS.test(trimmed)) return 'video'
  if (/^https?:\/\//i.test(trimmed)) return 'link'
  return null
}

/**
 * Le code d'intégration est saisi par le gestionnaire : rien ne garantit qu'il porte un titre
 * de cadre. Sans titre, l'iframe est annoncée « cadre sans nom » (RGAA 2.1) — on impose donc
 * un titre de repli à toute iframe qui n'en a pas.
 */
function ensureIframeTitle(html: string, fallbackTitle: string): string {
  return html.replace(/<iframe\b([^>]*)>/gi, (match, attributes: string) =>
    /\btitle\s*=\s*"[^"]*[^\s"][^"]*"/i.test(attributes) ? match : `<iframe${attributes} title="${fallbackTitle}">`,
  )
}

const IframeEmbed = ({ html }: { html: string }) => {
  const t = useTranslations('accomodation')
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['iframe'],
    ALLOWED_ATTR: ['src', 'width', 'height', 'title', 'frameborder', 'allow', 'allowfullscreen', 'referrerpolicy'],
    ALLOW_DATA_ATTR: false,
  })

  if (!sanitized) return null

  const responsive = ensureIframeTitle(sanitized, t('virtualTour.frameTitle'))
    .replace(/width="[^"]*"/g, '')
    .replace(/height="[^"]*"/g, 'style="position:absolute;top:0;left:0;width:100%;height:100%"')

  return (
    <div
      style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: responsive }}
    />
  )
}

const VideoPlayer = ({ src }: { src: string }) => {
  const t = useTranslations('accomodation')
  const tA11y = useTranslations('accessibility')
  const [videoError, setVideoError] = useState(false)

  if (videoError) {
    return (
      <Button
        iconId="ri-external-link-line"
        iconPosition="right"
        priority="secondary"
        linkProps={{
          href: src,
          target: '_blank',
          rel: 'noopener noreferrer',
          title: tA11y('linkNewWindow', { label: t('virtualTour.openLink') }),
        }}
      >
        {t('virtualTour.openLink')}
      </Button>
    )
  }

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
      <video
        controls
        preload="metadata"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        onError={() => setVideoError(true)}
      >
        <source src={src} />
      </video>
    </div>
  )
}

const TourEmbed = ({ url }: { url: string }) => {
  const t = useTranslations('accomodation')
  const tA11y = useTranslations('accessibility')
  const [iframeError, setIframeError] = useState(false)

  return (
    <>
      {!iframeError && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <iframe
            src={url}
            title={t('virtualTour.frameTitle')}
            allow="fullscreen"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            onError={() => setIframeError(true)}
          />
        </div>
      )}
      {iframeError && (
        <Button
          iconId="ri-external-link-line"
          iconPosition="right"
          priority="secondary"
          linkProps={{
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer',
            title: tA11y('linkNewWindow', { label: t('virtualTour.openLink') }),
          }}
        >
          {t('virtualTour.openLink')}
        </Button>
      )}
    </>
  )
}

export const AccommodationVirtualTour = ({ url }: { url: string | null }) => {
  const t = useTranslations('accomodation')

  if (!url) return null

  const type = detectVirtualTourType(url)
  if (!type) return null

  return (
    <div className={styles.section}>
      <h3 className="fr-h4">{t('virtualTour.title')}</h3>
      {type === 'iframe' && <IframeEmbed html={url} />}
      {type === 'video' && <VideoPlayer src={url.trim()} />}
      {type === 'link' && <TourEmbed url={toEmbedUrl(url.trim())} />}
    </div>
  )
}
