import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { type Browser, type BrowserContext, chromium, type Page } from 'playwright'
import { normalizeCookie } from '../collect'
import type { TAuditPage } from '../types'
import { probeModals } from './modals'
import {
  CONTRAST_PROBE,
  DOCUMENT_ORDER_PROBE,
  FOCUS_PROBE,
  OVERFLOW_PROBE,
  type TContrastSample,
  TEXT_SPACING_CSS,
  type TFocusableElement,
  type TFocusSample,
  type TViewportProbe,
} from './probes'
import {
  COLOR_DECLARATION_PROBE,
  INTERACTION_REGISTRY_INIT,
  INTERACTION_REGISTRY_PROBE,
  LINK_IN_TEXT_PROBE,
  MOVING_CONTENT_PROBE,
  type TColorDeclaration,
  type TInteractionRegistry,
  type TLinkInText,
  type TModalProbe,
  type TMovingContent,
} from './probes-interaction'

/** Cache des relevés navigateur. Hors de docs/ et gitignoré, comme le HTML collecté. */
export const BROWSER_CACHE_DIR = '.audit-rgaa-cache/browser'

/** Largeur de référence de l'audit. Le zoom 200 % revient à diviser cette largeur par deux. */
const DESKTOP_VIEWPORT = { width: 1280, height: 900 }
const ZOOM_200_VIEWPORT = { width: 640, height: 900 }
const REFLOW_VIEWPORT = { width: 320, height: 800 }

export type TAxeViolation = {
  id: string
  impact: string
  help: string
  helpUrl: string
  nodes: { target: string; summary: string }[]
}

export type TTabStop = {
  order: number
  selector: string
  label: string
  /** Rang du même élément dans l'ordre du document, ou -1 s'il n'y figurait pas. */
  documentOrder: number
}

export type TBrowserSnapshot = {
  scope: string
  url: string
  /** DOM après hydratation : contient les widgets rendus côté client. */
  hydratedHtml: string
  contrast: TContrastSample[]
  focus: TFocusSample[]
  documentOrder: TFocusableElement[]
  tabOrder: TTabStop[]
  reflow320: TViewportProbe
  zoom200: TViewportProbe
  textSpacing: TViewportProbe
  axe: TAxeViolation[]
  /** Widgets clients effectivement présents dans le DOM hydraté. */
  renderedWidgets: string[]
  /** Modales ouvertes au clavier puis auditées comme des écrans à part entière. */
  modals: TModalProbe[]
  movingContent: TMovingContent[]
  linksInText: TLinkInText[]
  colorDeclarations: TColorDeclaration[]
  /** Modes d'interaction câblés par la page : sert à prouver l'inapplicabilité de 12.10, 13.10 et 13.12. */
  interaction: TInteractionRegistry
}

export type TBrowserOptions = {
  baseUrl: string
  cookie?: string
  fromCache?: boolean
  verbose?: boolean
}

/**
 * Version du format de relevé. À incrémenter dès qu'une sonde est ajoutée ou modifiée :
 * la clé de cache en dépend, ce qui périme les relevés antérieurs plutôt que de les servir
 * amputés des champs qu'un analyseur attend désormais. Sans cela, `--from-cache` produirait
 * des verdicts calculés sur des données absentes.
 */
const SNAPSHOT_VERSION = 7

function cacheKey(url: string): string {
  return createHash('sha1').update(`v${SNAPSHOT_VERSION}|${url}`).digest('hex')
}

/** Sélecteurs prouvant qu'un widget rendu côté client est bien présent après hydratation. */
const WIDGET_SELECTORS: Record<string, string> = {
  'leaflet-map': '.leaflet-container',
  'recharts-pie': '.recharts-wrapper',
  'dsfr-modals': '.fr-modal',
}

async function detectWidgets(page: Page): Promise<string[]> {
  const found: string[] = []
  for (const [widget, selector] of Object.entries(WIDGET_SELECTORS)) {
    if ((await page.locator(selector).count()) > 0) found.push(widget)
  }
  return found
}

/**
 * Relève l'ordre de tabulation réel. On tabule depuis le début du document et on note
 * l'élément actif à chaque arrêt : c'est le seul moyen d'observer l'ordre effectif, que
 * `tabindex` et le positionnement CSS peuvent désaccorder de l'ordre du DOM (RGAA 12.8).
 */
