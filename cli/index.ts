import { program } from 'commander'
import { backfillAlertJobsCommand } from './commands/backfill-alert-jobs'
import { backfillBrevoContacts } from './commands/backfill-brevo-contacts'
import { backfillBrevoOwners } from './commands/backfill-brevo-owners'
import { backfillGeocoding } from './commands/backfill-geocoding'
import { compareCrous } from './commands/compare-crous'
import { detectAlertJobsCommand } from './commands/detect-alert-jobs'
import { healthcheck, healthcheckCities } from './commands/healthcheck'
import { importBackup } from './commands/import-backup'
import { importCrousRents } from './commands/import-crous-rents'
import { importCrousSurfaces } from './commands/import-crous-surfaces'
import { importCrousTypologies } from './commands/import-crous-typologies'
import { migrate } from './commands/migrate'
import { migrateUsers } from './commands/migrate-users'
import { purgeContactRequests } from './commands/purge-contact-requests'
import { seedAlertSnapshotCommand } from './commands/seed-alert-snapshot'
import { sendAlertJobs } from './commands/send-alert-jobs'
import { auditStorage } from './commands/storage/auditStorage'
import { uploadImages } from './commands/upload-images'
import { verifyRamsese } from './commands/verify-ramsese'
import { runImport, runSync } from './factory'

program.name('mle').description('MLE CLI tools')

program.command('migrate-users').description('Migrate Django users to better-auth').action(migrateUsers)

program
  .command('backfill-brevo-contacts')
  .description('Rattrape les contacts Brevo de toute la base (étudiants + gestionnaires, admins exclus)')
  .option('--dry-run', 'Simuler sans appeler Brevo')
  .option('--verbose', 'Afficher chaque contact traité')
  .option('--limit <n>', "Limiter le nombre d'utilisateurs", parseInt)
  .option('--batch-size <n>', 'Nombre de requêtes Brevo en parallèle par lot', parseInt)
  .action((opts) => backfillBrevoContacts(opts))

program
  .command('backfill-brevo-owners')
  .description('Rattrape les contacts Brevo des gestionnaires uniquement (role owner), avec log des codes HTTP Brevo')
  .option('--dry-run', 'Simuler sans appeler Brevo')
  .option('--verbose', 'Afficher chaque contact traité')
  .option('--limit <n>', 'Limiter le nombre de gestionnaires', parseInt)
  .option('--batch-size <n>', 'Nombre de requêtes Brevo en parallèle par lot', parseInt)
  .action((opts) => backfillBrevoOwners(opts))

program
  .command('backfill-geocoding')
  .description('Recale les geom aberrantes et les city_id mal résolus des adresses de résidences')
  .option('--phase <phase>', 'report (défaut) | geom | city', 'report')
  .option('--apply', 'Écrire en base (par défaut : dry-run)')
  .option('--verbose', 'Afficher chaque ligne traitée')
  .option('--limit <n>', "Limiter le nombre d'adresses examinées", parseInt)
  .option('--csv <path>', 'Écrire le rapport détaillé dans un CSV')
  .action((opts) => backfillGeocoding({ ...opts, dryRun: !opts.apply }))

program.command('migrate').description('Apply Drizzle migrations').action(migrate)

program
  .command('compare-crous <file>')
  .description('Compare les donnees CROUS du XLSX avec les residences CROUS en BDD')
  .option('--owner <name-or-slug>', 'Owner CROUS a comparer', 'crous')
  .option('--csv <path>', 'Ecrire le rapport dans un fichier CSV')
  .option('--json', 'Afficher les incoherences en JSON')
  .option('--verbose', 'Afficher toutes les incoherences')
  .option('--limit <n>', 'Limiter le nombre de residences du fichier', parseInt)
  .option('--exit-code', 'Retourner un code 1 si des incoherences sont detectees')
  .action((file, opts) => compareCrous(file, opts))

program
  .command('import-crous-surfaces <file>')
  .description('Importe les superficies min/max par typologie depuis le XLSX CROUS')
  .option('--owner <name-or-slug>', 'Owner CROUS a mettre a jour', 'crous')
  .option('--dry-run', 'Simuler sans modifier la BDD')
  .option('--verbose', 'Afficher les residences traitees')
  .option('--limit <n>', 'Limiter le nombre de residences du fichier', parseInt)
  .action((file, opts) => importCrousSurfaces(file, opts))

program
  .command('import-crous-rents <file>')
  .description('Importe les loyers min/max par typologie depuis le XLSX CROUS')
  .option('--owner <name-or-slug>', 'Owner CROUS a mettre a jour', 'crous')
  .option('--dry-run', 'Simuler sans modifier la BDD')
  .option('--verbose', 'Afficher les residences traitees')
  .option('--limit <n>', 'Limiter le nombre de residences du fichier', parseInt)
  .action((file, opts) => importCrousRents(file, opts))

program
  .command('import-crous-typologies <file>')
  .description('Importe les compteurs de typologies et colocation depuis le XLSX CROUS')
  .option('--owner <name-or-slug>', 'Owner CROUS a mettre a jour', 'crous')
  .option('--dry-run', 'Simuler sans modifier la BDD')
  .option('--verbose', 'Afficher les residences traitees')
  .option('--limit <n>', 'Limiter le nombre de residences du fichier', parseInt)
  .option('--replace', 'Remplacer les compteurs de typologies absents par null')
  .action((file, opts) => importCrousTypologies(file, opts))

program
  .command('import-backup')
  .description('Import Scalingo backup into local DB')
  .option('--backup-path <path>', 'Use a local backup file instead of downloading')
  .option('--skip-download', 'Skip download, use existing backup in /tmp/jde-backup/')
  .action(importBackup)

