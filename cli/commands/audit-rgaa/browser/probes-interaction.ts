/**
 * Sondes d'interaction : contenus en mouvement, distinction des liens, déclarations de couleur.
 *
 * Comme les autres sondes, elles sont évaluées dans la page et ne renvoient que des valeurs
 * sérialisables. Elles observent le rendu **après** hydratation, où les animations tournent.
 */

export type TMovingContent = {
  selector: string
  kind: 'animation' | 'video' | 'audio' | 'marquee'
  detail: string
  /** Vrai si une commande d'arrêt est identifiable à proximité (bouton, contrôles natifs). */
  hasControl: boolean
}

export type TLinkInText = {
  selector: string
  label: string
  /** Vrai si le lien se distingue du texte environnant autrement que par la couleur. */
  distinguished: boolean
  detail: string
  /** Contraste entre la couleur du lien et celle du texte qui l'entoure. */
  contrastWithText: number
}

/**
 * Inventaire des modes d'interaction réellement câblés par la page.
 *
 * Plusieurs critères ne s'appliquent qu'en présence d'une interaction particulière : geste
 * multipoint (13.10), mouvement de l'appareil (13.12), raccourci clavier (12.10). Leur absence
 * ne se lit pas dans le DOM — elle se lit dans les écouteurs d'événements que le JavaScript
 * enregistre. Constatée, elle rend le critère non applicable de façon vérifiable, au lieu de
 * le laisser indéfiniment « à vérifier manuellement ».
 */
export type TInteractionRegistry = {
  /** Types d'événements passés à addEventListener depuis le chargement de la page. */
  listenerTypes: string[]
  /** Valeurs des attributs accesskey présents dans le document. */
  accessKeys: string[]
}

export type TColorDeclaration = {
  selector: string
  text: string
  color: string
  /** Vrai si un fond est déclaré sur l'élément ou l'un de ses ancêtres. */
  hasBackground: boolean
}

export type TModalDescriptor = {
  /** Identifiant de la modale, tel que porté par aria-controls du déclencheur. */
  modalId: string
  triggerSelector: string
  triggerLabel: string
}

export type TModalProbe = {
  modalId: string
  triggerLabel: string
  /** Vrai si la modale s'est effectivement ouverte à l'activation clavier du déclencheur. */
  opened: boolean
  /** HTML de la modale ouverte, analysé par les analyseurs DOM au même titre qu'une page. */
  html: string
  /** Vrai si la tabulation reste confinée dans la modale (comportement attendu). */
  focusTrapped: boolean
  /** Vrai si la touche Échap referme la modale. */
  closesOnEscape: boolean
  /** Vrai si le focus revient au déclencheur après fermeture. */
  focusRestored: boolean
  /** Nombre d'éléments focusables atteints à l'intérieur de la modale. */
  focusableCount: number
}

const SHARED = `
  function selectorFor(element) {
    const parts = [];
    let current = element;
    while (current && current.nodeType === 1 && parts.length < 4) {
      const tag = current.tagName.toLowerCase();
      if (tag === 'html' || tag === 'body') break;
      if (current.id) { parts.unshift(tag + '#' + current.id); break; }
      const cls = (current.getAttribute('class') || '').split(/\\s+/).filter((c) => c && !c.startsWith('fr-')).slice(0, 1).join('');
      parts.unshift(cls ? tag + '.' + cls : tag);
      current = current.parentElement;
    }
    return parts.join(' > ').slice(0, 120);
  }

  function isVisible(element) {
    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
    if (element.closest('[aria-hidden="true"], [hidden]')) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
`

/**
 * 13.8 — contenus en mouvement ou clignotants. Une animation de plus de 5 secondes doit
 * pouvoir être arrêtée ; en pratique on remonte toute animation infinie et tout média
 * démarrant seul, en signalant si une commande d'arrêt est identifiable.
 */
export const MOVING_CONTENT_PROBE = `(() => {
  ${SHARED}
  const found = [];

  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    if (found.length >= 20) break;
    if (!isVisible(element)) continue;
    const style = getComputedStyle(element);
    const infinite = style.animationIterationCount && style.animationIterationCount.split(',').some((v) => v.trim() === 'infinite');
    const running = style.animationName && style.animationName !== 'none' && style.animationPlayState !== 'paused';
    if (infinite && running) {
      const container = element.closest('section, div, header, footer, aside') || document.body;
      found.push({
        selector: selectorFor(element),
        kind: 'animation',
        detail: 'animation ' + style.animationName + ' en boucle (' + style.animationDuration + ')',
        hasControl: container.querySelectorAll('button, [role="button"]').length > 0,
      });
    }
  }

  for (const media of Array.from(document.querySelectorAll('video, audio'))) {
    found.push({
      selector: selectorFor(media),
      kind: media.tagName.toLowerCase(),
      detail: media.hasAttribute('autoplay') ? 'démarrage automatique' : 'lecture à la demande',
      hasControl: media.hasAttribute('controls'),
    });
  }

  for (const legacy of Array.from(document.querySelectorAll('marquee, blink'))) {
    found.push({ selector: selectorFor(legacy), kind: 'marquee', detail: 'balise obsolète de défilement', hasControl: false });
  }

  return found;
})()`

/**
 * 10.6 — un lien au sein d'un texte doit être identifiable autrement que par la couleur.
 * On ne retient que les liens réellement noyés dans du texte : un lien seul dans son
 * paragraphe ou dans une liste de navigation n'est pas concerné.
 */