async function readTabOrder(page: Page, maxStops: number): Promise<TTabStop[]> {
  const stops: TTabStop[] = []
  await page.evaluate('document.body.focus?.(); if (document.activeElement instanceof HTMLElement) document.activeElement.blur()')

  for (let index = 0; index < maxStops; index++) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(`(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return null;
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
      const label = (element.getAttribute('aria-label') || element.innerText || element.textContent || element.getAttribute('title') || '')
        .replace(/\\s+/g, ' ')
        .trim()
        .slice(0, 60);
      const alreadySeen = element.hasAttribute('data-audit-tab-stop');
      element.setAttribute('data-audit-tab-stop', '1');
      const documentOrder = element.hasAttribute('data-audit-doc-order') ? Number(element.getAttribute('data-audit-doc-order')) : -1;
      return { selector: parts.join(' > ').slice(0, 120), label: label, alreadySeen: alreadySeen, documentOrder: documentOrder };
    })()`)

    if (!stop) break
    const typed = stop as { selector: string; label: string; alreadySeen: boolean; documentOrder: number }
    // Fin du parcours : le focus revient sur un élément déjà visité. Le repère est posé sur
    // l'élément lui-même et non sur son sélecteur — deux éléments distincts peuvent produire
    // le même sélecteur court, ce qui interromprait le relevé au premier doublon apparent.
    if (typed.alreadySeen) break
    stops.push({ order: index, selector: typed.selector, label: typed.label, documentOrder: typed.documentOrder })
  }

  await page.evaluate(
    `document.querySelectorAll('[data-audit-tab-stop], [data-audit-doc-order]').forEach((el) => {
      el.removeAttribute('data-audit-tab-stop');
      el.removeAttribute('data-audit-doc-order');
    })`,
  )
  return stops
}

async function probeViewport(page: Page, viewport: { width: number; height: number }, extraCss?: string): Promise<TViewportProbe> {
  await page.setViewportSize(viewport)
  let styleHandle: string | undefined
  if (extraCss) {
    styleHandle = 'audit-rgaa-text-spacing'
    await page.evaluate(
      `(() => {
        const style = document.createElement('style');
        style.id = ${JSON.stringify(styleHandle)};
        style.textContent = ${JSON.stringify(extraCss)};
        document.head.appendChild(style);
      })()`,
    )
  }
  await page.waitForTimeout(150)
  const probe = (await page.evaluate(OVERFLOW_PROBE)) as TViewportProbe
  if (styleHandle) {
    await page.evaluate(`document.getElementById(${JSON.stringify(styleHandle)})?.remove()`)
  }
  return probe
}

/** Chemin du bundle axe-core, résolu depuis node_modules sans dépendre du système de modules. */
function axeSourcePath(): string {
  const candidate = path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js')
  if (!fs.existsSync(candidate)) {
    throw new Error(`axe-core introuvable (${candidate}) — lancez « pnpm install »`)
  }
  return candidate
}

async function runAxe(page: Page): Promise<TAxeViolation[]> {
  // addScriptTag et non evaluate : axe.min.js est un script complet, pas une expression.
  await page.addScriptTag({ content: fs.readFileSync(axeSourcePath(), 'utf-8') })
  const result = (await page.evaluate(`axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations)`)) as {
    id: string
    impact: string | null
    help: string
    helpUrl: string
    nodes: { target: string[]; failureSummary?: string }[]
  }[]

  return result.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? 'inconnu',
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.slice(0, 5).map((node) => ({
      target: node.target.join(' '),
      summary: (node.failureSummary ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
    })),
  }))
}

