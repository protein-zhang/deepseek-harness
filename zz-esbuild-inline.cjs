// Local build shim for this Windows host only.
//
// esbuild's JS wrapper spills transform inputs larger than 1 MiB to a temp file
// on disk and the esbuild service then deletes it. On this machine that delete
// fails with "Access is denied", so the Web bundle build stops after a chunk
// grows past the threshold. Sending the same input inline over the service pipe
// skips the temp file entirely and keeps the transform result identical.
//
// Loaded with `NODE_OPTIONS=--require <this file>` by zz-build-dsh.bat and by
// the rebuild step of zz-start-dsh-desktop.cmd.
const Module = require('node:module')
const fs = require('node:fs')

const TEMP_FILE_THRESHOLD = 'input.length > 1024 * 1024'
const loadJavaScript = Module._extensions['.js']

Module._extensions['.js'] = function esbuildInlineInput(module, filename) {
  if (filename.replace(/\\/g, '/').endsWith('esbuild/lib/main.js')) {
    const source = fs.readFileSync(filename, 'utf8')
    if (source.includes(TEMP_FILE_THRESHOLD)) {
      module._compile(source.replace(TEMP_FILE_THRESHOLD, 'false'), filename)
      return undefined
    }
  }
  return loadJavaScript.call(this, module, filename)
}
