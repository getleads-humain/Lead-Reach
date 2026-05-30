---
name: Dependencies
about: Report an outdated or vulnerable dependency
title: "[DEPS] "
labels: dependencies, triage
assignees: ""
---

## Dependency Information

- **Package name**: [e.g., next, @prisma/client, zod]
- **Current version**: [e.g., 16.1.1]
- **Available version**: [e.g., 16.2.0]
- **Vulnerability**: [Is this a security update? Yes/No — include CVE if applicable]

## Change Type

- [ ] Patch update (bug fixes, no new features)
- [ ] Minor update (new features, backward compatible)
- [ ] Major update (breaking changes)
- [ ] Security vulnerability fix

## Release Notes / Changelog

Link to the package's changelog or release notes, and summarize key changes:

- [Changelog URL](https://...)

Key changes:
- ...
- ...

## Impact Assessment

- Does this update introduce breaking changes? If yes, describe the migration path.
- Does this update affect the public API?
- Are there any new peer dependencies?
- Does this require changes to our codebase?

## Testing Plan

How should this dependency update be tested before merging?

- [ ] All existing tests pass
- [ ] Manual smoke test of affected features
- [ ] Build succeeds without errors
- [ ] No new ESLint warnings

## Additional Context

Any other information relevant to this dependency update.
