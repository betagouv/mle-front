'use client'

import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { createToast } from '~/components/ui/createToast'
import { type ContactStatus, columnsForMode } from '~/enums/contact-status'
import { useTRPC } from '~/server/trpc/client'
import { ContactCard, type ContactItem } from './contact-card'
import { ContactColumn } from './contact-column'
import styles from './contacts-board.module.css'

interface Props {
  slug: string
}

export const ContactsBoard = ({ slug }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data } = useQuery(trpc.bailleur.listContactsByResidence.queryOptions({ slug }))

  const [items, setItems] = useState<ContactItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (data?.items) setItems(data.items)
  }, [data?.items])

  const mode = data?.mode ?? 'none'
  const columns = mode === 'none' ? [] : columnsForMode(mode)

  const { mutate } = useMutation(
    trpc.bailleur.updateContactStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.bailleur.listResidencesWithContactCounts.queryKey() })
      },
      onError: () => {
        createToast({ priority: 'error', message: 'Le changement de statut a échoué.' })
        queryClient.invalidateQueries({ queryKey: trpc.bailleur.listContactsByResidence.queryKey({ slug }) })
      },
    }),
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const activeItem = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId])

  const resolveTargetStatus = (overId: string): ContactStatus | null => {
    if (columns.includes(overId as ContactStatus)) return overId as ContactStatus
    return (items.find((i) => i.id === overId)?.status as ContactStatus) ?? null
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const item = items.find((i) => i.id === active.id)
    const target = resolveTargetStatus(String(over.id))
    if (!item || !target || item.status === target) return

    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: target } : i)))
    mutate({ id: item.id, status: target, source: item.source })
  }

  return (
    <div className="fr-border fr-p-3w">
      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className={styles.board} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((status, index) => (
            <ContactColumn
              key={status}
              status={status}
              slug={slug}
              isEntry={index === 0}
              items={items.filter((i) => i.status === status)}
            />
          ))}
        </div>

        <DragOverlay>{activeItem ? <ContactCard contact={activeItem} slug={slug} overlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}
