// compiler.run(): at finishMake, compilation.rebuildModule() answers an error (a buildModule tap throws).
// node rebuild.cjs [--webpack] [--control]
const path = require('node:path')
const { bundler, project, firstLine, control } = require('./shared.cjs')

const { create, name } = bundler()
const dir = project()
let failBuild = false

const compiler = create({
  mode: 'development',
  context: dir,
  entry: './a.js',
  output: { path: path.join(dir, 'dist') },
  infrastructureLogging: { level: 'none' },
  plugins: [{
    apply(compiler) {
      compiler.hooks.thisCompilation.tap('repro', (compilation) => {
        compilation.hooks.buildModule.tap('repro', () => {
          if (failBuild) {
            failBuild = false
            throw new Error('buildModule failed')
          }
        })
      })
      compiler.hooks.finishMake.tapPromise('repro', async (compilation) => {
        const b = [...compilation.modules].find((m) => m.resource?.endsWith('b.js'))
        failBuild = !control
        await new Promise((resolve) => {
          compilation.rebuildModule(b, (error) => {
            console.log(`rebuildModule(b.js): ${error ? `error: ${firstLine(error)}` : 'ok'}`)
            resolve()
          })
        })
      })
    },
  }],
})

console.log(name)
compiler.run((error) => {
  console.log(`run: ${error ? `error: ${firstLine(error)}` : 'ok'}`)
  compiler.close(() => console.log('done, no panic'))
})
