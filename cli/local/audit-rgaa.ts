import type { Command } from 'commander'
import { auditRgaa } from '../commands/audit-rgaa'

/**
 * Enregistrement de la commande d'audit RGAA.
 *
 * Ce fichier vit dans `cli/local/`, qui n'est pas versionné : la commande et son moteur
 * (`cli/commands/audit-rgaa/`) restent sur le poste de l'auteur. `cli/index.ts` charge ce
 * dossier s'il existe, sans rien savoir de son contenu — le dépôt reste donc utilisable
 * tel quel pour qui ne l'a pas.
 */
export default function register(program: Command): void {
  program
    .command('audit-rgaa')
    .description("Génère le classeur d'audit RGAA 4.1 (une feuille par page auditée, 106 critères)")
    .option('--out <dir>', 'Dossier de sortie', 'docs/audit-rgaa')
    .option('--base-url <url>', 'URL de base du site à auditer', 'http://localhost:3000')
    .option('--cookie <value>', 'Cookie de session des pages authentifiées : valeur seule ou paire nom=valeur (sinon AUDIT_SESSION_COOKIE)')
    .option('--accommodation <slug>', 'Fiche logement à auditer (sinon la plus riche en base)')
    .option('--from-cache', 'Réutiliser le HTML déjà collecté')
    .option('--browser', 'Ajouter la passe navigateur : rendu réel, contrastes calculés, focus, reflow 320px, zoom 200%, axe-core')
    .option('--csv', 'Écrire aussi chaque feuille en CSV')
    .option('--check', 'Vérifier le modèle sans rien écrire (code 1 si incohérence)')
    .option('--refresh-referentiel', 'Re-télécharger le référentiel RGAA depuis la DINUM')
    .option('--verbose', 'Afficher le détail de la collecte et de la sélection')
    .action((opts) => auditRgaa(opts))
}
