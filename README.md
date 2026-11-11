# rspack: panics after a failed compilation step

Issues: ISSUE_HOOK (`hook.cjs`), ISSUE_REBUILD (`rebuild.cjs`)

- `hook.cjs`: a `finishMake` tap rejects; the next compilation of the same compiler aborts the process.
- `rebuild.cjs`: `compilation.rebuildModule()` answers an error (a `buildModule` tap throws); the compilation then aborts the process.

```sh
npm install
node hook.cjs              # compiler.run() twice, the first fails
node hook.cjs --watch      # same in watch mode, through watching.invalidate()
node rebuild.cjs           # one compiler.run()
```

Both scripts take `--control` (nothing throws) and `--webpack` (same plugin on webpack).

`@rspack/core` 2.3.2:

```
$ node hook.cjs
compilation 1: error: × Error: finishMake failed
thread 'tokio-27' panicked at <redacted>:0:0:
assertion failed: self.backup.is_some()

$ node rebuild.cjs
rebuildModule(b.js): error: Error: buildModule failed
thread 'tokio-29' panicked at <redacted>:0:0:
attempt to steal from stolen value: rspack_core::artifacts::build_module_graph_artifact::BuildModuleGraphArtifact
```

webpack 5.112.2 and `--control`: no panic. The scripts were written by an AI coding agent (Claude).