async function snapshotUrl(context: BrowserContext, scope: string, url: string, verbose?: boolean): Promise<TBrowserSnapshot> {
  const page = await context.newPage()
  try {
    // Avant toute navigation : le recensement des écouteurs doit précéder les scripts de la page.
    await page.addInitScript(INTERACTION_REGISTRY_INIT)
    await page.setViewportSize(DESKTOP_VIEWPORT)
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    const status = response?.status() ?? 0
    if (status !== 200) {
      const hint = status === 404 ? ' (page authentifiée ? vérifiez --cookie)' : ''
      throw new Error(`Collecte navigateur impossible : ${url} → HTTP ${status}${hint}`)
    }

    // Les widgets clients arrivent après l'hydratation : sans cette attente, on retomberait
    // sur les angles morts que cette passe est justement censée lever.
    await page.waitForTimeout(1200)

    const renderedWidgets = await detectWidgets(page)
    const hydratedHtml = await page.content()
    const contrast = (await page.evaluate(CONTRAST_PROBE)) as TContrastSample[]
    const focus = (await page.evaluate(FOCUS_PROBE)) as TFocusSample[]
    const documentOrder = (await page.evaluate(DOCUMENT_ORDER_PROBE)) as TFocusableElement[]
    const tabOrder = await readTabOrder(page, Math.min(documentOrder.length + 5, 80))
    const axe = await runAxe(page)

    const movingContent = (await page.evaluate(MOVING_CONTENT_PROBE)) as TMovingContent[]
    const linksInText = (await page.evaluate(LINK_IN_TEXT_PROBE)) as TLinkInText[]
    const colorDeclarations = (await page.evaluate(COLOR_DECLARATION_PROBE)) as TColorDeclaration[]
    const interaction = (await page.evaluate(INTERACTION_REGISTRY_PROBE)) as TInteractionRegistry
    // Les modales sont sondées en dernier : les ouvrir déplace le focus et fige le défilement.
    const modals = await probeModals(page)

    const zoom200 = await probeViewport(page, ZOOM_200_VIEWPORT)
    const reflow320 = await probeViewport(page, REFLOW_VIEWPORT)
    const textSpacing = await probeViewport(page, DESKTOP_VIEWPORT, TEXT_SPACING_CSS)

    if (verbose) {
      console.log(
        `    [${scope}] ${contrast.length} mesure(s) de contraste, ${focus.length} élément(s) focusables, ` +
          `${tabOrder.length} arrêt(s) de tabulation, ${modals.length} modale(s), ${axe.length} violation(s) axe`,
      )
    }

    return {
      scope,
      url,
      hydratedHtml,
      contrast,
      focus,
      documentOrder,
      tabOrder,
      reflow320,
      zoom200,
      textSpacing,
      axe,
      renderedWidgets,
      modals,
      movingContent,
      linksInText,
      colorDeclarations,
      interaction,
    }
  } finally {
    await page.close()
  }
}

/**
 * Collecte navigateur d'une feuille. Elle ne remplace pas la collecte HTTP : elle la
 * complète. Le HTML serveur reste la référence pour tout ce qui doit être vrai **sans**
 * JavaScript ; le DOM hydraté sert à lever les angles morts et à mesurer le rendu.
 */
export async function collectPageWithBrowser(browser: Browser, page: TAuditPage, options: TBrowserOptions): Promise<TBrowserSnapshot[]> {
  const snapshots: TBrowserSnapshot[] = []
  const context = await browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    locale: 'fr-FR',
    userAgent: 'mle-audit-rgaa/1.0 (playwright)',
  })

  try {
    // Même normalisation que la collecte HTTP : le cookie peut être fourni en valeur seule.
    const cookie = normalizeCookie(options.cookie)
    if (page.auth && cookie) {
      const separator = cookie.indexOf('=')
      await context.addCookies([
        {
          name: cookie.slice(0, separator),
          value: cookie.slice(separator + 1),
          url: options.baseUrl,
        },
      ])
    }

    for (const target of page.urls) {
      const url = `${options.baseUrl}${target.path}`
      const cachePath = path.join(BROWSER_CACHE_DIR, `${cacheKey(url)}.json`)

      if (options.fromCache && fs.existsSync(cachePath)) {
        snapshots.push(JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as TBrowserSnapshot)
        continue
      }

      const snapshot = await snapshotUrl(context, target.scope, url, options.verbose)
      fs.mkdirSync(BROWSER_CACHE_DIR, { recursive: true })
      fs.writeFileSync(cachePath, `${JSON.stringify(snapshot)}\n`, 'utf-8')
      snapshots.push(snapshot)
    }
  } finally {
    await context.close()
  }

  return snapshots
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true })
}
