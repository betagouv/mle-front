/**
 * Sondes exécutées **dans la page** par Playwright.
 *
 * Elles sont écrites sous forme de chaînes : Playwright les évalue dans le contexte du
 * navigateur, où rien du CLI n'existe. Chaque sonde est autonome (elle réinjecte les
 * fonctions communes) et ne renvoie que des valeurs sérialisables.
 */

export type TContrastSample = {
  selector: string
  text: string
  color: string
  background: string
  ratio: number
  fontSizePx: number
  bold: boolean
  /** Seuil applicable : 3 pour un texte large, 4,5 sinon (RGAA 3.2). */
  threshold: number
  /** Vrai quand le fond effectif n'est pas déterminable (transparence, image, dégradé). */
  backgroundUncertain: boolean
}

export type TFocusSample = {
  selector: string
  label: string
  /** Vrai si le style change visiblement à la prise de focus. */
  visible: boolean
  detail: string
  /**
   * Contraste de l'indicateur avec le fond adjacent, exigé à 3.0 minimum par le test 10.7.1.
   * `null` quand l'indicateur n'est pas un contour : une ombre portée ou un changement de
   * fond ne se ramène pas à un couple de couleurs mesurable, et l'écran cesse alors d'être
   * intégralement couvert.
   */
  indicatorContrast: number | null
}

export type TFocusableElement = {
  selector: string
  label: string
  documentOrder: number
}

export type TOverflowSample = {
  selector: string
  overflowPx: number
}

export type TViewportProbe = {
  widthPx: number
  documentScrollWidth: number
  documentClientWidth: number
  offenders: TOverflowSample[]
}

/** Fonctions communes à toutes les sondes, réinjectées dans chacune. */
const HELPERS = `
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

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

  function labelFor(element) {
    const aria = element.getAttribute('aria-label');
    if (aria && aria.trim()) return aria.trim().slice(0, 60);
    const text = (element.innerText || element.textContent || '').replace(/\\s+/g, ' ').trim();
    if (text) return text.slice(0, 60);
    const title = element.getAttribute('title');
    if (title && title.trim()) return title.trim().slice(0, 60);
    const img = element.querySelector('img[alt]');
    if (img && img.getAttribute('alt')) return img.getAttribute('alt').slice(0, 60);
    return '';
  }

  function isVisible(element) {
    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
    if (element.closest('[aria-hidden="true"], [hidden]')) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Texte réellement peint à l'écran. Distinct de isVisible : un contenu masqué visuellement
   * mais restitué vocalement (fr-sr-only, technique du clip) existe pour le lecteur d'écran,
   * mais mesurer son contraste n'a aucun sens — il n'est jamais vu.
   */
  function isPainted(element) {
    if (!isVisible(element)) return false;
    let current = element;
    while (current && current.nodeType === 1) {
      const style = getComputedStyle(current);
      const clipped = (style.clip && style.clip !== 'auto') || (style.clipPath && style.clipPath !== 'none');
      const rect = current.getBoundingClientRect();
      if (clipped && rect.width <= 4 && rect.height <= 4) return false;
      if (style.position === 'absolute' && rect.width <= 1 && rect.height <= 1) return false;
      current = current.parentElement;
    }
    return true;
  }
`

/** Calcul de contraste WCAG 2.1, dans la page pour disposer des couleurs réellement appliquées. */
const COLOR_HELPERS = `
  function parseColor(value) {
    const match = /rgba?\\(([^)]+)\\)/.exec(value || '');
    if (!match) return null;
    const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  function blend(top, bottom) {
    const alpha = top.a;
    return { r: top.r * alpha + bottom.r * (1 - alpha), g: top.g * alpha + bottom.g * (1 - alpha), b: top.b * alpha + bottom.b * (1 - alpha), a: 1 };
  }

  function relativeLuminance(color) {
    const channel = (value) => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  }

  function contrastRatio(a, b) {
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function effectiveBackground(element) {
    let current = element;
    let accumulated = null;
    let uncertain = false;
    while (current && current.nodeType === 1) {
      const style = getComputedStyle(current);
      if (style.backgroundImage && style.backgroundImage !== 'none') uncertain = true;
      const color = parseColor(style.backgroundColor);
      if (color && color.a > 0) {
        accumulated = accumulated ? blend(accumulated, color) : color;
        if (color.a >= 1) return { color: accumulated, uncertain: uncertain };
      }
      current = current.parentElement;
    }
    const white = { r: 255, g: 255, b: 255, a: 1 };
    return { color: accumulated ? blend(accumulated, white) : white, uncertain: true };
  }
`

