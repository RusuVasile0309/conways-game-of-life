# Story 7.4: SQLite Repository via Prisma (full-stretch upgrade)

Status: done

## Story

As the future maintainer,
I want a Prisma + SQLite-backed `SqlitePatternRepository` implementation,
so that saved patterns survive server restarts.

**Priority:** Stretch
**FR/NFR coverage:** FR14, FR15
**Estimated effort:** M

## Acceptance Criteria

**AC1 — Schema and migration:**
Given `api/prisma/schema.prisma` matches the architecture §5.4 schema,
When `pnpm prisma migrate dev` is run (from workspace root or `api/`),
Then the migration produces a `patterns.db` file at `api/data/patterns.db`.

**AC2 — SqlitePatternRepository contract:**
Given `SqlitePatternRepository` implements `PatternRepository`,
When registered to `PatternsModule` in place of the in-memory implementation,
Then all controller behaviour from story 7.1 is preserved (the same Jest contract tests pass against the Prisma-backed implementation).

**AC3 — Injection token refactor:**
Given `PatternsController` is updated to inject via `PATTERN_REPOSITORY` token,
When `pnpm nx test api` runs,
Then controller spec passes with the token-based mock (no direct reference to concrete repository class).

**AC4 — CI clean:**
Given `pnpm nx test api` and `pnpm nx lint api` (or typecheck if configured),
When both run on the PR,
Then zero failures.

**AC5 — Honest README fallback (if Prisma stalls):**
Given the candidate runs out of time on Prisma,
When the in-memory implementation remains in place,
Then the README notes the SQLite tier as "designed but not landed; in-memory ships" — explicit and honest, not hidden.

## Tasks / Subtasks

- [x] Task 1: Install Prisma and add dependencies (AC1)
  - [x] Add `@prisma/client` to `api/package.json` → `dependencies`
  - [x] Add `prisma` to `api/package.json` → `devDependencies`
  - [x] Run `pnpm install` from workspace root to update lockfile

- [x] Task 2: Create `api/prisma/schema.prisma` (AC1)
  - [x] Generator block: `provider = "prisma-client-js"`
  - [x] Datasource: `provider = "sqlite"`, `url = "file:../data/patterns.db"` (relative to schema → puts DB at `api/data/patterns.db`)
  - [x] `Pattern` model with `id String @id @default(uuid())`, `name String`, `width Int`, `height Int`, `liveCells String` (JSON), `createdAt DateTime @default(now())`

- [x] Task 3: Generate Prisma client and run migration (AC1)
  - [x] `pnpm exec prisma generate --schema=api/prisma/schema.prisma`
  - [x] `pnpm exec prisma migrate dev --name init --schema=api/prisma/schema.prisma`
  - [x] Verify `api/data/patterns.db` exists after migration
  - [x] Add `api/data/*.db` to root `.gitignore` (commit migrations, NOT the binary db file)

- [x] Task 4: Create `PrismaService` (AC2)
  - [x] New file: `api/src/prisma/prisma.service.ts`
  - [x] Standard NestJS pattern: `@Injectable() class PrismaService extends PrismaClient implements OnModuleInit`
  - [x] `async onModuleInit() { await this.$connect(); }`

- [x] Task 5: Define `PATTERN_REPOSITORY` injection token (AC2, AC3)
  - [x] New file: `api/src/patterns/pattern-repository.token.ts`
  - [x] `export const PATTERN_REPOSITORY = 'PATTERN_REPOSITORY';`

- [x] Task 6: Create `SqlitePatternRepository` (AC2)
  - [x] New file: `api/src/patterns/prisma.repository.ts`
  - [x] `@Injectable() class SqlitePatternRepository implements PatternRepository`
  - [x] Constructor injects `PrismaService`
  - [x] Private `toSavedPattern(row)` helper: JSON.parse liveCells, `.toISOString()` on `createdAt Date`
  - [x] `list()` → `prisma.pattern.findMany({ orderBy: { createdAt: 'desc' } })`
  - [x] `get(id)` → `prisma.pattern.findUnique({ where: { id } })` → null if not found
  - [x] `create(input)` → `prisma.pattern.create({ data: { ...input, liveCells: JSON.stringify(input.liveCells) } })`

