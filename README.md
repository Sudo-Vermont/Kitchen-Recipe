# Recipe Kitchen

Recipe Kitchen helps home cooks discover recipes, see the calories before they commit, and know what
every ingredient costs at the store.

- Browse and search a seeded recipe library
- Filter by category, dietary preference, and maximum calories
- Per-serving nutrition, instructions, and Walmart shopping links on every recipe
- Add, edit, and delete recipes
- Save recipes and keep a shopping list in the browser
- Import a recipe from a cooking video

## Live preview

A static preview of the interface is published to GitHub Pages by
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) on every push to `main`.

**The preview is the frontend only.** GitHub Pages serves static files, so it cannot run the Express
API, PostgreSQL, Clerk, or the ffmpeg/Gemini video pipeline. The build sets `VITE_DEMO=true`, which:

- answers the app's `/api/recipes*` calls from sample data bundled into the frontend
  ([`src/demo/`](artifacts/recipe-kitchen/src/demo)),
- keeps added and edited recipes in memory for the life of the tab — nothing is persisted,
- replaces Clerk with a stub that reports a signed-out state,
- disables video import, which genuinely needs a server.

Browsing, searching, filtering, recipe detail, and the add/edit forms all work. Treat it as a look at
the interface, not a working deployment.

### Enabling it

Pages has to be switched on once, by hand: **Settings → Pages → Build and deployment → Source →
GitHub Actions**. The workflow deploys on the next push to `main`, or run it from the Actions tab.

## Running the real app

Requires Node.js 24, pnpm 10, and a PostgreSQL database.

```bash
pnpm install
```

Set `DATABASE_URL` to a Postgres connection string, then:

```bash
pnpm --filter @workspace/db run push          # push the schema (dev only)
pnpm --filter @workspace/api-server run dev   # API server on port 5000
```

The frontend needs `PORT` and `BASE_PATH` in the environment:

```bash
cd artifacts/recipe-kitchen
PORT=5173 BASE_PATH=/ pnpm run dev
```

Other useful commands:

```bash
pnpm run typecheck                              # across all packages
pnpm run build                                  # typecheck + build everything
pnpm --filter @workspace/api-spec run codegen   # regenerate hooks from the OpenAPI spec
```

## Layout

| Path | What lives there |
| --- | --- |
| `artifacts/recipe-kitchen/src/` | React pages, app shell, recipe cards, visual styling |
| `artifacts/recipe-kitchen/src/demo/` | Sample data and stubs for the static Pages build |
| `artifacts/api-server/src/routes/` | Recipe CRUD, filtering, summaries, video import |
| `lib/api-spec/openapi.yaml` | Source of truth for the API contract |
| `lib/db/src/schema/recipes.ts` | Postgres schema and nested JSON fields |

## Stack

pnpm workspaces · TypeScript 5.9 · React + Vite + Tailwind CSS v4 · Express 5 · PostgreSQL with
Drizzle ORM · Zod · Orval codegen · Clerk auth
