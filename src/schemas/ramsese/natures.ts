/**
 * Liste blanche des codes « nature d'UAI » (nomenclature RAMSESE) à conserver pour
 * l'affichage des établissements à proximité d'une résidence.
 *
 * Périmètre = unités d'enseignement / établissements « student-facing ». On exclut
 * volontairement les services communs, services inter-établissements et supports
 * recherche (515–519, 525–529, 531–532, 534–535, 547, 556, 557) qui ne sont pas des
 * lieux d'étude pertinents pour un étudiant (SCD, médecine préventive, SCUIO,
 * observatoire, URFIST, IREM…).
 *
 * Inclut certains codes 4xx (STS/CPGE, formations sanitaires/sociales…) que le filtre
 * générique par préfixe « 5 » du service RAMSESE ne capte pas. Passée à
 * `getEtablissementsSuperieurByCodePostal` via `options.natures`.
 */
export const NATURES_ETABLISSEMENTS = [
  '400', // Etablissement composé uniquement de STS et/ou de CPGE
  '410', // Ecole de formation d'enseignants
  '420', // Ecole d'administration publique
  '430', // Ecole de formation sanitaire et sociale (IFSI…)
  '440', // Ecole technico-professionnelle des services
  '445', // Ecole de commerce, gestion, comptabilité, vente
  '450', // Ecole de formation artistique
  '455', // Ecole d'architecture
  '470', // Ecole de formation agricole ou halieutique
  '480', // Ecole technico-professionnelle de production industrielle
  '490', // Ecole juridique
  '499', // Autre formation post-bac
  '502', // Etablissement sans formation diplômante
  '503', // Ecole normale supérieure
  '505', // Etablissement public d'enseignement supérieur
  '506', // Centre régional associé au CNAM
  '507', // Partie délocalisée d'un établissement de l'enseignement supérieur
  '523', // Université
  '524', // Institut national polytechnique
  '530', // Antenne délocalisée d'une composante d'université
  '537', // Unité de formation et de recherche en santé
  '539', // Unité de formation et de recherche (hors santé)
  '540', // Composante d'université avec formation diplômante
  '541', // Institut universitaire professionnalisé
  '542', // Institut universitaire de technologie
  '543', // Antenne délocalisée d'IUT
  '544', // Institut d'administration des entreprises
  '545', // Institut du travail
  '546', // Institut de préparation à l'administration générale
  '550', // Centre universitaire de formation et de recherche
  '551', // Université de technologie
  '553', // Ecole d'ingénieurs
  '554', // Institut d'études politiques
  '555', // Centre de formation aux carrières des bibliothèques
  '558', // Institut universitaire de formation des maîtres
  '559', // Antenne d'IUFM
  '560', // Etablissement d'enseignement général supérieur privé
  '561', // Antenne d'un établissement d'enseignement supérieur privé
  '562', // Institut externe d'un institut catholique
  '568', // Institut national supérieur du professorat et de l'éducation
  '569', // Antenne d'Institut national supérieur du professorat et de l'éducation
  '579', // Autre formation supérieure ancienne classification
  '580', // Ecole d'ingénieurs publique (hors tutelle MESR) ou privée
] as const
