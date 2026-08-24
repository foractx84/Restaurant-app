# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Local dev (most common)
- `nvm use` — Node `>=24.12.0` is required (`.nvmrc` pins `24.12.0`). System Node is usually too old.
- `npm install` — runs `husky install` via `prepare`.
- `npm run dev` — `cross-env NODE_ENV=development nodemon` (ts-node + tsconfig-paths). **Note:** `cross-env` hardcodes `NODE_ENV=development`, which *overrides* `.env`. Some features key off `NODE_ENV` (see "Env-gated features" below).
- `NODE_ENV=localhost npx nodemon` — alternative dev command that mounts the Swagger UI at `/api-docs/`. Use this when you need the interactive API explorer; `npm run dev` does not expose it.

### Build / start (compile to `dist/`)
- `npm run build` — `tsc && tsc-alias` (tsc-alias rewrites `@/...` path aliases in compiled JS).
- `npm run start-local` / `start-dev` / `start-stage` / `start-prod` — each builds, then runs `node dist/server.js` with the matching `.env.<env>.local` file via `env-cmd`. Those env files are git-ignored and must be created locally.

### Tests
- `npm test` — Jest unit tests under `src/__tests__/unit/**`. Sub-suites: `test-controllers`, `test-services`, `test-models`, `test-middlewares`.
- `npx jest path/to/file.test.ts` — single-file run.
- `npm run test:integration` — pulls the seeded test DB image from GCP Artifact Registry, spins it up on port 2346, and runs **ordered** integration tests via `Scripts/integration_tests.sh`. Tests share DB state and must run in the order defined in the script — do not parallelize, do not reorder. Adding a new integration suite means adding a `jest ... && sleep 3` line to that script.
- `npm run test:integration-local` — same, but assumes the DB is already running on port 2346 (skips the `docker pull/run`).

### Lint
- `npm run lint` / `npm run lint:fix` — ESLint over `src/**.ts`. Husky `pre-commit` runs `lint-staged`, which currently only does `prettier --write` on staged `.ts` files (no eslint-on-commit).

### Database (seeded test image, from GCP Artifact Registry)
The historical schema is **not** in this repo (`src/migration/` is empty and unused). It lives in the prebuilt image `us-east1-docker.pkg.dev/taptab-cloud-infrastructure/database/taptab-test-database:latest`. To start it locally:
```
gcloud auth login && gcloud auth configure-docker us-east1-docker.pkg.dev
docker run -dit --name taptab-test-database -p 2346:5432 \
  us-east1-docker.pkg.dev/taptab-cloud-infrastructure/database/taptab-test-database:latest
```
The bundled `Scripts/taptab_docker_start_db.sh` does the same thing on port **2345**, but `.env` defaults to **2346** — match `DB_PORT` in `.env` to whichever you use. The Database itself lives in a separate repo (`taptabapp/Database`).

### Schema changes — sibling `Database` repo (`taptabapp/Database`)
Schema lives in a separate repo: `Database` (sibling directory `../Database`). Patches are numbered SQL files in `Database/patches/patch-v0-NN.sql`, applied in order by `Database/scripts/install_patches.sh`, and tracked in the `public.db_patches` table inside Postgres. `src/migration/` in this repo is empty and unused; TypeORM `synchronize: false`.

**Workflow for a schema change**:
1. In the `Database` repo, add `patches/patch-v0-<next>.sql` (next number after the highest existing patch). Use the existing convention: `-- Created: YYYY/MM/DD`, `BEGIN; … INSERT INTO public.db_patches (patch_name) VALUES ('patch-v0-NN.sql'); END TRANSACTION;`. Prefer `IF NOT EXISTS` on DDL.
2. In this repo (and TapTab-Backend if applicable), add/modify the entity files in the SAME ticket as a paired PR. The SQL in the `Database` PR is canonical; entities mirror it column-for-column.
3. Apply the patch locally before merge: `docker exec -i taptab-test-database psql -U ttdbadmin -d taptabdb < ../Database/patches/patch-v0-<next>.sql`. Verify with `\d <table>`.
4. Merge the `Database` PR first — its GitHub Action (`gcp-build-push.yml`) rebuilds the seeded test image at `us-east1-docker.pkg.dev/taptab-cloud-infrastructure/database/taptab-test-database:latest`, which `npm run test:integration` pulls.
5. Apply patch to staging/prod via the team's normal path; deploy app code after the schema is live.

**Hard rule**: in any environment, the patch must be applied **before** deploying app code that references the new schema, or the app crashes on first query.

**Cross-repo coordination**: schema is shared with TapTab-Backend (separate NestJS repo). 26+ entities are already duplicated by name across the two repos — when changing a shared table, update entity files in both repos in paired PRs alongside the single canonical `Database` patch.

