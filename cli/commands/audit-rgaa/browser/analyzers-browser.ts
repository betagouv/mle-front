import { conforming, failing, listExamples, notApplicable, type TScopeVerdict } from '../analyzers/contract'
import type { TBrowserSnapshot } from './collect-browser'

/**
 * Analyseur travaillant sur le rendu réel de la page plutôt que sur son HTML.
 *
 * Même contrat d'honnêteté que les analyseurs DOM : `coversAllTests` conditionne le droit
 * d'écrire « Conforme ». La différence tient à la source — couleurs calculées, focus,
 * ordre de tabulation, débordements mesurés à trois largeurs de fenêtre.
 */
export type TBrowserAnalyzer = {
  criterion: string
  coversAllTests: boolean
  analyze: (snapshot: TBrowserSnapshot) => TScopeVerdict
}

function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2).replace('.', ',')}:1`
}

/**
 * 3.2 — contraste du texte. Les mesures dont le fond n'est pas déterminable (image de fond,
 * dégradé, transparence non résolue) ne condamnent pas : elles sont signalées pour contrôle
 * manuel, conformément à la limite annoncée dans le README.
 */
export const contrast32: TBrowserAnalyzer = {
  criterion: '3.2',
  coversAllTests: false,
  analyze: (snapshot) => {
    const samples = snapshot.contrast
    if (samples.length === 0) return notApplicable('Aucun texte mesurable dans la page rendue')

    const certain = samples.filter((sample) => !sample.backgroundUncertain)
    const failures = certain.filter((sample) => sample.ratio < sample.threshold)
    const uncertain = samples.filter((sample) => sample.backgroundUncertain && sample.ratio < sample.threshold)

    if (failures.length > 0) {
      const detail = failures
        .slice(0, 8)
        .map(
          (sample) =>
            `« ${sample.text} » ${formatRatio(sample.ratio)} < ${sample.threshold}:1 ` +
            `(${sample.color} sur ${sample.background}, ${sample.fontSizePx}px${sample.bold ? ' gras' : ''}) → ${sample.selector}`,
        )
      return failing(
        `${failures.length} texte(s) sous le seuil de contraste sur ${certain.length} mesuré(s) : ${listExamples(detail)}` +
          (uncertain.length > 0 ? `. ${uncertain.length} autre(s) suspect(s) sur fond non déterminable, à vérifier au rendu` : ''),
      )
    }

    const worst = certain.reduce((min, sample) => (sample.ratio < min.ratio ? sample : min), certain[0])
    return conforming(
      `${certain.length} couple(s) texte/fond mesuré(s) au rendu, tous au-dessus du seuil ` +
        `(pire ratio ${worst ? formatRatio(worst.ratio) : 'n/a'})` +
        (uncertain.length > 0
          ? ` ; ${uncertain.length} texte(s) sur fond non déterminable (image ou dégradé) restent à contrôler visuellement`
          : ''),
    )
  },
}

/** 3.3 — contraste des composants d'interface. Mesuré sur le texte des éléments interactifs. */
export const contrast33: TBrowserAnalyzer = {
  criterion: '3.3',
  coversAllTests: false,
  analyze: (snapshot) => {
    const interactive = snapshot.contrast.filter((sample) =>
      /^(a|button|input|select|textarea|summary)\b|> (a|button|input)\b/.test(sample.selector),
    )
    if (interactive.length === 0) return notApplicable("Aucun composant d'interface textuel mesurable dans la page rendue")

    const certain = interactive.filter((sample) => !sample.backgroundUncertain)
    const failures = certain.filter((sample) => sample.ratio < 3)

    if (failures.length > 0) {
      const detail = failures.slice(0, 8).map((sample) => `« ${sample.text} » ${formatRatio(sample.ratio)} < 3:1 → ${sample.selector}`)
      return failing(
        `${failures.length} composant(s) d'interface sous le seuil de 3:1 sur ${certain.length} mesuré(s) : ${listExamples(detail)}`,
      )
    }

    return conforming(
      `${certain.length} composant(s) d'interface mesuré(s) au rendu, tous au-dessus de 3:1 ; ` +
        'les états au survol et au focus, ainsi que les bordures, restent à contrôler manuellement',
    )
  },
}

/** Ratio minimal exigé par le test 10.7.1 pour l'indicateur de prise de focus. */
const FOCUS_INDICATOR_MIN_CONTRAST = 3