- [x] Task 7: Update `PatternsController` to use injection token (AC3)
  - [x] Replace `private readonly repo: InMemoryPatternRepository` with `@Inject(PATTERN_REPOSITORY) private readonly repo: PatternRepository`
  - [x] Add `Inject` to `@nestjs/common` import; add `PatternRepository` type import from `@conways-game-of-life/types`
  - [x] Remove import of `InMemoryPatternRepository`

- [x] Task 8: Update `PatternsModule` to wire `SqlitePatternRepository` (AC2)
  - [x] Add `PrismaService` and `SqlitePatternRepository` as providers
  - [x] Add `{ provide: PATTERN_REPOSITORY, useExisting: SqlitePatternRepository }` provider
  - [x] Remove `InMemoryPatternRepository` registration

- [x] Task 9: Create `prisma.repository.spec.ts` contract tests (AC2, AC4)
  - [x] Mock `PrismaService` via Jest mock factory
  - [x] `list()`: mock `findMany` returning Prisma rows → verify `SavedPattern[]` shape + JSON.parse of liveCells + createdAt ISO string
  - [x] `get(id)`: mock `findUnique` with a row → verify mapped result; mock returning `null` → verify `null` returned
  - [x] `create(input)`: mock `create` → verify `liveCells` is JSON.stringify'd in the call args; verify returned `SavedPattern`

- [x] Task 10: Update `patterns.controller.spec.ts` to use token (AC3, AC4)
  - [x] Replace `provide: InMemoryPatternRepository` with `provide: PATTERN_REPOSITORY`
  - [x] Replace `module.get(InMemoryPatternRepository)` with `module.get<jest.Mocked<PatternRepository>>(PATTERN_REPOSITORY)`
  - [x] Adjust type annotation from `jest.Mocked<InMemoryPatternRepository>` to `jest.Mocked<PatternRepository>`

- [x] Task 11: Handle webpack externals for Prisma native binary (AC2 — serve/build)
  - [x] Add `externals: [{ '@prisma/client': 'commonjs @prisma/client' }]` to `api/webpack.config.js`
  - [x] This ensures `nx build api` / `nx serve api` doesn't try to bundle Prisma's query engine binary

- [x] Task 12: Verify CI checks (AC4)
  - [x] `pnpm nx test api` — 20/20 pass (3 suites: controller spec + in-memory spec + prisma repository spec)
  - [x] `pnpm nx lint api` — 0 errors

## Dev Notes

### Critical: `api/` lives at the workspace root, NOT `apps/api/`

The NestJS app was scaffolded to `api/` (not `apps/api/` as the architecture doc says). All file paths in this story use `api/` as the prefix. Check `api/package.json` to confirm the project root.

### Prisma schema (matches architecture §5.4 exactly)

```prisma
// api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../data/patterns.db"
}

model Pattern {
  id        String   @id @default(uuid())
  name      String
  width     Int
  height    Int
  liveCells String   // JSON-encoded [number, number][]
  createdAt DateTime @default(now())
}
```

The URL `file:../data/patterns.db` is resolved relative to `schema.prisma`'s location (`api/prisma/`), so the DB lands at `api/data/patterns.db`. Create the `api/data/` directory with `.gitkeep` and add `api/data/*.db` to `.gitignore`.

### `PrismaService` (standard NestJS pattern)

```typescript
// api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

No `OnModuleDestroy`/`$disconnect` needed for development — NestJS handles cleanup on `app.close()`.

### Injection token — define once, import everywhere

```typescript
// api/src/patterns/pattern-repository.token.ts
export const PATTERN_REPOSITORY = 'PATTERN_REPOSITORY';
```

Use `.js` extension in all imports (e.g., `from './pattern-repository.token.js'`) because `api/tsconfig.app.json` uses `moduleResolution: nodenext`.

### `SqlitePatternRepository` — JSON serialization is the key logic

```typescript
// api/src/patterns/prisma.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PatternRepository, SavedPattern } from '@conways-game-of-life/types';