// Import commands (arpej-ibail)
program
  .command('import <type>')
  .description('Import de données (arpej-ibail, crous, csv, fac-habitat)')
  .option('--dry-run', 'Simuler sans modifier la BDD')
  .option('--verbose', 'Afficher les détails')
  .option('--limit <n>', "Limiter le nombre d'éléments", parseInt)
  .option('--file <path>', 'Chemin vers un fichier JSON local')
  .option('--source <name>', 'Identifiant de la source externe')
  .action((type, opts) => runImport(type, opts))

// Sync commands (cities, rents, students, stats)
program
  .command('sync <type>')
  .description('Synchronisation (cities, rents, students, stats)')
  .option('--dry-run', 'Simuler sans modifier la BDD')
  .option('--verbose', 'Afficher les détails')
  .option('--force', 'Forcer la mise à jour')
  .option('--date <date>', 'Date de référence (YYYY-MM-DD)')
  .option('--from <date>', 'Date de début pour sync en batch (YYYY-MM-DD)')
  .option('--to <date>', 'Date de fin pour sync en batch (YYYY-MM-DD, défaut: hier)')
  .option('--only <type>', 'Sync uniquement stats ou events (stats, events)')
  .action((type, opts) => runSync(type, opts))

program
  .command('upload-images <dir>')
  .description('Upload des images depuis un dossier local vers S3 (un sous-dossier = un groupe)')
  .requiredOption('--name <name>', 'Nom du gestionnaire (ex: aclef, acm-habitat)')
  .action((dir, opts) => uploadImages(dir, opts))

program
  .command('healthcheck')
  .description('Vérifie la cohérence des résidences publiées (city_id, URLs)')
  .option('--verbose', 'Afficher le détail de chaque résidence')
  .option('--fetch', 'Tester les URLs en HTTP (nécessite le serveur Next.js)')
  .option('--base-url <url>', 'URL de base pour les tests HTTP', 'http://localhost:3000')
  .action((opts) => healthcheck(opts))

program
  .command('healthcheck-cities')
  .description('Vérifie les pages villes en HTTP (GET /trouver-un-logement-etudiant/ville/{slug})')
  .option('--verbose', 'Afficher le détail de chaque ville')
  .option('--base-url <url>', 'URL de base pour les tests HTTP', 'http://localhost:3000')
  .action((opts) => healthcheckCities(opts))

program
  .command('audit-storage')
  .description('Audite le stockage S3 : URLs cassées et fichiers non référencés en base')
  .option('--csv <dir>', 'Écrire les rapports CSV dans ce dossier')
  .option('--verbose', 'Afficher le détail de chaque problème')
  .option('--write', 'Appliquer les corrections (URLs cassées retirées de la base, fichiers orphelins supprimés de S3)')
  .action((opts) => auditStorage(opts))

program
  .command('seed-alert-snapshot')
  .description('Amorce le snapshot de dispo (baseline) — à jouer une fois avant la détection événementielle')
  .option('--dry-run', 'Simuler sans modifier le snapshot')
  .action((opts) => seedAlertSnapshotCommand(opts))

program
  .command('backfill-alert-jobs')
  .description('Vague initiale : enfile les jobs pour le stock déjà dispo qui matche les alertes existantes (envoi de masse ponctuel)')
  .option('--dry-run', 'Simuler sans enfiler de jobs')
  .option('--verbose', 'Afficher le nombre de jobs candidats')
  .action((opts) => backfillAlertJobsCommand(opts))

program
  .command('detect-alert-jobs')
  .description("Détecte les hausses de disponibilité et crée les jobs d'alerte (pending)")
  .option('--dry-run', 'Simuler sans créer de jobs ni modifier le snapshot')
  .option('--verbose', 'Afficher le détail des hausses détectées')
  .action((opts) => detectAlertJobsCommand(opts))

program
  .command('send-alert-jobs')
  .description("Batcher envoyant les emails d'alertes aux étudiants")
  .option('--dry-run', 'Simuler sans envoyer ni modifier la BDD')
  .option('--verbose', 'Afficher le détail par utilisateur')
  .action((opts) => sendAlertJobs(opts))

program
  .command('purge-contact-requests')
  .description('Purge RGPD : supprime les demandes visiteur non confirmées, anonymise les demandes expirées')
  .option('--dry-run', 'Compter sans modifier la BDD')
  .action((opts) => purgeContactRequests(opts))

program
  .command('verify-ramsese')
  .description('Vérifie la connectivité RAMSESE + le parsing des établissements (à lancer en one-off Scalingo)')
  .option('--cp <codePostal>', 'Code postal à tester', '94000')
  .option('--insee <codes>', 'Codes INSEE directs (séparés par des virgules), court-circuite geo.api')
  .option('--slug <slug>', 'Résidence : récupère CP + coordonnées depuis la BDD (prioritaire)')
  .option('--lat <lat>', 'Latitude de la résidence pour le calcul de distance')
  .option('--lng <lng>', 'Longitude de la résidence pour le calcul de distance')
  .option('--limit <n>', 'Limiter le nombre de détails UAI affichés', parseInt)
  .option('--concurrency <n>', 'Nb de requêtes détail en parallèle (pool borné, défaut 8)', parseInt)
  .option('--no-natures', 'Ne pas filtrer par la liste blanche métier (diagnostic)')
  .option('--national', 'Périmètre national : liste blanche des natures, sans filtre par localisation')
  .option('--etats <codes>', 'Sonde : envoie un critère `etats` (ex. 1) au filtre RAMSESE — un 400 = critère non supporté')
  .option('--json <fichier>', 'Écrire la liste complète des établissements (non tronquée) dans ce fichier .json')
  .option('--dump', 'Afficher le payload JSON complet du 1er UAI')
  .action((opts) => verifyRamsese(opts))

program.parse()