/**
 * 10.7 — la prise de focus doit rester visible, et suffisamment contrastée.
 *
 * Le test 10.7.1 pose deux conditions ; les deux sont vérifiées ici. La couverture est
 * déclarée écran par écran : elle vaut tant que chaque indicateur est un contour dont la
 * couleur se compare à un fond uni. Dès qu'un indicateur repose sur une ombre portée, un
 * changement de fond ou une image, le ratio n'est pas mesurable et l'écran retombe dans le
 * contrôle manuel plutôt que de recevoir un « Conforme » non prouvé.
 */
export const focus107: TBrowserAnalyzer = {
  criterion: '10.7',
  coversAllTests: false,
  analyze: (snapshot) => {
    if (snapshot.focus.length === 0) return notApplicable('Aucun élément focusable dans la page rendue')

    const invisible = snapshot.focus.filter((sample) => !sample.visible)
    if (invisible.length > 0) {
      const detail = invisible.slice(0, 8).map((sample) => `${sample.selector}${sample.label ? ` (« ${sample.label} »)` : ''}`)
      return failing(
        `${invisible.length} élément(s) focusable(s) sur ${snapshot.focus.length} ne montrent aucun changement visuel à la prise de focus : ${listExamples(detail)}`,
      )
    }

    const tooFaint = snapshot.focus.filter(
      (sample) => sample.indicatorContrast !== null && sample.indicatorContrast < FOCUS_INDICATOR_MIN_CONTRAST,
    )
    if (tooFaint.length > 0) {
      const detail = tooFaint.slice(0, 8).map((sample) => `${sample.selector} (${sample.indicatorContrast}:1)`)
      return failing(
        `${tooFaint.length} indicateur(s) de focus sous le ratio de ${FOCUS_INDICATOR_MIN_CONTRAST}:1 exigé par le test 10.7.1 : ${listExamples(detail)}`,
      )
    }

    const unmeasurable = snapshot.focus.filter((sample) => sample.indicatorContrast === null)
    if (unmeasurable.length > 0) {
      return conforming(
        `${snapshot.focus.length} élément(s) focusable(s) marquent tous visuellement le focus, mais ${unmeasurable.length} indicateur(s) ` +
          'ne se ramènent pas à un couple de couleurs mesurable (ombre portée, changement de fond ou fond non uni) : leur contraste reste à juger',
        false,
      )
    }

    return conforming(
      `${snapshot.focus.length} élément(s) focusable(s) contrôlé(s) au rendu : tous marquent visuellement le focus, ` +
        `tous au-dessus du ratio de ${FOCUS_INDICATOR_MIN_CONTRAST}:1`,
      true,
    )
  },
}

/** 10.11 — le contenu doit rester consultable sans défilement horizontal à 320 px (reflow). */
export const reflow1011: TBrowserAnalyzer = {
  criterion: '10.11',
  coversAllTests: false,
  analyze: (snapshot) => {
    const { reflow320 } = snapshot
    const overflow = reflow320.documentScrollWidth - reflow320.documentClientWidth

    if (overflow > 1) {
      const detail = reflow320.offenders.map((offender) => `${offender.selector} (+${offender.overflowPx}px)`)
      return failing(
        `Défilement horizontal à 320 px de large : le document mesure ${reflow320.documentScrollWidth}px pour une fenêtre de ${reflow320.documentClientWidth}px` +
          (detail.length > 0 ? `. Éléments débordants : ${listExamples(detail)}` : ''),
      )
    }

    return conforming(
      `Aucun défilement horizontal à 320 px (document ${reflow320.documentScrollWidth}px pour ${reflow320.documentClientWidth}px de fenêtre) ; ` +
        "la lisibilité et l'ordre du contenu à cette largeur restent à juger",
    )
  },
}

/** 10.4 — le texte doit rester lisible et le contenu accessible à 200 % de zoom. */
export const zoom104: TBrowserAnalyzer = {
  criterion: '10.4',
  coversAllTests: false,
  analyze: (snapshot) => {
    const { zoom200 } = snapshot
    const overflow = zoom200.documentScrollWidth - zoom200.documentClientWidth

    if (overflow > 1) {
      const detail = zoom200.offenders.map((offender) => `${offender.selector} (+${offender.overflowPx}px)`)
      return failing(
        `Débordement horizontal à 200 % de zoom (fenêtre ramenée à ${zoom200.documentClientWidth}px) : document de ${zoom200.documentScrollWidth}px` +
          (detail.length > 0 ? `. Éléments débordants : ${listExamples(detail)}` : ''),
      )
    }

    return conforming(
      `Aucun débordement horizontal à 200 % de zoom ; la perte éventuelle de contenu ou de fonctionnalité reste à vérifier visuellement`,
    )
  },
}

