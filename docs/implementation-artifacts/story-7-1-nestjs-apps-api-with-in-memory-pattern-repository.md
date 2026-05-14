# Story 7.1: NestJS `apps/api` with in-memory pattern repository

Status: review

## Story

As Casey,
I want a working NestJS API that holds saved patterns in memory,
so that save/load round-trips work during a single server lifetime.

**Priority:** Stretch
**FR/NFR coverage:** FR14, FR15 (foundation)
**Estimated effort:** M

## Acceptance Criteria

**AC1 — NestJS app scaffolded and running:**
Given the NestJS app at `apps/api`,
When started locally (`pnpm nx serve api`),
Then it listens on port 3333 and exposes `GET /patterns`, `GET /patterns/:id`, `POST /patterns`.

**AC2 — POST /patterns creates and returns a saved pattern:**
Given `InMemoryPatternRepository` registered to the `PatternsModule`,
When a `POST /patterns` is received with a valid body `{ name, width, height, liveCells }`,
Then the response (201) is the saved pattern with a generated UUID `id` and ISO-8601 `createdAt`.

**AC3 — Input validation returns 400:**
Given validation via `class-validator` DTOs,
When a malformed body is posted (missing `name`, `width` out of 5–200 bounds, etc.),
Then the API responds 400 with a structured error.

**AC4 — GET /patterns and GET /patterns/:id work:**
Given one or more saved patterns,
When `GET /patterns` is called,
Then the full list is returned.
When `GET /patterns/:id` is called with a valid id,
Then the matching pattern is returned (404 if not found).

**AC5 — Jest tests pass:**
Given Jest specs for the repository and controller,
When `pnpm nx test api` runs,
Then specs verify list/get/create round-trips and 404 on missing id.

## Tasks / Subtasks

- [x] Task 1: Scaffold NestJS app (AC1)
  - [x] Run `pnpm nx g @nx/nest:app api --tags=scope:server`
  - [x] Verify app listens on port 3333 (set in `main.ts` via `app.listen(3333)`)
  - [x] Confirm `api/` appears in workspace and `nx serve api` starts

- [x] Task 2: Add `SavedPattern` and `PatternRepository` to `libs/types` (AC1, AC2)
  - [x] Add to `libs/types/src/lib/types.ts`
  - [x] Re-export from `libs/types/src/index.ts`

- [x] Task 3: Create `PatternsModule` with repository and controller (AC1, AC2, AC4)
  - [x] Create `api/src/patterns/` directory structure
  - [x] `InMemoryPatternRepository` uses `Map<string, SavedPattern>`, `crypto.randomUUID()` for IDs
  - [x] Register `InMemoryPatternRepository` as provider in `PatternsModule`
  - [x] Import `PatternsModule` in `AppModule`

- [x] Task 4: DTO validation (AC3)
  - [x] Install `class-validator` and `class-transformer`
  - [x] Enable `ValidationPipe` globally in `main.ts`
  - [x] `CreatePatternDto` with name, width (5–200), height (5–200), liveCells validators

- [x] Task 5: Jest tests (AC5)
  - [x] `api/src/patterns/in-memory.repository.spec.ts` — 6 tests: list/get/create/uuid/null
  - [x] `api/src/patterns/patterns.controller.spec.ts` — 4 tests: list/get/404/create
  - [x] `pnpm nx test api` — 10/10 pass

- [x] Task 6: Module boundary check
  - [x] `api/` has tag `scope:server` in `package.json`
  - [x] `api/` imports only from `@conways-game-of-life/types` and NestJS packages
  - [x] `pnpm nx lint api` — 0 errors

## Dev Notes

### Architecture constraints (must follow)

From `docs/planning-artifacts/architecture.md §4.7` and `§5.4`:

**NestJS is mandated** — the brief locks the backend to NestJS if a backend is added. No Express, Fastify, or Hono.

**Generator command:**
```bash
pnpm nx g @nx/nest:app api --tags=scope:server
```
Verify exact flags against installed Nx version — generator surface varies. The key outputs: `apps/api/src/main.ts`, `apps/api/src/app/app.module.ts`, `apps/api/project.json`.

**Port:** `main.ts` must call `await app.listen(3333)`. Document this in README.

**Module boundary tag:** `apps/api` must have `"tags": ["scope:server"]` in `project.json`. The existing boundary rule in `eslint.config.mjs` already has:
```
scope:server → cannot depend on scope:app, scope:ui, scope:api-client
```

### Types location

