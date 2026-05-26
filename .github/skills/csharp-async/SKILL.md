---
name: csharp-async
description: 'Get best practices for C# async programming'
---

# C# Async Programming Best Practices

Your goal is to help me follow best practices for asynchronous programming in C#.

## Naming Conventions

- Use the 'Async' suffix for all async methods
- Match method names with their synchronous counterparts when applicable (e.g., `GetDataAsync()` for `GetData()`)

## Return Types

- Return `Task<T>` when the method returns a value
- Return `Task` when the method doesn't return a value
- Consider `ValueTask<T>` for high-performance scenarios to reduce allocations
- Avoid returning `void` for async methods except for event handlers

## Exception Handling

- Use try/catch blocks around await expressions
- Avoid swallowing exceptions in async methods
- Use `ConfigureAwait(false)` when appropriate to prevent deadlocks in library code
- Propagate exceptions with `Task.FromException()` instead of throwing in async Task returning methods

## Performance

- Use `Task.WhenAll()` for parallel execution of multiple tasks
- Use `Task.WhenAny()` for implementing timeouts or taking the first completed task
- Avoid unnecessary async/await when simply passing through task results
- Consider cancellation tokens for long-running operations

## Common Pitfalls

- Never use `.Wait()`, `.Result`, or `.GetAwaiter().GetResult()` in async code
- Avoid mixing blocking and async code
- Don't create async void methods (except for event handlers)
- Always await Task-returning methods
- **Faulted task caching:** `_task ??= LoadAsync()` caches a faulted `Task` permanently — the state never recovers for the object's lifetime. Clear the cached field on fault: `_task ??= LoadAsync().ContinueWith(t => { if (t.IsFaulted) _task = null; return t; }, TaskScheduler.Default).Unwrap();` — or use a try/catch in `LoadAsync` to prevent propagation.
- **Process stdout/stderr deadlock:** When `RedirectStandardOutput` and `RedirectStandardError` are both `true`, start reading both streams *before* calling `WaitForExitAsync` — reading after the process exits deadlocks when output exceeds the OS pipe buffer: `var stdoutTask = process.StandardOutput.ReadToEndAsync(ct); var stderrTask = process.StandardError.ReadToEndAsync(ct); await process.WaitForExitAsync(ct); string stdout = await stdoutTask; string stderr = await stderrTask;`

## Implementation Patterns

- Implement the async command pattern for long-running operations
- Use async streams (IAsyncEnumerable<T>) for processing sequences asynchronously
- Consider the task-based asynchronous pattern (TAP) for public APIs

When reviewing my C# code, identify these issues and suggest improvements that follow these best practices.