### Docker (cloud build / deploy)
- `ENV=dev|staging|prod make build` — Cloud build path (overwrites `.env`; intended for CI).
- `ENV=dev make build-local && ENV=dev make run` — Local container build that respects your existing `.env`. Container port 3000 is mapped to host **3100** (matching `npm run dev`'s default).
- `ENV=dev make push` / `make deploy` / `make rollback` — GCP Cloud Run flow (requires `gcloud` auth + access to `taptab-cloud-infrastructure` project).

## Architecture

### Composition root: `src/routes.ts` (manual DI)
A single ~500-line file wires every Model → Service → Controller → Route by hand. There is no DI container. Adding a new service means:
1. Instantiate the model.
2. Construct the service, threading dependent services into the constructor.
3. Construct the controller around the service.
4. Construct the route around the controller.
5. Add the route to the exported `routes` array.

Service order in `routes.ts` is not alphabetical because some services depend on others (explicit comment at the top of the services section). Be careful when moving things around.

**Stripe Connect circular-dependency workaround** (`routes.ts:309-323`): `RestaurantsService` and `StripeConnectService` reference each other, so `StripeConnectService` is wired in via a mutable proxy ref that's populated *after* `RestaurantsService` is constructed. Don't try to "clean up" by inlining either side.

### Layering: parallel `models/` and `entities/`
- `src/models/*.model.ts` — hand-written queries using a shared `pg.Pool` (`src/databases/index.ts`). This is the primary data path.
- `src/entities/*.entity.ts` — TypeORM entities used for some query paths and join-heavy reads. Both layers coexist; pick whichever the surrounding code already uses.
- `src/services/*` — business logic, orchestrate across models. Most route handlers go through services, but a few `models/` are passed directly into other models (e.g. `MenusModel` constructor — there's a TODO in `routes.ts` to factor that out).
- `src/controllers/*` — Express handlers; minimal logic, mostly request mapping + service calls.
- `src/routes/*` — Express `Router` definitions; attach middlewares + bind controller methods.

TypeORM is pinned at **0.2.34** (legacy `createConnection` API). Upgrading to 0.3.x is a breaking change — don't do it casually.

### Auth (`src/middlewares/authorization.middleware.ts`)
Route protection is configured by **path prefix** in `src/app.ts:72-95` — a hardcoded list of prefixes (`/menus`, `/menuItem`, `/announcements`, …) gets `authorizationMiddleware` applied *before* the matching `Router` is mounted. Adding a new protected resource → add its prefix to that list. Both the singular (`/menuItem`) and plural (`/menuItems`) prefixes are listed separately because they're separate routers.

The middleware reads `Authorization: Bearer <jwt>` **and** `restaurantid` headers and stuffs `managerID`/`restaurantID`/`isSuper` onto `res.locals`.

### Stripe webhook raw body (`src/app.ts:58-64`)
`express.json()` is conditionally skipped for `POST /stripe/webhook` because Stripe needs the raw body to verify signatures. Don't move JSON parsing earlier in the chain.

### Queue: pg-boss on the **same** DB (`src/queue/index.ts`)
`pg-boss` is started in `server.ts` after the TypeORM connection succeeds, using the same Postgres credentials. It auto-creates its own schema (`pgboss.*`) on first run.

The single registered queue is `CHECKMATE_MENU_SYNC` (5 concurrent workers, 3 retries with backoff). Webhook handler at `POST /checkmate/webhook` enqueues jobs with `singletonKey: 'location-${location_id}'` + `singletonNextSlot: true` to dedupe overlapping syncs for the same Checkmate location. Worker is `CheckmateIntegrationService.processCheckmateJob`.

### Menu sync (`src/menu-sync/`)
Standalone subsystem implementing the diff-and-apply pipeline that turns a Checkmate menu snapshot into a sequence of DB writes. Detailed flow in `Documentation/MENU_SYNC.md`. Layout:
- `processor/` — diffing, merging, ordering of operations.
- `commands/` — one folder per entity type (`menu/`, `section/`, `item/`, `modifier/`, `modifier-group/`, `hour/`, `item-image/`); each command implements the actual DB mutation.
- `builders/atomic-sync-change.builder.ts` — assembles atomic change records.
- `context-factory.ts` — per-job context (DB conn, integration record, options).

When changing menu sync, prefer to add or modify a single command rather than the processor pipeline.

### Path aliases
Defined in `tsconfig.json` under `compilerOptions.paths` (e.g. `@services/*`, `@models/*`, `@queue`, `@databases`). Resolution at runtime:
- **Dev**: `ts-node -r tsconfig-paths/register` (in `nodemon.json`).
- **Build**: `tsc-alias` runs after `tsc` to rewrite the aliases in the emitted JS.
- **Tests**: `jest.config.js` regenerates the same map via `pathsToModuleNameMapper`, plus per-test mocks for `pg-boss` (`__mocks__/pg-boss.ts`) and `@queue` (`__mocks__/boss.ts`).

If `npm test` ever fails with "cannot find module '@…'", first check `jest.config.js`'s `moduleNameMapper`, not the source code.

### Env-gated features
- **Swagger UI** (`src/app.ts:103-138`) — only mounts when `NODE_ENV === 'localhost'`. `npm run dev` sets `NODE_ENV=development`, so the UI is hidden by default in dev. Use `NODE_ENV=localhost npx nodemon` (or `npm run start-local` after creating `.env.localhost.local`) to expose it. Spec source is `swagger.yaml` in repo root, not JSDoc comments (despite the `swagger-jsdoc` dep being installed).
- **Database host log line** (`src/app.ts:166-172`) — only printed when `NODE_ENV === 'development'`.
- **CORS** — `production` restricts to `CORS_ORIGIN`; everything else is open.

### Validation
`src/utils/validateEnv.ts` only validates `NODE_ENV` and `API_PORT` at boot. Everything else (Stripe, SendGrid, GCP credentials, JWT secret) is read lazily from `process.env` and only fails when the relevant feature is exercised. A missing `SENDGRID_API_KEY` will not prevent the server from starting; it'll just blow up the first time someone hits a route that sends mail.

### Native modules
`bcrypt` and `sharp` are native; the Dockerfile explicitly does `npm rebuild bcrypt sharp` after install. After switching Node versions locally, run the same to avoid `Error: Could not locate the bindings file`.