/** 10.12 — le contenu doit rester lisible après application des espacements imposés. */
export const textSpacing1012: TBrowserAnalyzer = {
  criterion: '10.12',
  coversAllTests: false,
  analyze: (snapshot) => {
    const { textSpacing } = snapshot
    const overflow = textSpacing.documentScrollWidth - textSpacing.documentClientWidth

    if (overflow > 1) {
      const detail = textSpacing.offenders.map((offender) => `${offender.selector} (+${offender.overflowPx}px)`)
      return failing(
        `Perte de contenu après application des espacements du RGAA 10.12 (interlignage 1,5 ; lettres 0,12em ; mots 0,16em ; paragraphes 2em) : ` +
          `débordement horizontal de ${overflow}px` +
          (detail.length > 0 ? `. Éléments débordants : ${listExamples(detail)}` : ''),
      )
    }

    return conforming(
      'Aucun débordement après application des espacements imposés ; les chevauchements de texte restent à contrôler visuellement',
    )
  },
}

/**
 * 12.8 — l'ordre de tabulation doit être cohérent. Comparaison de l'ordre réel, relevé en
 * tabulant, avec l'ordre du document : une inversion signale un `tabindex` positif ou un
 * repositionnement CSS.
 */
export const tabOrder128: TBrowserAnalyzer = {
  criterion: '12.8',
  coversAllTests: false,
  analyze: (snapshot) => {
    const { tabOrder } = snapshot
    if (tabOrder.length === 0) return notApplicable('Aucun élément atteint par tabulation dans la page rendue')

    // Le rang dans le document est lu sur l'élément lui-même, marqué lors du relevé :
    // comparer des sélecteurs échouerait, deux éléments distincts produisant souvent le même.
    const inversions: string[] = []
    let previous = -1

    for (const stop of tabOrder) {
      if (stop.documentOrder < 0) continue
      if (stop.documentOrder < previous) {
        inversions.push(
          `${stop.selector}${stop.label ? ` (« ${stop.label} »)` : ''} atteint après un élément situé plus bas dans le document`,
        )
      }
      previous = Math.max(previous, stop.documentOrder)
    }

    if (inversions.length > 0) {
      return failing(`Ordre de tabulation incohérent avec l'ordre du document : ${listExamples(inversions)}`)
    }

    return conforming(
      `${tabOrder.length} arrêt(s) de tabulation relevés dans l'ordre du document ; ` +
        "la cohérence avec l'ordre visuel du rendu reste à confirmer à l'œil",
    )
  },
}

/**
 * Correspondance axe-core → critères RGAA, utilisée en **complément** : une violation axe
 * enrichit le constat du critère concerné mais ne le statue pas seule. Les règles sans
 * équivalent RGAA direct sont volontairement absentes.
 */
export const AXE_TO_RGAA: Record<string, string> = {
  'image-alt': '1.1',
  'input-image-alt': '1.1',
  'area-alt': '1.1',
  'role-img-alt': '1.1',
  'svg-img-alt': '1.1',
  'object-alt': '1.1',
  'frame-title': '2.1',
  'frame-title-unique': '2.2',
  'color-contrast': '3.2',
  'video-caption': '4.1',
  'audio-caption': '4.1',
  'td-headers-attr': '5.7',
  'th-has-data-cells': '5.6',
  'table-fake-caption': '5.4',
  'link-name': '6.2',
  'aria-allowed-attr': '7.1',
  'aria-required-attr': '7.1',
  'aria-required-children': '7.1',
  'aria-required-parent': '7.1',
  'aria-roles': '7.1',
  'aria-valid-attr': '7.1',
  'aria-valid-attr-value': '7.1',
  'aria-hidden-focus': '7.1',
  'duplicate-id-aria': '8.2',
  'html-has-lang': '8.3',
  'html-lang-valid': '8.4',
  'valid-lang': '8.4',
  'document-title': '8.5',
  'heading-order': '9.1',
  'empty-heading': '9.1',
  list: '9.3',
  listitem: '9.3',
  'definition-list': '9.3',
  dlitem: '9.3',
  'meta-viewport': '10.4',
  'label-title-only': '11.1',
  label: '11.1',
  'form-field-multiple-labels': '11.1',
  'select-name': '11.1',
  'autocomplete-valid': '11.13',
  'landmark-one-main': '12.6',
  region: '12.6',
  bypass: '12.7',
  tabindex: '12.8',
  'meta-refresh': '13.1',
  blink: '13.8',
  marquee: '13.8',
}

/**
 * 12.9 — la navigation ne doit pas contenir de piège au clavier.
 *
 * Éprouvé sur chaque modale ouverte : le focus doit rester confiné tant qu'elle est ouverte,
 * et la touche Échap doit permettre d'en sortir. Une modale qui piège sans issue est le cas
 * type que ce critère vise.
 */
