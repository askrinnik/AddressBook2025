Closes #<issue>

## Summary

<!-- What the change does, and the non-obvious decisions or constraints a reviewer could not infer from the diff. -->

## Attention

<!-- A destructive path, a residual risk, a deviation from the plan — or "None". -->

## Verification

<!-- Build, test suites run, and how the acceptance criteria were verified. The full acceptance table lives in the issue comment. -->

## Checklist

- [ ] New or changed API behaviour has Playwright tests in `src/ApiTests` (happy path, boundaries, negatives)
- [ ] A change spanning API and Web is wired on both sides
- [ ] Documentation affected by the change is updated (`docs/specs/`, test-suite READMEs, `docs/ai-harness.md`)
- [ ] The plan `docs/tasks/issue-<issue>-<slug>.md` is included
