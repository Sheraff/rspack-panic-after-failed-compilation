const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const useWebpack = process.argv.includes('--webpack')
const control = process.argv.includes('--control') // nothing throws

// Returns the bundler's factory and version: @rspack/core by default, webpack with --webpack.
function bundler() {
  if (useWebpack) {
    const webpack = require('webpack')
    return { create: webpack, name: `webpack ${webpack.version}` }
  }
  const { rspack, rspackVersion } = require('@rspack/core')
  return { create: rspack, name: `@rspack/core ${rspackVersion}` }
}

// a.js imports b.js, in a fresh temp dir. mtimes in the past so the watcher's first scan sees no change.
function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rspack-panic-'))
  fs.writeFileSync(path.join(dir, 'a.js'), 'import "./b.js"\n')
  fs.writeFileSync(path.join(dir, 'b.js'), 'console.log("b0")\n')
  const past = new Date(Date.now() - 60_000)
  for (const file of ['a.js', 'b.js']) {
    fs.utimesSync(path.join(dir, file), past, past)
  }
  return dir
}

const firstLine = (error) => String(error?.message ?? error).trim().split('\n')[0]
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

module.exports = { bundler, project, firstLine, sleep, control }
