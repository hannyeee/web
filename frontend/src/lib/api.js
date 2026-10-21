import axios from 'axios'

const client = axios.create({ baseURL: '/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } })

export async function api(path, options = {}) {
  const { method = 'GET', body, headers, ...config } = options
  try {
    const response = await client.request({ url: path, method, data: body, headers, ...config })
    return response.data?.result
  } catch (error) {
    const surfaced = new Error(error.response?.data?.message || error.message || '요청을 완료하지 못했습니다. 입력을 확인하고 다시 시도해 주세요.')
    surfaced.status = error.response?.status
    throw surfaced
  }
}
