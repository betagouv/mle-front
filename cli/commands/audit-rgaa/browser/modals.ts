import type { Page } from 'playwright'
import { MODAL_TRIGGERS_PROBE, type TModalDescriptor, type TModalProbe } from './probes-interaction'

/** Nombre de tabulations effectuées dans une modale pour éprouver le confinement du focus. */
const TRAP_PROBE_STEPS = 25

/**
 * Ouvre chaque modale de la page et l'audite comme un écran à part entière.
 *
 * C'est le seul moyen de sortir les modales des angles morts : elles sont dans le DOM mais
 * fermées, donc invisibles aux analyseurs. On les ouvre **au clavier** — pas par un clic
 * programmatique — parce que c'est précisément le chemin qui doit fonctionner (RGAA 12.11),
 * puis on éprouve le confinement du focus et la fermeture par Échap (RGAA 12.9).
 */
export async function probeModals(page: Page): Promise<TModalProbe[]> {
  const triggers = (await page.evaluate(MODAL_TRIGGERS_PROBE)) as TModalDescriptor[]
  const probes: TModalProbe[] = []

  for (const trigger of triggers.slice(0, 6)) {
    // Sélecteur par attribut plutôt que par #id : les identifiants générés par le DSFR
    // contiennent des caractères qu’un sélecteur d’id devrait échapper.
    const modal = page.locator(`[id="${trigger.modalId}"]`)
    // Le bouton « Fermer » d'une modale porte le même aria-controls que son déclencheur : prendre
    // le premier venu revenait souvent à activer la fermeture d'une modale déjà fermée, puis à
    // conclure que le déclencheur n'ouvre rien au clavier. On ne retient que les éléments
    // visibles, comme le fait le relevé des déclencheurs lui-même.
    const triggerLocator = page.locator(`[aria-controls="${trigger.modalId}"]:visible`).first()

    try {
      await triggerLocator.focus()
      await page.keyboard.press('Enter')

      // L'ouverture est animée elle aussi : on laisse la transition se faire avant de conclure.
      let opened = false
      for (let attempt = 0; attempt < 10 && !opened; attempt++) {
        await page.waitForTimeout(150)
        opened = await modal.evaluate((element) => {
          if (!element.hasAttribute('open')) return false
          const style = getComputedStyle(element)
          return style.display !== 'none' && element.getBoundingClientRect().height > 0
        })
      }

      if (!opened) {
        probes.push({
          modalId: trigger.modalId,
          triggerLabel: trigger.triggerLabel,
          opened: false,
          html: '',
          focusTrapped: false,
          closesOnEscape: false,
          focusRestored: false,
          focusableCount: 0,
        })
        continue
      }

      const html = await modal.evaluate((element) => element.outerHTML)

      // Confinement du focus : on tabule et on vérifie que le focus ne s'échappe jamais.
      let escaped = false
      let focusableCount = 0
      const insideSelectors = new Set<string>()
      for (let step = 0; step < TRAP_PROBE_STEPS; step++) {
        await page.keyboard.press('Tab')
        const state = (await page.evaluate(
          `(() => {
            const active = document.activeElement;
            if (!active) return { inside: false, key: 'none' };
            const modal = document.getElementById(${JSON.stringify(trigger.modalId)});
            return { inside: Boolean(modal && modal.contains(active)), key: active.tagName + ':' + (active.id || active.className || '') };
          })()`,
        )) as { inside: boolean; key: string }
        if (!state.inside) {
          escaped = true
          break
        }
        insideSelectors.add(state.key)
      }
      focusableCount = insideSelectors.size

      /**
       * Échap s'éprouve depuis un élément qui n'est pas un champ de saisie.
       *
       * Le DSFR refuse délibérément de fermer une modale quand le focus est dans un INPUT,
       * LABEL, TEXTAREA, SELECT, AUDIO ou VIDEO (Modal._escape), pour laisser la touche aux
       * composants de formulaire. Éprouver Échap à la fin d'un parcours de tabulation revenait
       * donc à le tester depuis un champ une fois sur deux, et à condamner des modales qui se
       * ferment parfaitement — l'utilisateur pouvant de toute façon toujours atteindre le
       * bouton « Fermer », qui fait partie du cycle de tabulation.
       */
      await page.evaluate(
        `(() => {
          const modal = document.getElementById(${JSON.stringify(trigger.modalId)});
          if (!modal) return;
          const active = document.activeElement;
          if (active && !['INPUT', 'LABEL', 'TEXTAREA', 'SELECT', 'AUDIO', 'VIDEO'].includes(active.tagName)) return;
          const fallback = modal.querySelector('button, [href], [tabindex]:not([tabindex="-1"])');
          if (fallback) fallback.focus();
        })()`,
      )

      await page.keyboard.press('Escape')

      /**
       * La fermeture d'une modale DSFR est animée : l'attribut `open` tombe immédiatement, mais
       * `visibility` reste `visible` pendant toute la transition, de l'ordre de 350 ms. Lire l'état
       * une seule fois après un délai fixe revenait à jouer à pile ou face — sous la charge d'un
       * audit complet, la lecture tombait avant la fin de l'animation et condamnait des modales
       * qui se ferment parfaitement. On interroge donc l'état jusqu'à ce qu'il se stabilise, et on
       * fait confiance à `open`, qui est le signal synchrone.
       */
      let stillOpen = true
      for (let attempt = 0; attempt < 12 && stillOpen; attempt++) {
        await page.waitForTimeout(150)
        stillOpen = await modal.evaluate((element) => {
          if (!element.hasAttribute('open')) return false
          const style = getComputedStyle(element)
          return style.display !== 'none' && style.visibility !== 'hidden' && element.getBoundingClientRect().height > 0
        })
      }

      const focusRestored = (await page.evaluate(
        `(() => {
          const active = document.activeElement;
          if (!active) return false;
          return active.getAttribute('aria-controls') === ${JSON.stringify(trigger.modalId)};
        })()`,
      )) as boolean

      probes.push({
        modalId: trigger.modalId,
        triggerLabel: trigger.triggerLabel,
        opened: true,
        html,
        focusTrapped: !escaped,
        closesOnEscape: !stillOpen,
        focusRestored,
        focusableCount,
      })

      if (stillOpen) {
        // On referme de force pour ne pas fausser l'examen de la modale suivante.
        await page.keyboard.press('Escape')
        await page.evaluate(`document.getElementById(${JSON.stringify(trigger.modalId)})?.removeAttribute('open')`)
        await page.waitForTimeout(200)
      }
    } catch {
      probes.push({
        modalId: trigger.modalId,
        triggerLabel: trigger.triggerLabel,
        opened: false,
        html: '',
        focusTrapped: false,
        closesOnEscape: false,
        focusRestored: false,
        focusableCount: 0,
      })
    }
  }

  return probes
}
