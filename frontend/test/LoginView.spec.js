import { mount, flushPromises } from '@vue/test-utils'
import LoginView from '../src/views/LoginView.vue'
jest.mock('../src/lib/api', () => ({ api: jest.fn() }))
const mockPush = jest.fn()
let mockQuery = {}
jest.mock('vue-router', () => ({ RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }, useRoute: () => ({ query: mockQuery }), useRouter: () => ({ push: mockPush }) }))
import { api } from '../src/lib/api'
import StoreAccountPanel from '../components/StoreAccountPanel.vue'

describe('login return destination', () => {
  beforeEach(() => { api.mockReset(); mockPush.mockReset(); mockQuery = {} })
  async function submitLogin() {
    const wrapper = mount(LoginView)
    await wrapper.get('#login-email').setValue('reader@example.com')
    await wrapper.get('#login-password').setValue('secret')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    return wrapper
  }
  it('honors a safe local returnTo after login', async () => {
    mockQuery = { returnTo: '/courses/8?from=order' }
    api.mockResolvedValue({})
    await submitLogin()
    expect(mockPush).toHaveBeenCalledWith('/courses/8?from=order')
  })
  it.each(['//attacker.example/path', 'https://attacker.example/path', '/\\attacker.example/path', ['/courses/8']])('falls back to the catalog for unsafe returnTo %s', async returnTo => {
    mockQuery = { returnTo }
    api.mockResolvedValue({})
    await submitLogin()
    expect(mockPush).toHaveBeenCalledWith('/courses')
  })

  it('uses the shared account panel and preserves the login API payload and created notice', async () => {
    mockQuery = { created: '1' }
    api.mockResolvedValue({})
    const wrapper = await submitLogin()
    expect(wrapper.findComponent(StoreAccountPanel).exists()).toBe(true)
    expect(wrapper.get('h1').text()).toBe('배움을 이어가세요.')
    expect(wrapper.get('[role="status"]').text()).toContain('가입이 완료됐습니다.')
    expect(api).toHaveBeenCalledWith('/user/login', { method: 'POST', body: JSON.stringify({ email: 'reader@example.com', password: 'secret' }) })
    expect(wrapper.get('a[href="/courses"]').text()).toBe('강의 둘러보기')
    expect(wrapper.get('a[href="/signup"]').text()).toBe('회원가입')
  })

  it('shows login errors without navigating and permits retry', async () => {
    api.mockRejectedValue(new Error('이메일과 비밀번호를 확인해 주세요.'))
    const wrapper = await submitLogin()
    expect(wrapper.get('[role="alert"]').text()).toBe('이메일과 비밀번호를 확인해 주세요.')
    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
  })

  it('disables the form and prevents duplicate login while the request is pending', async () => {
    let resolveRequest
    api.mockImplementation(() => new Promise(resolve => { resolveRequest = resolve }))
    const wrapper = mount(LoginView)
    await wrapper.get('#login-email').setValue('reader@example.com')
    await wrapper.get('#login-password').setValue('secret')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(api).toHaveBeenCalledTimes(1)
    expect(wrapper.get('fieldset').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').text()).toBe('로그인 중…')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
    resolveRequest({})
    await flushPromises()
    expect(wrapper.get('fieldset').element.disabled).toBe(false)
  })
})