export const keyboardTrap129: TBrowserAnalyzer = {
  criterion: '12.9',
  coversAllTests: false,
  analyze: (snapshot) => {
    const opened = snapshot.modals.filter((modal) => modal.opened)
    if (snapshot.modals.length === 0) return notApplicable('Aucune modale déclenchable dans la page rendue')
    if (opened.length === 0) {
      return notApplicable(
        `${snapshot.modals.length} déclencheur(s) de modale repérés, aucun n'a ouvert sa modale à l'activation clavier — voir le critère 12.11`,
      )
    }

    const trapped = opened.filter((modal) => modal.focusTrapped && !modal.closesOnEscape)
    if (trapped.length > 0) {
      return failing(
        `${trapped.length} modale(s) confinent le focus sans possibilité d'en sortir au clavier : ` +
          listExamples(trapped.map((modal) => `« ${modal.triggerLabel || modal.modalId} » (Échap sans effet)`)),
      )
    }

    return conforming(
      `${opened.length} modale(s) ouverte(s) au clavier : ` +
        opened
          .map(
            (modal) =>
              `« ${modal.triggerLabel || modal.modalId} » ${modal.focusTrapped ? 'focus confiné' : 'focus non confiné'}, ` +
              `${modal.closesOnEscape ? 'Échap referme' : 'Échap sans effet'}, ` +
              `${modal.focusRestored ? 'focus rendu au déclencheur' : 'focus non rendu au déclencheur'}`,
          )
          .join(' ; '),
    )
  },
}

/**
 * 12.11 — les contenus additionnels doivent être atteignables au clavier.
 * Contrôlé en activant chaque déclencheur par la touche Entrée, sans souris.
 */
export const additionalContent1211: TBrowserAnalyzer = {
  criterion: '12.11',
  coversAllTests: false,
  analyze: (snapshot) => {
    if (snapshot.modals.length === 0) return notApplicable('Aucun contenu additionnel déclenchable repéré dans la page rendue')

    const unreachable = snapshot.modals.filter((modal) => !modal.opened)
    if (unreachable.length > 0) {
      return failing(
        `${unreachable.length} contenu(s) additionnel(s) sur ${snapshot.modals.length} ne s'ouvrent pas à l'activation clavier du déclencheur : ` +
          listExamples(unreachable.map((modal) => `« ${modal.triggerLabel || modal.modalId} »`)),
      )
    }

    const empty = snapshot.modals.filter((modal) => modal.focusableCount === 0)
    if (empty.length > 0) {
      return failing(
        `${empty.length} modale(s) ouverte(s) au clavier mais dont aucun élément n'est atteignable par tabulation : ` +
          listExamples(empty.map((modal) => `« ${modal.triggerLabel || modal.modalId} »`)),
      )
    }

    return conforming(
      `${snapshot.modals.length} contenu(s) additionnel(s) ouverts au clavier, chacun exposant des éléments atteignables par tabulation ; ` +
        'les infobulles au survol restent à contrôler manuellement',
    )
  },
}

/** 13.8 — tout contenu en mouvement ou clignotant doit pouvoir être arrêté. */
export const movingContent138: TBrowserAnalyzer = {
  criterion: '13.8',
  coversAllTests: false,
  analyze: (snapshot) => {
    if (snapshot.movingContent.length === 0)
      return notApplicable('Aucun contenu en mouvement, clignotant ou média temporel dans la page rendue')

    const uncontrolled = snapshot.movingContent.filter((item) => !item.hasControl)
    if (uncontrolled.length > 0) {
      return failing(
        `${uncontrolled.length} contenu(s) en mouvement sans commande d'arrêt identifiable : ` +
          listExamples(uncontrolled.map((item) => `${item.selector} (${item.detail})`)),
      )
    }

    return conforming(
      `${snapshot.movingContent.length} contenu(s) en mouvement, tous dotés d'une commande à proximité ; ` +
        "la durée du mouvement et l'efficacité réelle de la commande restent à vérifier",
    )
  },
}

/** 10.5 — les déclarations de couleur de police et de fond doivent aller de pair. */
export const colorDeclaration105: TBrowserAnalyzer = {
  criterion: '10.5',
  coversAllTests: false,
  analyze: (snapshot) => {
    if (snapshot.colorDeclarations.length === 0) return notApplicable('Aucune couleur de police explicitement déclarée dans la page rendue')

    const orphans = snapshot.colorDeclarations.filter((item) => !item.hasBackground)
    if (orphans.length > 0) {
      return failing(
        `${orphans.length} texte(s) sur ${snapshot.colorDeclarations.length} imposent une couleur de police sans qu'aucun fond ne soit déclaré : ` +
          listExamples(orphans.map((item) => `${item.selector} (${item.color}, « ${item.text} »)`)),
      )
    }

    return conforming(`${snapshot.colorDeclarations.length} texte(s) à couleur imposée, tous sur un fond déclaré`)
  },
}