`SavedPattern` and `PatternRepository` interfaces belong in `libs/types/src/lib/types.ts` (the project's single types file). This is the **only** file to add them to — do not create a separate `pattern-repository.ts` inside `libs/types`.

The exact interfaces from architecture.md §5.4:
```typescript
export interface SavedPattern {
  id: string;
  name: string;
  width: number;
  height: number;
  liveCells: ReadonlyArray<readonly [number, number]>;
  createdAt: string; // ISO 8601
}

export interface PatternRepository {
  list(): Promise<SavedPattern[]>;
  get(id: string): Promise<SavedPattern | null>;
  create(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern>;
}
```

### Repository implementation

From architecture.md §5.4 — `InMemoryPatternRepository` path is `apps/api/src/patterns/in-memory.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import type { PatternRepository, SavedPattern } from '@conways-game-of-life/types';

@Injectable()
export class InMemoryPatternRepository implements PatternRepository {
  private readonly store = new Map<string, SavedPattern>();

  async list(): Promise<SavedPattern[]> {
    return Array.from(this.store.values());
  }

  async get(id: string): Promise<SavedPattern | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: Omit<SavedPattern, 'id' | 'createdAt'>): Promise<SavedPattern> {
    const pattern: SavedPattern = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.store.set(pattern.id, pattern);
    return pattern;
  }
}
```

`crypto.randomUUID()` is available in Node 19+. Check Node version — if older, use `import { randomUUID } from 'crypto'`.

### Controller structure

```typescript
// apps/api/src/patterns/patterns.controller.ts
@Controller('patterns')
export class PatternsController {
  constructor(private readonly repo: InMemoryPatternRepository) {}

  @Get()
  list() { return this.repo.list(); }

  @Get(':id')
  async get(@Param('id') id: string) {
    const pattern = await this.repo.get(id);
    if (!pattern) throw new NotFoundException();
    return pattern;
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePatternDto) {
    return this.repo.create(dto);
  }
}
```

### DTO validation

Enable global `ValidationPipe` in `main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

`CreatePatternDto`:
```typescript
import { IsString, IsNotEmpty, IsInt, Min, Max, IsArray } from 'class-validator';

export class CreatePatternDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(5)
  @Max(200)
  width: number;

  @IsInt()
  @Min(5)
  @Max(200)
  height: number;

  @IsArray()
  liveCells: [number, number][];
}
```

Install if not present:
```bash
pnpm add class-validator class-transformer
```

### PatternsModule

```typescript
@Module({
  providers: [InMemoryPatternRepository],
  controllers: [PatternsController],
})
export class PatternsModule {}
```

Import in `AppModule`:
```typescript
@Module({ imports: [PatternsModule] })
export class AppModule {}
```

### Testing approach

**Repository unit test** (`in-memory.repository.spec.ts`):
- `create()` returns pattern with id and createdAt
- `list()` returns all created patterns
- `get(id)` returns the right pattern
- `get('nonexistent')` returns null

**Controller unit test** (`patterns.controller.spec.ts`):
- Mock `InMemoryPatternRepository` with jest.fn()
- `GET /patterns` → 200, delegates to `repo.list()`
- `GET /patterns/:id` → 200 when found, 404 when null
- `POST /patterns` → 201, delegates to `repo.create()`

### Project structure

Files to create/modify:

| Path | Action |
|------|--------|
| `libs/types/src/lib/types.ts` | **Modify** — add `SavedPattern`, `PatternRepository` |
| `apps/api/` | **Create** — via Nx generator |
| `apps/api/src/main.ts` | **Modify** — set port 3333, enable ValidationPipe |
| `apps/api/src/app/app.module.ts` | **Modify** — import PatternsModule |
| `apps/api/src/patterns/in-memory.repository.ts` | **Create** |
| `apps/api/src/patterns/patterns.controller.ts` | **Create** |
| `apps/api/src/patterns/patterns.module.ts` | **Create** |
| `apps/api/src/patterns/dto/create-pattern.dto.ts` | **Create** |
| `apps/api/src/patterns/in-memory.repository.spec.ts` | **Create** |
| `apps/api/src/patterns/patterns.controller.spec.ts` | **Create** |

### References

- [Source: docs/planning-artifacts/epics.md#Story-7.1] — ACs, user story
- [Source: docs/planning-artifacts/architecture.md#4.7] — NestJS decision rationale
- [Source: docs/planning-artifacts/architecture.md#5.4] — SavedPattern interface, PatternRepository, InMemoryPatternRepository, REST surface
- [Source: docs/planning-artifacts/architecture.md#5.6] — Nx module boundary tags (scope:server)
- [Source: libs/types/src/lib/types.ts] — existing types file to extend

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

`@nx/nest` was not installed — added with `pnpm add -D @nx/nest -w`. Generator placed app in `api/` (root level) not `apps/api/` — accepted as Nx convention for this workspace. No jest config generated by default; added `jest.config.cts` + `.spec.swcrc` + `test` target in `package.json` manually following the `libs/sim` pattern.

### Completion Notes List

- NestJS app scaffolded at `api/` (not `apps/api/`), tagged `scope:server`
- Port fixed to 3333; global prefix removed; `ValidationPipe` wired globally in `main.ts`
- `SavedPattern` and `PatternRepository` interfaces added to `libs/types`
- `InMemoryPatternRepository` is stateless across requests (Map in module scope, lost on restart — correct per AC)
- 10 tests: 6 repository unit tests + 4 controller unit tests, all pass
- Module boundary: `api/` → `@conways-game-of-life/types` only (no cross-boundary imports)

### File List

- `api/src/main.ts` — modified (port 3333, ValidationPipe, no global prefix)
- `api/src/app/app.module.ts` — modified (imports PatternsModule, removed AppController/AppService)
- `api/src/patterns/in-memory.repository.ts` — created
- `api/src/patterns/patterns.controller.ts` — created
- `api/src/patterns/patterns.module.ts` — created
- `api/src/patterns/dto/create-pattern.dto.ts` — created
- `api/src/patterns/in-memory.repository.spec.ts` — created
- `api/src/patterns/patterns.controller.spec.ts` — created
- `api/jest.config.cts` — created
- `api/.spec.swcrc` — created
- `api/package.json` — modified (test target, class-validator, class-transformer)
- `libs/types/src/lib/types.ts` — modified (SavedPattern, PatternRepository)
- `docs/implementation-artifacts/story-7-1-nestjs-apps-api-with-in-memory-pattern-repository.md` — this file
- `docs/implementation-artifacts/sprint-status.yaml` — modified