/**
 * Contrastes texte/fond (RGAA 3.2 et 3.3). Un échantillon par couple
 * (sélecteur, couleur, fond) : les listes de résultats produiraient sinon des centaines
 * de mesures identiques.
 */
export const CONTRAST_PROBE = `(() => {
  ${HELPERS}
  ${COLOR_HELPERS}
  const MAX_SAMPLES = 400;
  const samples = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && samples.length < MAX_SAMPLES) {
    const text = (node.textContent || '').replace(/\\s+/g, ' ').trim();
    const element = node.parentElement;
    // Les composants désactivés sont explicitement hors du champ du critère 3.2, et un texte
    // masqué visuellement n'a pas de contraste à mesurer.
    //
    // L'étiquette d'un champ désactivé est un cas à part : elle n'est pas *dans* le champ mais
    // à côté, si bien qu'un closest('[disabled]') ne la voit pas. Le DSFR marque le groupe d'un
    // modificateur « --disabled » ; on l'exclut aussi, et on remonte le for= de l'étiquette
    // jusqu'à son contrôle pour trancher sur l'état réel plutôt que sur la classe.
    let excluded = element ? element.closest('[disabled], [aria-disabled="true"], .fr-sr-only, [class*="--disabled"]') : null;
    if (!excluded && element && element.tagName === 'LABEL') {
      const controlId = element.getAttribute('for');
      const control = controlId ? document.getElementById(controlId) : element.querySelector('input, select, textarea');
      if (control && (control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true')) excluded = control;
    }
    if (text.length >= 2 && element && !excluded && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName) && isPainted(element)) {
      const style = getComputedStyle(element);
      const foreground = parseColor(style.color);
      if (foreground) {
        const background = effectiveBackground(element);
        const composed = foreground.a < 1 ? blend(foreground, background.color) : foreground;
        const fontSizePx = parseFloat(style.fontSize) || 16;
        const bold = (parseInt(style.fontWeight, 10) || 400) >= 700;
        const large = fontSizePx >= 24 || (bold && fontSizePx >= 18.5);
        const backgroundLabel = 'rgb(' + Math.round(background.color.r) + ', ' + Math.round(background.color.g) + ', ' + Math.round(background.color.b) + ')';
        const key = selectorFor(element) + '|' + style.color + '|' + backgroundLabel;
        if (!seen.has(key)) {
          seen.add(key);
          samples.push({
            selector: selectorFor(element),
            text: text.slice(0, 60),
            color: style.color,
            background: backgroundLabel,
            ratio: Math.round(contrastRatio(composed, background.color) * 100) / 100,
            fontSizePx: Math.round(fontSizePx * 10) / 10,
            bold: bold,
            threshold: large ? 3 : 4.5,
            backgroundUncertain: background.uncertain,
          });
        }
      }
    }
    node = walker.nextNode();
  }
  return samples;
})()`

/**
 * Visibilité *et* contraste de la prise de focus (RGAA 10.7).
 *
 * Le test 10.7.1 demande deux choses : que l'indication visuelle existe, et qu'elle atteigne
 * un ratio de contraste de 3.0. La seconde n'était pas mesurée. Elle l'est ici quand
 * l'indicateur est un contour — on compare sa couleur au fond effectif de l'élément.
 *
 * Aucun plafond d'échantillonnage : le critère porte sur *chaque* élément susceptible de
 * recevoir le focus, et s'arrêter aux soixante premiers interdisait toute conclusion.
 */
