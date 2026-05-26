---
description: "C# coding conventions for AddressBook2025 .NET projects. Use when writing, reviewing, or modifying C# source files in the API or Contracts projects."
applyTo: ["src/AddressBook.Api/**/*.cs", "src/AddressBook.Contracts/**/*.cs"]
---
# C# Coding Conventions

## Language Features (C# 12+ / .NET 10)

- Use **primary constructors** for dependency injection in classes
- Use **file-scoped namespaces** (`namespace X;` not `namespace X { }`)
- Use **collection expressions** (`[]` not `new List<T>()`)
- Use **records** for immutable data types; use **classes** only when mutability is required (e.g., command DTOs bound from request bodies)

## Access Modifiers

- Mark implementation classes `internal` (handlers, validators, repositories)
- Mark entity and ID classes `sealed` to prevent inheritance
- Keep interfaces `public`

## Initialization

- Initialize strings to `string.Empty` (never leave as `null`)
- Initialize collections to `[]` (never leave as `null`)

## Async Patterns

- Accept `CancellationToken` in all async methods and propagate it downstream
- Suffix async methods with `Async` only in service/repository interfaces — handlers use `Handle`

## Documentation

- Add XML doc comments (`///`) on public classes, controller actions, and extension methods
- Source code supports non-English (Russian) comments — maintain the language of existing comments in the vicinity

## Naming

- Use PascalCase for public members, camelCase for parameters
- Prefix private fields with underscore (`_fieldName`)
