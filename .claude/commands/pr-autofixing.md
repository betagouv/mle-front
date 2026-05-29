Address and fix open review comments on the current PR for this repository.

## Steps

1. Detect the current branch with `git branch --show-current`, then find the associated open PR:
   ```
   gh pr view $(git branch --show-current) --repo betagouv/monlogementetudiant --json number,title,state
   ```

2. Fetch all open review comments:
   ```
   gh api repos/betagouv/monlogementetudiant/pulls/<pr-number>/comments
   ```
   Note: the `body` field contains the reviewer's message, `path` is the file, `line` is the line number.

3. For each comment, read the full relevant file before making any change. Understand the schema (Drizzle), imports, and existing patterns before editing.

4. Apply the fixes. Common patterns in this codebase:
   - `and(eq(...), eq(...))` for compound Drizzle WHERE clauses (`and` is imported from `drizzle-orm`)
   - `trpc.admin.<router>.pathKey()` to invalidate an entire tRPC namespace instead of individual queries
   - `Promise.all([...])` when running multiple async invalidations in parallel
   - Drizzle schema is in `src/server/db/schema/auth.ts` and sibling files — check field names there before using them

5. After all fixes are applied, run format and lint:
   ```
   pnpm lint:format
   ```
   Fix any reported issues before committing.

6. Run a build check to ensure no TypeScript or compilation errors:
   ```
   pnpm build
   ```
   If the build fails, diagnose and fix before committing.

7. Commit the fixes with a clear message describing what was addressed.

8. Report to the user:
   - What was fixed (one line per comment)
   - Any comments that were ambiguous or require human judgement (do not guess — ask)

## Constraints

- never mention CLAUDE as co-author in commits. 
- Only address changes explicitly requested in review comments. Do not refactor unrelated code.
- Always read files before editing them.
- Do not force-push or skip hooks (`--no-verify`).
- If a comment references a field that doesn't exist in the schema, check the actual schema file — don't assume.
- If a comment is unclear or could mean multiple things, ask the user before applying changes.
