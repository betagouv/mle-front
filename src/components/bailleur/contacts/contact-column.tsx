'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { CONTACT_STATUS_CONFIG, type ContactStatus } from '~/enums/contact-status'
import { ContactCard, type ContactItem } from './contact-card'
import styles from './contact-column.module.css'

const COLUMN_ICON: Record<ContactStatus, string> = {
  a_moderer: 'ri-team-line',
  non_retenu: 'ri-close-circle-line',
  a_contacter: 'ri-time-line',
  contacte: 'ri-checkbox-circle-line',
}

/** La colonne d'entrée du board porte toujours l'icône « équipe » dorée, quel que soit son statut. */
const ENTRY_ICON = 'ri-team-line'
const ENTRY_COLOR = CONTACT_STATUS_CONFIG.a_moderer.barColor

const DraggableCard = ({ contact, slug }: { contact: ContactItem; slug: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: contact.id })

  return (
    <ContactCard
      ref={setNodeRef}
      contact={contact}
      slug={slug}
      className={clsx(isDragging && styles.dragging)}
      {...attributes}
      {...listeners}
    />
  )
}

interface Props {
  status: ContactStatus
  items: ContactItem[]
  slug: string
  /** Première colonne du board (les candidatures/demandes qui arrivent). */
  isEntry?: boolean
}

export const ContactColumn = ({ status, items, slug, isEntry = false }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const config = CONTACT_STATUS_CONFIG[status]

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <span
          className={clsx(isEntry ? ENTRY_ICON : COLUMN_ICON[status], styles.icon)}
          style={{ '--column-icon-color': isEntry ? ENTRY_COLOR : config.barColor } as CSSProperties}
          aria-hidden="true"
        />
        <div className="fr-flex fr-flex-gap-2v">
          <span className={styles.title}>{config.label}</span>({items.length})
        </div>
      </div>
      <div ref={setNodeRef} className={clsx(styles.dropzone, isOver && styles.dropzoneOver)}>
        {items.length === 0 ? (
          <div className={styles.emptyCell} aria-hidden="true" />
        ) : (
          items.map((item) => <DraggableCard key={item.id} contact={item} slug={slug} />)
        )}
      </div>
    </div>
  )
}
