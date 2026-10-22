# Supply chain note

`npm audit` reports 5 advisories (2 moderate, 3 high) in this tree. All of them are in the
**devDependency chain**, none reach the shipped bundle:

| Package | Via | Severity | Runtime impact |
|---|---|---|---|
| `@vitest/mocker` | `vitest` | moderate | none — test runner only |
| `vitest` | direct dev dep | moderate | none |
| `source-map-js` | vite/rolldown chain | high | none — build tooling |
| `undici` | vite/rolldown chain | high | none — dev server HTTP client |
| `vite` | direct dev dep | high | none — dev server only |

Decision (2026-10-22, M1): **accept and track, do not force.**

`npm audit fix` cannot be used here: this dependency set (inherited verbatim from the
planwalker lockfile) trips the npm arborist `edgesOut` crash on any re-resolution, which is
exactly why the project installs with `npm ci` and never `npm install`. Forcing a lockfile
rewrite to clear dev-only advisories risks breaking the toolchain for no runtime gain.

Revisit when the toolchain is regenerated deliberately (candidate: move to pnpm or a fresh
lockfile on a current npm), as its own task with a green `npm run verify` before and after.
