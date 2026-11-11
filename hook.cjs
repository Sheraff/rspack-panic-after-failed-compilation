// A finishMake tap rejects in one compilation; the next compilation of the same compiler panics.
// node hook.cjs [--webpack] [--control] [--watch]
//   default: compiler.run() twice, the first one fails
//   --watch: compiler.watch(); an edit starts compilation 2, which fails; then watching.invalidate()
const fs = require('node:fs')
const path = require('node:path')
const { bundler, project, firstLine, sleep, control } = require('./shared.cjs')

const watch = process.argv.includes('--watch')
const failing = watch ? 2 : 1
const { create, name } = bundler()
const dir = project()
let compilations = 0

const compiler = create({
  mode: 'development',
  context: dir,
  entry: './a.js',
  output: { path: path.join(dir, 'dist') },
  infrastructureLogging: { level: 'none' },
  plugins: [{
    apply(compiler) {
      compiler.hooks.finishMake.tapPromise('repro', async () => {
        compilations++
        if (compilations === failing && !control) {
          throw new Error('finishMake failed')
        }
      })
    },
  }],
})

const report = (error) => {
  console.log(`compilation ${compilations}: ${error ? `error: ${firstLine(error)}` : 'ok'}`)
}

console.log(name)
;(async () => {
  if (watch) {
    const watching = compiler.watch({}, report)
    await sleep(1500)
    fs.writeFileSync(path.join(dir, 'b.js'), 'console.log("b1")\n') // compilation 2, which fails
    await sleep(2000)
    console.log('watching.invalidate()')
    watching.invalidate() // compilation 3
    await sleep(2000)
  } else {
    const run = () => new Promise((resolve) => compiler.run((error) => resolve(report(error))))
    await run() // compilation 1, which fails
    await sleep(0) // older releases call back before the compiler is idle
    await run() // compilation 2
  }
  console.log('done, no panic')
  process.exit(0)
})()