export const FOCUS_PROBE = `(() => {
  ${HELPERS}
  ${COLOR_HELPERS}
  function signature(style) {
    return [style.outlineStyle, style.outlineWidth, style.outlineColor, style.boxShadow, style.backgroundColor, style.borderColor, style.textDecorationLine].join('|');
  }
  const samples = [];
  const elements = Array.from(document.querySelectorAll(FOCUSABLE)).filter(isVisible);
  for (const element of elements) {
    const before = signature(getComputedStyle(element));
    element.focus({ preventScroll: true });
    const after = signature(getComputedStyle(element));
    const style = getComputedStyle(element);
    const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;

    let indicatorContrast = null;
    if (hasOutline) {
      const outlineColor = parseColor(style.outlineColor);
      // Le contour est peint *hors* de la boîte de l'élément : le fond pertinent est celui du
      // parent. Partir de l'élément lui-même ferait passer pour incertain tout lien du DSFR,
      // dont le soulignement est un linear-gradient posé sur sa propre boîte.
      const background = effectiveBackground(element.parentElement || element);
      // Un fond réellement incertain (image, dégradé) ne permet pas d'affirmer le ratio.
      if (outlineColor && !background.uncertain) {
        indicatorContrast = Math.round(contrastRatio(blend(outlineColor, background.color), background.color) * 100) / 100;
      }
    }

    samples.push({
      selector: selectorFor(element),
      label: labelFor(element),
      visible: before !== after || hasOutline,
      detail: hasOutline
        ? 'contour ' + style.outlineWidth + ' ' + style.outlineStyle + (indicatorContrast === null ? ', contraste non mesurable' : ', contraste ' + indicatorContrast + ':1')
        : before !== after
          ? 'style modifié au focus, contraste non mesurable'
          : 'aucun changement visuel',
      indicatorContrast: indicatorContrast,
    });
  }
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  return samples;
})()`

/**
 * Ordre des éléments focusables dans le document.
 *
 * Chaque élément est marqué : le relevé de tabulation lira ce repère plutôt que de faire
 * correspondre des sélecteurs. Deux éléments distincts produisent souvent le même sélecteur
 * court (`div > ul > li > a`), ce qui rendrait la comparaison des deux ordres fausse.
 */
export const DOCUMENT_ORDER_PROBE = `(() => {
  ${HELPERS}
  return Array.from(document.querySelectorAll(FOCUSABLE))
    .filter(isVisible)
    .map((element, index) => {
      element.setAttribute('data-audit-doc-order', String(index));
      return { selector: selectorFor(element), label: labelFor(element), documentOrder: index };
    });
})()`

/** Débordement horizontal : reflow 320 px (RGAA 10.11) et zoom 200 % (RGAA 10.4). */
export const OVERFLOW_PROBE = `(() => {
  ${HELPERS}
  const viewportWidth = document.documentElement.clientWidth;
  const offenders = [];
  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    if (offenders.length >= 12) break;
    if (!isVisible(element)) continue;
    const rect = element.getBoundingClientRect();
    const overflow = Math.round(rect.right - viewportWidth);
    // Un conteneur qui déborde parce que son enfant déborde n'est pas remonté deux fois.
    if (overflow > 1 && rect.width > 8 && element.children.length === 0) {
      offenders.push({ selector: selectorFor(element), overflowPx: overflow });
    }
  }
  return {
    widthPx: viewportWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    documentClientWidth: viewportWidth,
    offenders: offenders,
  };
})()`

/**
 * Feuille de style imposant l'espacement du texte exigé par le RGAA 10.12
 * (interlignage 1,5× ; espacement des paragraphes 2× ; lettres 0,12em ; mots 0,16em).
 */
export const TEXT_SPACING_CSS = `
  * {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p, li, h1, h2, h3, h4, h5, h6 {
    margin-bottom: 2em !important;
  }
`
