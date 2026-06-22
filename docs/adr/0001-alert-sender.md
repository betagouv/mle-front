# ADR 0001 — Alert sender (envoi par batch des alertes logement)

Statut : accepté · Domaine : notifications étudiants

## Contexte

Les étudiants configurent des **alertes** (`student_alert`) décrivant une recherche
de logement (ville/département/académie, prix max, colocation, accessibilité). Quand
un logement correspond à une alerte, un **job d'envoi** (`alert_job`) est créé. Le rôle
d'`alert-sender` est uniquement de **consommer** ces jobs : il transforme les jobs
`pending` en emails et met à jour leur statut. Il ne décide pas *quand* un logement
matche une alerte — cette production de jobs est hors de son périmètre.

## Décision

L'envoi est un **batch idempotent piloté par un cron**, et non un envoi synchrone au
moment du matching. Ce découplage via la table `alert_job` permet :

- de **regrouper** plusieurs logements en **un seul email par étudiant** (moins de bruit) ;
- de **rejouer** sans risque : seuls les jobs `pending` sont traités, donc un job déjà
  `sent` n'est jamais renvoyé ;
- de **tracer** chaque tentative (`status`, `attempts`, `sentAt`, `error`).

### Mécanique de `sendPendingAlertJobs()`

1. **Replanifie les échecs récupérables** : tout job `failed` dont `attempts < MAX_ATTEMPTS`
   repasse en `pending` (et son `error` est effacé). C'est le **retry automatique**.
2. Sélectionne tous les `alert_job` en statut `pending` (jointure `user` + `accommodation`),
   ce qui inclut les jobs tout juste replanifiés.
3. **Regroupe par email** : une `Map<email, batch>` accumule les logements et les `jobIds`.
4. Pour chaque étudiant : envoie **un** email via Brevo (`sendStudentAlertEmail`).
5. Selon le résultat, met à jour **tous les jobs du batch** :
   - succès → `status = 'sent'`, `sentAt = now`, `attempts + 1` ;
   - échec → `status = 'failed'`, `error = message`, `attempts + 1`.

Le résultat renvoyé est `{ sent, failed, requeued }`. `--dry-run` simule sans rien écrire
(les échecs récupérables sont seulement comptés et inclus dans la sélection), `--verbose`
détaille chaque étudiant.

### Politique de retry

Un job dispose de **`MAX_ATTEMPTS` tentatives au total** (constante exportée par
`alert-sender.ts`, valeur `3`). À chaque exécution du cron, les jobs `failed` encore sous
ce plafond sont remis en `pending` puis réessayés ; `attempts` est incrémenté à chaque
envoi. Une fois `attempts` égal à `MAX_ATTEMPTS`, le job reste **`failed` définitivement**
et n'est plus replanifié (intervention manuelle requise pour le forcer). Avec deux créneaux
par jour, le budget de tentatives d'un job s'épuise donc en ~1 journée.

## Récurrence

La planification vit dans `cron.json` (et non dans le code applicatif). La commande CLI
`send-alert-jobs` est déclenchée **tous les jours à 12h00 et 20h00** :

```
0 12,20 * * *  npx tsx cli/index.ts send-alert-jobs
```

```mermaid
flowchart TD
    cron["cron.json — 0 12,20 * * *<br/>(12h &amp; 20h chaque jour)"] -->|npx tsx| cli["CLI: send-alert-jobs"]
    cli --> svc["sendPendingAlertJobs()"]

    subgraph BDD
      jobs[("alert_job")]
    end

    svc -->|"1 · requeue: failed &amp; attempts &lt; MAX → pending"| jobs
    svc -->|"2 · SELECT pending"| jobs
    svc -->|"3 · regroupe par email"| batch["1 batch = 1 étudiant<br/>N logements"]
    batch -->|"4 · 1 email / étudiant"| brevo["Brevo<br/>sendStudentAlertEmail"]
    brevo -->|succès| sent["UPDATE → sent<br/>sentAt, attempts+1"]
    brevo -->|échec| failed["UPDATE → failed<br/>error, attempts+1"]
    sent --> jobs
    failed --> jobs
    failed -.->|"attempts = MAX"| dead["échec définitif<br/>(plus de retry)"]
```

À chaque réveil du cron : les `failed` encore sous le plafond sont replanifiés, puis tous
les `pending` (nouveaux + replanifiés) sont traités ; les `sent` sont ignorés, ce qui rend
les exécutions répétées sûres.

## Fichiers concernés

| Rôle | Fichier |
|------|---------|
| Logique d'envoi | `src/server/services/alert-sender.ts` |
| Commande CLI | `cli/commands/send-alert-jobs.ts` |
| Planification | `cron.json` |
| Table des jobs | `src/server/db/schema/alert-jobs.ts` |
| Table des alertes | `src/server/db/schema/student-alerts.ts` |
| Envoi email | `sendStudentAlertEmail` dans `src/server/services/brevo.ts` |

## Conséquences

- ✅ Découplage matching ⇄ envoi, regroupement par étudiant, exécutions rejouables.
- ✅ Traçabilité par job (`attempts`, `error`, `sentAt`).
- ✅ Retry automatique des échecs jusqu'à `MAX_ATTEMPTS`, borné pour éviter les boucles
  infinies ; au-delà, échec définitif nécessitant une intervention manuelle.
- ⚠️ Latence max d'envoi ≈ une demi-journée (créneaux 12h / 20h) ; un échec récupérable
  ajoute jusqu'à un demi-jour de délai par tentative.
