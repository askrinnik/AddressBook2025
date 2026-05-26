---
name: ef-core
description: 'Get best practices for Entity Framework Core'
---

# Entity Framework Core Best Practices

Your goal is to help me follow best practices when working with Entity Framework Core.

## Data Context Design

- Keep DbContext classes focused and cohesive
- Use constructor injection for configuration options
- Override OnModelCreating for fluent API configuration
- Separate entity configurations using IEntityTypeConfiguration
- Consider using DbContextFactory pattern for console apps or tests

## Entity Design

- Use meaningful primary keys (consider natural vs surrogate keys)
- Implement proper relationships (one-to-one, one-to-many, many-to-many)
- Use data annotations or fluent API for constraints and validations
- Implement appropriate navigational properties
- Consider using owned entity types for value objects
- Declare entity classes `sealed` unless inheritance is required — EF Core supports sealed types and `sealed` prevents accidental subclassing.
- Prefer soft-delete over `.Remove()` for FK-referenced entities — hard-delete creates irrecoverable rows and silently breaks referencing queries.

## Performance

- Use AsNoTracking() for read-only queries
- Implement pagination for large result sets with Skip() and Take()
- Use Include() to eager load related entities when needed
- Do not use `.Include()` solely for `.Where()` or `.Select()` navigation access — EF Core auto-joins for filter and projection expressions; `.Include()` is only needed to materialize full entity graphs.
- Consider projection (Select) to retrieve only required fields
- Use compiled queries for frequently executed queries
- Avoid N+1 query problems by properly including related data
- Avoid `Contains(variableList)` in WHERE clauses when list size varies per call — SQL Server caches a separate plan per parameter count, polluting the plan cache. Prefer a count-based validation against a stable filter column.
- When a projection mixes client-side evaluation (e.g., reflection/enum mapping) with a navigation-chain subquery, use `Include`/`ThenInclude` + `ToListAsync()` first, then map in memory — avoids a correlated subquery per row and keeps the two-phase pattern consistent.
- Never emit correlated `COUNT(*)` subqueries inside a SELECT (e.g., `active.Count(jo => jo.ObjectiveId == o.Id)` per row) — use a LEFT JOIN + conditional count instead; correlated counts scale as O(N×4) per result row.
- Use `ToHashSetAsync()` when the result will be stored as `HashSet<T>` — avoids the intermediate `List<T>` allocation that `ToListAsync()` + spread produces.
- Use `AnyAsync` when checking existence only — `FirstOrDefaultAsync` loads a full entity row that will be discarded, adding a round-trip cost with no benefit.
- Use `HasFilter()` on indexes for columns that only apply to a subset of rows (e.g., enum discriminators) — unfiltered low-cardinality indexes are often ignored by the optimizer and add unnecessary write overhead.
- For "at most one default per flag/type" invariants on a column, guard **every** mutation path (Create, Update, Upsert) with the same clearing logic and add a unique filtered index or concurrency token — an invariant enforced only in one handler method is bypassed silently by other write paths.

## Migrations

- Create small, focused migrations
- Name migrations descriptively
- Verify migration SQL scripts before applying to production
- Consider using migration bundles for deployment
- Add data seeding through migrations when appropriate
- Use `[Column]` bracket quoting in `HasCheckConstraint()` SQL expressions for SQL Server — ANSI double-quote quoting (`"Column"`) depends on the `QUOTED_IDENTIFIER` session setting and is not idiomatic.

## Querying

- Use IQueryable judiciously and understand when queries execute
- Prefer strongly-typed LINQ queries over raw SQL
- Use appropriate query operators (Where, OrderBy, GroupBy)
- After fetching a batch of IDs, assert the returned count equals the input count — absent IDs are invisible to attribute filters and cause FK errors.
- Always project the entity's primary key into DTOs — omitted IDs cause ambiguity when display fields repeat and prevent consumer back-references.
- Consider database functions for complex operations
- Implement specifications pattern for reusable queries
- Do not dereference `AsNoTracking()` navigation properties in error paths — the navigation may be null if the FK is orphaned. Use the FK scalar value (e.g., `entity.ParentId`) in error messages instead.
- When filtering by an enum column that has a non-null default value shared with legacy rows (e.g., `Pending`), guard the predicate with a discriminator column check — legacy rows match the default and are returned without the guard.

## Change Tracking & Saving

- Use appropriate change tracking strategies
- Batch your SaveChanges() calls
- Implement concurrency control for multi-user scenarios
- Consider using transactions for multiple operations
- Use appropriate DbContext lifetimes (scoped for web apps)
- Wrap `ExecuteDeleteAsync` + `SaveChangesAsync` replace-all patterns in `BeginTransactionAsync`/`CommitAsync` — `ExecuteDeleteAsync` commits immediately outside EF's unit-of-work, creating a data-loss window if the subsequent save fails.
- Deduplicate caller-provided ID lists with `.Distinct()` before inserting into composite-PK junction tables — duplicate inputs become PK violations that bypass `OperationResult` error handling.
- Use `ISaveChangesInterceptor` for post-save cross-cutting concerns (cache invalidation, audit) — prevents future write handlers from silently omitting mandatory calls.

## Security

- Avoid SQL injection by using parameterized queries
- Implement appropriate data access permissions
- Be careful with raw SQL queries
- Consider data encryption for sensitive information
- Use migrations to manage database user permissions

## Testing

- Use in-memory database provider for unit tests
- Create separate testing contexts with SQLite for integration tests
- Mock DbContext and DbSet for pure unit tests
- Test migrations in isolated environments
- Consider snapshot testing for model changes
- Add an integration test for each `OnDelete(DeleteBehavior.SetNull)` FK — verify that deleting the principal sets the FK column to `NULL` on dependents rather than raising a constraint violation.
- Use SQLite for tests that use `EF.Functions.Like` or SQL functions — the InMemory provider does not translate them and throws at runtime.

When reviewing my EF Core code, identify issues and suggest improvements that follow these best practices.