export const LINK_IN_TEXT_PROBE = `(() => {
  ${SHARED}
  function parseColor(value) {
    const match = /rgba?\\(([^)]+)\\)/.exec(value || '');
    if (!match) return null;
    const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
    return { r: parts[0], g: parts[1], b: parts[2] };
  }
  function luminance(c) {
    const ch = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }
  function ratio(a, b) {
    if (!a || !b) return 0;
    const l1 = luminance(a); const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  const results = [];
  for (const link of Array.from(document.querySelectorAll('p a[href], li a[href]'))) {
    if (results.length >= 40) break;
    if (!isVisible(link)) continue;
    const parent = link.parentElement;
    if (!parent) continue;
    // Le lien doit être entouré de texte : sinon il n'est pas « au sein d'un texte ».
    const surrounding = (parent.textContent || '').replace(link.textContent || '', '').replace(/\\s+/g, ' ').trim();
    if (surrounding.length < 10) continue;

    const linkStyle = getComputedStyle(link);
    const parentStyle = getComputedStyle(parent);

    // Le DSFR ne souligne pas ses liens avec text-decoration : il peint une bande de moins de
    // deux pixels, ancrée en bas de la boîte, au moyen d'un linear-gradient de fond. Ne pas la
    // reconnaître revenait à condamner comme « distingués par la seule couleur » des liens
    // parfaitement soulignés. On exige la géométrie d'un soulignement — bande fine, en bas —
    // pour ne pas prendre n'importe quelle image de fond pour un trait.
    const gradientUnderline =
      linkStyle.backgroundImage.includes('linear-gradient') &&
      linkStyle.backgroundPosition.split(',').some((position) => /100%|calc\\(100%/.test(position)) &&
      linkStyle.backgroundSize.split(',').some((size) => {
        const height = parseFloat((size.trim().split(/\\s+/)[1] || '').replace('px', ''));
        return Number.isFinite(height) && height > 0 && height <= 4;
      });

    const underlined =
      linkStyle.textDecorationLine.includes('underline') || linkStyle.borderBottomWidth !== '0px' || gradientUnderline;
    const bolder = (parseInt(linkStyle.fontWeight, 10) || 400) > (parseInt(parentStyle.fontWeight, 10) || 400);
    const backgrounded = linkStyle.backgroundColor !== parentStyle.backgroundColor && linkStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const italic = linkStyle.fontStyle !== parentStyle.fontStyle;

    results.push({
      selector: selectorFor(link),
      label: (link.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 50),
      distinguished: underlined || bolder || backgrounded || italic,
      detail: underlined ? 'souligné' : bolder ? 'graisse différente' : backgrounded ? 'fond différent' : italic ? 'italique' : 'couleur seule',
      contrastWithText: Math.round(ratio(parseColor(linkStyle.color), parseColor(parentStyle.color)) * 100) / 100,
    });
  }
  return results;
})()`

/**
 * 10.5 — les déclarations de couleur de police et de fond doivent aller de pair : un texte
 * dont la couleur est imposée sans fond déclaré devient illisible si l'utilisateur force
 * ses propres couleurs.
 */
export const COLOR_DECLARATION_PROBE = `(() => {
  ${SHARED}
  const DEFAULT_COLORS = ['rgb(0, 0, 0)', 'rgb(22, 22, 22)', 'rgba(0, 0, 0, 0)'];
  const results = [];
  const seen = new Set();

  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    if (results.length >= 40) break;
    if (!isVisible(element)) continue;
    const own = Array.from(element.childNodes).some((n) => n.nodeType === 3 && (n.textContent || '').trim().length > 1);
    if (!own) continue;

    const style = getComputedStyle(element);
    if (DEFAULT_COLORS.includes(style.color)) continue;

    let hasBackground = false;
    let current = element;
    while (current && current.nodeType === 1) {
      const bg = getComputedStyle(current).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') { hasBackground = true; break; }
      current = current.parentElement;
    }

    const key = selectorFor(element) + '|' + style.color;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      selector: selectorFor(element),
      text: (element.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 50),
      color: style.color,
      hasBackground: hasBackground,
    });
  }
  return results;
})()`

/** Déclencheurs de modales présents dans la page : boutons pointant vers un dialogue. */
export const MODAL_TRIGGERS_PROBE = `(() => {
  ${SHARED}
  const triggers = [];
  for (const trigger of Array.from(document.querySelectorAll('[aria-controls]'))) {
    const id = trigger.getAttribute('aria-controls');
    if (!id) continue;
    const target = document.getElementById(id);
    if (!target) continue;
    if (!target.classList.contains('fr-modal') && target.getAttribute('role') !== 'dialog' && target.getAttribute('aria-modal') !== 'true') continue;
    if (!isVisible(trigger)) continue;
    triggers.push({
      modalId: id,
      triggerSelector: selectorFor(trigger),
      triggerLabel: (trigger.getAttribute('aria-label') || trigger.textContent || trigger.getAttribute('title') || '')
        .replace(/\\s+/g, ' ')
        .trim()
        .slice(0, 60),
    });
  }
  return triggers;
})()`

/**
 * Script d'amorçage recensant les écouteurs d'événements.
 *
 * Il doit être installé **avant** le moindre script de la page (`addInitScript`) : un écouteur
 * posé par React à l'hydratation serait sinon déjà enregistré et invisible. On enveloppe
 * `addEventListener` sans en changer le comportement, on note seulement le type d'événement.
 */
export const INTERACTION_REGISTRY_INIT = `
  window.__auditListenerTypes = new Set();
  const nativeAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    try { window.__auditListenerTypes.add(String(type)); } catch (error) {}
    return nativeAddEventListener.call(this, type, listener, options);
  };
`

/** Lecture du registre, une fois la page hydratée. */
export const INTERACTION_REGISTRY_PROBE = `(() => {
  return {
    listenerTypes: Array.from(window.__auditListenerTypes || []).sort(),
    accessKeys: Array.from(document.querySelectorAll('[accesskey]')).map((element) => element.getAttribute('accesskey')),
  };
})()`