/** 10.6 — un lien au sein d'un texte doit être identifiable autrement que par la couleur. */
export const linkVisibility106: TBrowserAnalyzer = {
  criterion: '10.6',
  coversAllTests: false,
  analyze: (snapshot) => {
    if (snapshot.linksInText.length === 0) return notApplicable('Aucun lien au sein d’un texte dans la page rendue')

    const colorOnly = snapshot.linksInText.filter((link) => !link.distinguished)
    if (colorOnly.length > 0) {
      return failing(
        `${colorOnly.length} lien(s) sur ${snapshot.linksInText.length} ne se distinguent du texte environnant que par la couleur : ` +
          listExamples(
            colorOnly.map((link) => `« ${link.label} » (contraste avec le texte ${link.contrastWithText.toFixed(2).replace('.', ',')}:1)`),
          ),
      )
    }

    return conforming(
      `${snapshot.linksInText.length} lien(s) au sein d’un texte, tous distingués autrement que par la couleur ; ` +
        'le rappel au survol et à la prise de focus reste à contrôler',
    )
  },
}

/** Registre des analyseurs de rendu, déclaré après toutes les définitions. */
/**
 * Trois critères qui ne s'appliquent qu'en présence d'un mode d'interaction précis. Le DOM ne
 * dit rien de leur présence : c'est le registre d'écouteurs relevé au chargement qui tranche.
 *
 * Comme les familles « non applicable » de la passe DOM, ces règles ne peuvent que constater
 * une absence. Un mode d'interaction détecté ne vaut pas condamnation — il renvoie au contrôle
 * manuel, avec la liste de ce qui a été trouvé.
 */
type TInteractionFamily = {
  criterion: string
  /** Types d'événements qui rendent le critère applicable. */
  listenerTypes: string[]
  /** Vrai si un attribut accesskey suffit également à rendre le critère applicable. */
  accessKeysMatter?: boolean
  absent: string
  present: string
}

const INTERACTION_FAMILIES: TInteractionFamily[] = [
  {
    criterion: '13.10',
    listenerTypes: ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'],
    absent: "Aucune interaction au toucher n'est câblée dans la page rendue (aucun écouteur touch ni gesture)",
    present: 'Interaction(s) au toucher câblée(s)',
  },
  {
    criterion: '13.12',
    listenerTypes: ['devicemotion', 'deviceorientation', 'deviceorientationabsolute'],
    absent: "Aucune fonctionnalité liée au mouvement de l'appareil dans la page rendue (aucun écouteur devicemotion ni deviceorientation)",
    present: "Écouteur(s) de mouvement de l'appareil",
  },
  {
    criterion: '12.10',
    listenerTypes: ['keydown', 'keyup', 'keypress'],
    accessKeysMatter: true,
    absent: 'Aucun raccourci clavier dans la page rendue (aucun attribut accesskey, aucun écouteur clavier)',
    present: 'Raccourci(s) clavier potentiel(s)',
  },
]

const INTERACTION_ANALYZERS: TBrowserAnalyzer[] = INTERACTION_FAMILIES.map((family) => ({
  criterion: family.criterion,
  // Prouver l'absence est une conclusion complète ; constater la présence ne l'est pas.
  coversAllTests: false,
  analyze: (snapshot) => {
    const registry = snapshot.interaction
    if (!registry) return notApplicable('Relevé des interactions absent de ce snapshot')

    const found = family.listenerTypes.filter((type) => registry.listenerTypes.includes(type))
    const keys = family.accessKeysMatter ? registry.accessKeys : []

    if (found.length === 0 && keys.length === 0) return notApplicable(family.absent)

    const parts = [...found.map((type) => `écouteur « ${type} »`), ...keys.map((key) => `accesskey="${key}"`)]
    return conforming(`${family.present} : ${listExamples(parts)} — à éprouver manuellement`)
  },
}))

export const BROWSER_ANALYZERS: TBrowserAnalyzer[] = [
  ...INTERACTION_ANALYZERS,
  contrast32,
  contrast33,
  colorDeclaration105,
  linkVisibility106,
  focus107,
  reflow1011,
  zoom104,
  textSpacing1012,
  tabOrder128,
  keyboardTrap129,
  additionalContent1211,
  movingContent138,
]
