/** @jest-environment node */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { runInNewContext } from 'node:vm'
import { transformSync, types } from '@babel/core'

function loadApi(env = {}) {
  const request = jest.fn()
  const axios = { create: jest.fn(() => ({ request })) }
  // Jest runs CommonJS; provide the public build environment as Vite would.
  const { code } = transformSync(readFileSync(path.resolve(__dirname, '../src/lib/api.js'), 'utf8'), {
    configFile: false,
    babelrc: false,
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    plugins: [() => ({ visitor: {
      MetaProperty(nodePath) {
        if (nodePath.node.meta.name === 'import' && nodePath.node.property.name === 'meta') {
          nodePath.replaceWith(types.valueToNode({ env }))
        }
      },
    } })],
  })
  const exports = {}
  runInNewContext(code, { exports, require: () => axios })
  return { api: exports.api, axios, request }
}

describe('api helper', () => {
  it.each([undefined, ''])('defaults to the local API proxy with credentials for %j', (baseURL) => {
    const { axios } = loadApi({ VITE_API_BASE_URL: baseURL })
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: '/api', withCredentials: true,
    }))
  })

  it('uses the configured backend origin and includes login cookies', async () => {
    const { api, axios, request } = loadApi({ VITE_API_BASE_URL: 'https://api.yaaho.kro.kr/api' })
    request.mockResolvedValue({ data: { result: { idx: 9 } } })
    const result = await api('/course/register', { method: 'POST', body: '{"title":"A"}', headers: { 'X-Test': 'yes' } })
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'https://api.yaaho.kro.kr/api', withCredentials: true,
    }))
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: '/course/register', method: 'POST', data: '{"title":"A"}', headers: { 'X-Test': 'yes' },
    }))
    expect(result).toEqual({ idx: 9 })
  })

  it('surfaces backend error messages and status codes', async () => {
    const { api, request } = loadApi()
    request.mockRejectedValue({ response: { status: 401, data: { message: 'Sign in required' } } })
    await expect(api('/order/register')).rejects.toMatchObject({ message: 'Sign in required', status: 401 })
  })
})
