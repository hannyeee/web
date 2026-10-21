/** @jest-environment node */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

describe('Vite environment configuration', () => {
  let fixtureRoot
  let result

  beforeAll(() => {
    // Keep package resolution available while giving the config an isolated root.
    fixtureRoot = mkdtempSync(path.resolve(__dirname, '../.env-config-test-'))
    const frontendDir = path.join(fixtureRoot, 'frontend')
    mkdirSync(frontendDir)
    copyFileSync(path.resolve(__dirname, '../vite.config.js'), path.join(frontendDir, 'vite.config.js'))
    writeFileSync(path.join(fixtureRoot, '.env'), [
      'VITE_PORTONE_STORE_ID=store-from-root',
      'VITE_PORTONE_CHANNEL_KEY=channel-from-root',
      'PORTONE_API_SECRET=server-only-fixture',
      'SECRET_KEY=server-signing-fixture',
    ].join('\n'))
    writeFileSync(path.join(frontendDir, '.env.local'), 'VITE_PORTONE_STORE_ID=wrong-frontend-store\n')
    const probePath = path.join(frontendDir, 'probe.mjs')
    writeFileSync(probePath, `
      import config from './vite.config.js'
      import { loadEnv, resolveEnvPrefix } from 'vite'
      console.log(JSON.stringify({
        envDir: config.envDir,
        env: loadEnv('production', config.envDir, resolveEnvPrefix(config)),
      }))
    `)
    const env = { ...process.env }
    // Keep developer shell overrides from affecting these isolated fixtures.
    delete env.VITE_PORTONE_STORE_ID
    delete env.VITE_PORTONE_CHANNEL_KEY
    result = JSON.parse(execFileSync(process.execPath, [probePath], {
      cwd: tmpdir(), env, encoding: 'utf8',
    }))
  })

  afterAll(() => {
    if (fixtureRoot) rmSync(fixtureRoot, { recursive: true, force: true })
  })

  it('loads public payment settings from the repository root regardless of working directory', () => {
    expect(path.resolve(result.envDir)).toBe(fixtureRoot)
    expect(result.env).toMatchObject({
      VITE_PORTONE_STORE_ID: 'store-from-root',
      VITE_PORTONE_CHANNEL_KEY: 'channel-from-root',
    })
  })

  it('keeps backend secrets outside browser environment variables', () => {
    expect(result.env).not.toHaveProperty('PORTONE_API_SECRET')
    expect(result.env).not.toHaveProperty('SECRET_KEY')
    expect(Object.keys(result.env).every((key) => key.startsWith('VITE_'))).toBe(true)
  })
})
