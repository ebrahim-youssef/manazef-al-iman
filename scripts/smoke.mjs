import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const rootDirectory = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const build = spawnSync(process.execPath, [viteCli, 'build'], {
  cwd: rootDirectory,
  stdio: 'inherit',
})

assert.equal(build.status, 0, 'production build failed')

const portServer = createServer()
portServer.listen(0, '127.0.0.1')
await once(portServer, 'listening')
const { port } = portServer.address()
await new Promise((resolve, reject) => portServer.close((error) => error ? reject(error) : resolve()))

const server = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: rootDirectory,
  stdio: ['ignore', 'ignore', 'pipe'],
})
let serverError = ''
server.stderr.setEncoding('utf8')
server.stderr.on('data', (chunk) => { serverError += chunk })

async function stopServer() {
  if (server.exitCode !== null || server.signalCode !== null) return
  server.kill()
  await Promise.race([once(server, 'exit'), delay(2_000)])
  if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL')
}

try {
  const baseUrl = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 30_000
  let ready = false

  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`preview server exited with ${server.exitCode}: ${serverError}`)
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) })
      if (response.ok) {
        ready = true
        break
      }
    } catch {}
    await delay(250)
  }

  assert.ok(ready, `preview server did not start within 30 seconds: ${serverError}`)

  const routes = [
    ['/', 'تسوق حسب القسم'],
    ['/category/cleaners', 'منظفات'],
    ['/product/cos-1', 'شامبو Sunsilk لشعر ناعم 600 مل'],
    ['/cart', 'سلة التسوق'],
    ['/search', 'البحث'],
  ]

  for (const [route, heading] of routes) {
    const response = await fetch(new URL(route, baseUrl), { signal: AbortSignal.timeout(5_000) })
    const html = await response.text()
    assert.equal(response.status, 200, `${route} returned HTTP ${response.status}`)
    assert.ok(html.includes(heading), `${route} HTML does not contain its heading: ${heading}`)
    assert.ok(html.includes('$_TSR'), `${route} HTML does not contain the TanStack Start bootstrap script`)
    console.log(`PASS ${route}`)
  }
} finally {
  await stopServer()
}
