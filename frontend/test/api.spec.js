jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn((config) => ({ config, request: jest.fn() })) },
}))

import axios from 'axios'
import { api } from '../src/lib/api'

describe('api helper', () => {
  const client = axios.create.mock.results[0].value
  beforeEach(() => client.request.mockReset())
  it('uses the API base URL, cookies, unwraps result and passes body options to Axios', async () => {
    client.request.mockResolvedValue({ data: { result: { idx: 9 } } })
    const result = await api('/course/register', { method: 'POST', body: '{"title":"A"}', headers: { 'X-Test': 'yes' } })
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({ baseURL: '/api', withCredentials: true }))
    expect(client.request).toHaveBeenCalledWith(expect.objectContaining({ url: '/course/register', method: 'POST', data: '{"title":"A"}', headers: { 'X-Test': 'yes' } }))
    expect(result).toEqual({ idx: 9 })
  })
  it('surfaces backend error messages and status codes', async () => {
    client.request.mockRejectedValue({ response: { status: 401, data: { message: 'Sign in required' } } })
    await expect(api('/order/register')).rejects.toMatchObject({ message: 'Sign in required', status: 401 })
  })
})
