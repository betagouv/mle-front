-- Rend `immutable_unaccent` insensible au `search_path` de l'appelant.
--
-- Le corps appelait `unaccent($1)` sans qualification. `pg_dump` préfixe tout dump d'un
-- `set_config('search_path', '', false)` (CVE-2018-1058) : à la restauration, construire un index
-- fonctionnel évalue le corps de la fonction, `unaccent` n'est plus résolvable, et `pg_restore`
-- saute l'index en ne laissant qu'un `errors ignored on restore: N`. Les index sur colonnes simples
-- passent, les index fonctionnels non — c'est ainsi que staging a perdu `idx_cities_name_trgm` et
-- `idx_cities_name_unaccent`, faisant tomber `territories.search` en Seq Scan (~4 s contre ~4 ms).
--
-- La forme à deux arguments qualifie à la fois la fonction (`public.unaccent`) et le dictionnaire
-- (`'public.unaccent'::regdictionary`), donc plus rien ne dépend du `search_path`. On garde une
-- fonction SQL sans clause `SET` : une clause `SET` bloquerait l'inlining par le planificateur et
-- ferait diverger l'expression de la requête de celle stockée dans l'index.
--
-- Les valeurs produites sont identiques à l'ancien corps (le dictionnaire par défaut résolu via
-- search_path était déjà `public.unaccent`) : le contenu des index existants reste valide, pas de
-- REINDEX nécessaire.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$
LANGUAGE sql IMMUTABLE PARALLEL SAFE;--> statement-breakpoint

-- Recrée les deux index perdus lors d'une restauration. No-op là où ils sont déjà présents (prod).
CREATE INDEX IF NOT EXISTS idx_cities_name_trgm
  ON city USING GIN (immutable_unaccent(name) gin_trgm_ops);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_cities_name_unaccent
  ON city (LOWER(immutable_unaccent(name)));