@Injectable()
export class SqlitePatternRepository implements PatternRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toSavedPattern(row: {
    id: string; name: string; width: number; height: number;
    liveCells: string; createdAt: Date;
  }): SavedPattern {
    return {
      id: row.id,
      name: row.name,
      width: row.width,
      height: row.height,
      liveCells: JSON.parse(row.liveCells) as [number, number][],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(): Promise<SavedPattern[]> {
    const rows = await this.prisma.pattern.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.toSavedPattern(r));
  }

  async get(id: string): Promise<SavedPattern | null> {
    const row = await this.prisma.pattern.findUnique({ where: { id } });
    return row ? this.toSavedPattern(row) : null;
  }

  async create(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern> {
    const row = await this.prisma.pattern.create({
      data: {
        name: input.name,
        width: input.width,
        height: input.height,
        liveCells: JSON.stringify(input.liveCells),
      },
    });
    return this.toSavedPattern(row);
  }
}
```

### Updated `PatternsModule`

```typescript
// api/src/patterns/patterns.module.ts
import { Module } from '@nestjs/common';
import { PATTERN_REPOSITORY } from './pattern-repository.token.js';
import { SqlitePatternRepository } from './prisma.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PatternsController } from './patterns.controller.js';

@Module({
  providers: [
    PrismaService,
    SqlitePatternRepository,
    { provide: PATTERN_REPOSITORY, useExisting: SqlitePatternRepository },
  ],
  controllers: [PatternsController],
})
export class PatternsModule {}
```

### Updated `PatternsController` injection

```typescript
// api/src/patterns/patterns.controller.ts — CHANGES ONLY
import { Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, Post } from '@nestjs/common';
import type { PatternRepository } from '@conways-game-of-life/types';
import { PATTERN_REPOSITORY } from './pattern-repository.token.js';
import { CreatePatternDto } from './dto/create-pattern.dto.js';

@Controller('patterns')
export class PatternsController {
  constructor(
    @Inject(PATTERN_REPOSITORY) private readonly repo: PatternRepository,
  ) {}
  // list(), get(), create() bodies unchanged
}
```

### Updated `patterns.controller.spec.ts` — token-based mock

```typescript
// CHANGED: provider and repo extraction
providers: [
  {
    provide: PATTERN_REPOSITORY,
    useValue: { list: jest.fn(), get: jest.fn(), create: jest.fn() },
  },
],

// CHANGED: repo type
let repo: jest.Mocked<PatternRepository>;
repo = module.get<jest.Mocked<PatternRepository>>(PATTERN_REPOSITORY);
```

Import `PATTERN_REPOSITORY` from `./pattern-repository.token.js`; remove import of `InMemoryPatternRepository`.

### `prisma.repository.spec.ts` — mock PrismaService, test serialization

The test file mocks `PrismaService` via a plain object with jest.fn() stubs. No real DB needed.

```typescript
import { SqlitePatternRepository } from './prisma.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

const mockPrismaRow = {
  id: 'abc-123',
  name: 'Glider',
  width: 5,
  height: 5,
  liveCells: '[[1,0],[2,1]]',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('SqlitePatternRepository', () => {
  let repo: SqlitePatternRepository;
  let prisma: jest.Mocked<Pick<PrismaService, 'pattern'>>;

  beforeEach(() => {
    prisma = {
      pattern: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      } as any,
    };
    repo = new SqlitePatternRepository(prisma as unknown as PrismaService);
  });

  describe('list()', () => { ... });
  describe('get(id)', () => { ... });
  describe('create(input)', () => { ... });
});
```

Key assertions for serialization:
- `list()` result has `liveCells` as `[[1,0],[2,1]]` (array, not string)
- `create()` call to `prisma.pattern.create` has `liveCells: '[[1,0]]'` (string, not array)
- `createdAt` in result is an ISO string like `'2026-01-01T00:00:00.000Z'`

### Webpack + Prisma binary — add external

```javascript
// api/webpack.config.js — ADD to module.exports
externals: [{ '@prisma/client': 'commonjs @prisma/client' }],
```

Add alongside the existing `plugins: [...]` key. Without this, the webpack bundle will fail to load Prisma's native query engine binary at runtime.

### `.gitignore` entries to add

```
# SQLite database files (generated at runtime — migrations are committed, binary is not)
api/data/*.db
```

Do NOT gitignore `api/prisma/migrations/` — migration files are committed and define the schema history.

### `moduleResolution: nodenext` — always use `.js` extensions

`api/tsconfig.app.json` sets `"moduleResolution": "nodenext"`. Every relative import in `api/src/**/*.ts` must end in `.js`:

```typescript
// CORRECT
import { PrismaService } from '../prisma/prisma.service.js';
import { PATTERN_REPOSITORY } from './pattern-repository.token.js';

// WRONG — tsc will fail
import { PrismaService } from '../prisma/prisma.service';
```

`@conways-game-of-life/types` is a path-alias import (not relative) — no `.js` needed there.

### Keeping `InMemoryPatternRepository` (do not delete)

`in-memory.repository.ts` and `in-memory.repository.spec.ts` stay in the repo even after the module is rewired to SQLite. They document the fallback implementation and serve as a reference for developers who need to run without a DB. Do not delete them.

### Why `useExisting` vs `useClass`

`{ provide: PATTERN_REPOSITORY, useExisting: SqlitePatternRepository }` avoids creating a second instance of `SqlitePatternRepository`. If you used `useClass`, NestJS would instantiate it twice (once as itself and once for the token), doubling DB connections. `useExisting` aliases the token to the already-registered provider.

### Project Structure Notes

```
api/
├── prisma/
│   ├── schema.prisma              ← NEW (matches arch §5.4)
│   └── migrations/                ← NEW (generated by prisma migrate dev; committed)
│       └── 20260514000000_init/
│           └── migration.sql
├── data/
│   ├── .gitkeep                   ← NEW (keep dir; *.db is gitignored)
│   └── patterns.db                ← gitignored (generated at runtime)
└── src/
    ├── prisma/
    │   └── prisma.service.ts      ← NEW
    └── patterns/
        ├── pattern-repository.token.ts  ← NEW
        ├── prisma.repository.ts         ← NEW
        ├── prisma.repository.spec.ts    ← NEW
        ├── patterns.controller.ts       ← MODIFY (inject via token)
        ├── patterns.controller.spec.ts  ← MODIFY (token-based mock)
        ├── patterns.module.ts           ← MODIFY (wire SqlitePatternRepository)
        ├── in-memory.repository.ts      ← KEEP (fallback reference, unchanged)
        └── in-memory.repository.spec.ts ← KEEP (unchanged)
```

### Nx tag constraint

`api` has `scope:server`. It may import from `scope:types` (for `PatternRepository`/`SavedPattern`) — this is already established in story 7.1. It may NOT import from `scope:api-client`, `scope:ui`, `scope:app`. `@prisma/client` is an npm package, not an Nx lib — no tag restriction applies.

### References

- [Source: docs/planning-artifacts/epics.md#Story-7.4] — ACs, user story
- [Source: docs/planning-artifacts/architecture.md#5.4] — Prisma schema, repository interface, persistence strategy rationale
- [Source: docs/planning-artifacts/architecture.md#4.8] — why Prisma over TypeORM, SQLite over Postgres
- [Source: api/src/patterns/in-memory.repository.ts] — existing impl to contrast with Prisma impl
- [Source: api/src/patterns/patterns.controller.ts] — controller that receives the repository token
- [Source: api/src/patterns/patterns.controller.spec.ts] — spec to update with token
- [Source: api/src/patterns/patterns.module.ts] — module to rewire
- [Source: api/tsconfig.app.json] — `moduleResolution: nodenext` → `.js` extensions required
- [Source: api/webpack.config.js] — webpack config to extend with Prisma external
- [Source: libs/types/src/lib/types.ts] — `PatternRepository`, `SavedPattern` interfaces
- [Source: docs/implementation-artifacts/story-7-3-save-and-load-ui-in-the-web-app.md] — 7.3 notes on api CORS and existing module wiring

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `pnpm exec prisma` not found at workspace root — Prisma binary installed under `api/node_modules/.bin/prisma`, invoked as `api/node_modules/.bin/prisma generate|migrate dev --schema=api/prisma/schema.prisma`
- `@prisma/client` generates to workspace pnpm store (`node_modules/.pnpm/@prisma+client@6.0.0_prisma@6.0.0/...`); `prisma generate` + `prisma migrate dev` both succeed; `api/data/patterns.db` created at correct path relative to schema
- Controller spec originally typed `repo` as `jest.Mocked<InMemoryPatternRepository>` and used concrete class as DI token — updated to `jest.Mocked<PatternRepository>` and `PATTERN_REPOSITORY` string token; all 5 tests continue to pass

### Senior Developer Review (AI)

**Review Date:** 2026-05-14
**Outcome:** Changes Requested (4 items fixed in-session)

**Action Items — all resolved:**
- [x] [High] CI will fail on fresh clone — `prisma generate` not run after `pnpm install --frozen-lockfile`; `Pattern` type missing → fixed: added `prisma generate` step to lint/typecheck/test jobs in `ci.yml`; added `generate` Nx target with `dependsOn` on `test`
- [x] [Medium] `pnpm-lock.yaml` missing from story File List → added to File List
- [x] [Medium] No Prisma scripts in `api/package.json` → added `prisma:generate`, `prisma:migrate`, `prisma:studio` scripts
- [x] [Medium] Double `repo.create()` call in `prisma.repository.spec.ts:120–129` → collapsed to single call with two assertions
- [x] [Low] `liveCells String` in `schema.prisma` missing JSON comment → added `// JSON-encoded [number, number][]`

### Completion Notes List

- `api/prisma/schema.prisma` created matching architecture §5.4 exactly; datasource URL `file:../data/patterns.db` resolves to `api/data/patterns.db`
- Migration `20260514133525_init` created and applied; `api/data/patterns.db` verified present
- `PrismaService` created (`extends PrismaClient implements OnModuleInit`); `$connect()` called in `onModuleInit`
- `PATTERN_REPOSITORY = 'PATTERN_REPOSITORY'` token defined in `pattern-repository.token.ts`
- `SqlitePatternRepository` created: `toSavedPattern` helper handles `JSON.parse(liveCells)` and `createdAt.toISOString()`; `list` orders by `createdAt desc`; `create` JSON-stringifies liveCells before DB write
- `PatternsController` refactored to `@Inject(PATTERN_REPOSITORY) repo: PatternRepository` — decoupled from concrete class
- `PatternsModule` rewired: `PrismaService` + `SqlitePatternRepository` registered; `{ provide: PATTERN_REPOSITORY, useExisting: SqlitePatternRepository }` aliased; `InMemoryPatternRepository` removed from providers (class file kept for reference)
- `prisma.repository.spec.ts` created: 10 tests cover `list`, `get`, `create` including serialization round-trips and null handling; mocks `PrismaService.pattern` inline without extra libraries
- `patterns.controller.spec.ts` updated to token-based injection; all 5 tests pass unchanged in behaviour
- `api/webpack.config.js` extended with `externals: [{ '@prisma/client': 'commonjs @prisma/client' }]` to prevent webpack bundling the native query engine binary
- `api/data/*.db` added to `.gitignore`; `api/data/.gitkeep` committed to preserve directory
- Final: `pnpm nx test api` → 20/20 (3 suites), `pnpm nx lint api` → 0 errors, `pnpm nx test api-client` → 9/9 (no regressions)

### File List

- `api/package.json` — modified (`@prisma/client` dep + `prisma` devDep added)
- `api/prisma/schema.prisma` — created (Prisma schema matching arch §5.4)
- `api/prisma/migrations/20260514133525_init/migration.sql` — created (auto-generated by `prisma migrate dev`)
- `api/data/.gitkeep` — created (keeps data dir in git without committing the .db file)
- `api/src/prisma/prisma.service.ts` — created (NestJS PrismaService)
- `api/src/patterns/pattern-repository.token.ts` — created (PATTERN_REPOSITORY injection token)
- `api/src/patterns/prisma.repository.ts` — created (SqlitePatternRepository)
- `api/src/patterns/prisma.repository.spec.ts` — created (10 contract tests)
- `api/src/patterns/patterns.controller.ts` — modified (inject via PATTERN_REPOSITORY token)
- `api/src/patterns/patterns.controller.spec.ts` — modified (token-based mock)
- `api/src/patterns/patterns.module.ts` — modified (wire SqlitePatternRepository + PrismaService)
- `api/webpack.config.js` — modified (externals for @prisma/client)
- `.gitignore` — modified (`api/data/*.db` entry added)
- `pnpm-lock.yaml` — modified (new deps: @prisma/client, prisma)
- `.github/workflows/ci.yml` — modified (prisma generate step added to lint/typecheck/test jobs)
- `docs/implementation-artifacts/sprint-status.yaml` — modified (story status → review)
- `docs/implementation-artifacts/story-7-4-sqlite-repository-via-prisma-full-stretch-upgrade.md` — this file
