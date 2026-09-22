# StudioCar AI

Production-oriented automotive image processing built as a pnpm and Turborepo monorepo.

## Requirements

- Node.js 24 or newer
- pnpm 12.3.4

## Workspace commands

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm e2e
```

## Database

The Prisma schema, migrations, and configuration belong to `apps/web`. The
generated client and the repositories shared with the deployable workers live in
`packages/database-runtime`.

```bash
pnpm db:generate        # regenerate the Prisma client
pnpm db:validate        # validate the schema
pnpm db:migrate:deploy  # apply committed migrations
pnpm db:migrate:status  # verify applied migrations
```

Database commands are deliberately invoked directly rather than through
Turborepo, so stateful migration work is never served from a task cache.

Product and architecture requirements live in [`docs/`](./docs/).

