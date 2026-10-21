import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../src/stores/App.vue'
import { api } from '../src/lib/api'
import { useAuth } from '../src/stores/auth'
jest.mock('../src/lib/api', () => ({ api: jest.fn() }))

const StubView = { template: '<div />' }

async function mountAt(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/courses', name: 'course-list', component: StubView },
      { path: '/courses/:idx', name: 'course-detail', component: StubView },
      { path: '/courses/new', name: 'course-create', component: StubView },
      { path: '/orders', name: 'order-list', component: StubView },
      { path: '/login', name: 'login', component: StubView },
      { path: '/signup', name: 'signup', component: StubView },
      { path: '/board', name: 'board-list', component: StubView },
      { path: '/board/:idx', name: 'board-detail', component: StubView },
      { path: '/board/new', name: 'board-create', component: StubView },
    ],
  })
  await router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router] } })
}

describe('store shell', () => {
  beforeEach(() => { api.mockReset(); useAuth().setUser(null) })
  it('offers storefront navigation and keeps the board available', async () => {
    const wrapper = await mountAt('/courses')
    expect(wrapper.text()).toContain('강의 둘러보기')
    expect(wrapper.text()).toContain('강의 등록')
    expect(wrapper.text()).toContain('주문 내역')
    expect(wrapper.find('a[href="/board"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/courses"]').exists()).toBe(true)
  })

  it('marks the catalog section current on a course detail route', async () => {
    const wrapper = await mountAt('/courses/8')
    expect(wrapper.find('nav a[href="/courses"]').attributes('aria-current')).toBe('page')
  })

  it('marks the board section current on a board detail route', async () => {
    const wrapper = await mountAt('/board/8')
    expect(wrapper.find('nav a[href="/board"]').attributes('aria-current')).toBe('page')
  })

  it('offers an accessible mobile menu and a visible account entry', async () => {
    const wrapper = await mountAt('/courses')
    const toggle = wrapper.get('button[aria-controls]')
    expect(toggle.attributes('aria-controls')).toBe(wrapper.get('nav[aria-label="주요 메뉴"]').attributes('id'))
    expect(wrapper.get('a[href="/login"]').text()).toBe('로그인')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    await wrapper.get('nav a[href="/orders"]').trigger('click')
    await flushPromises()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('nav a[href="/orders"]').attributes('aria-current')).toBe('page')
  })

  it('shows the signed-in account name and a logout button instead of the login link', async () => {
    useAuth().setUser({ idx: 7, email: 'reader@example.com', name: '배움이' })
    const wrapper = await mountAt('/courses')
    expect(wrapper.get('.app-account-name').text()).toBe('배움이님')
    expect(wrapper.find('a[href="/login"]').exists()).toBe(false)
    expect(wrapper.get('button.app-logout').text()).toBe('로그아웃')
  })

  it('clears the account only after logout succeeds and prevents duplicate requests', async () => {
    useAuth().setUser({ idx: 7, name: '배움이' })
    let finishLogout
    api.mockImplementation(() => new Promise(resolve => { finishLogout = resolve }))
    const wrapper = await mountAt('/courses')
    await wrapper.get('button.app-logout').trigger('click')
    await wrapper.get('button.app-logout').trigger('click')
    expect(wrapper.get('.app-account-name').text()).toBe('배움이님')
    expect(wrapper.get('button.app-logout').element.disabled).toBe(true)
    expect(api).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith('/user/logout', { method: 'POST' })
    finishLogout(null)
    await flushPromises()
    expect(wrapper.find('.app-account-name').exists()).toBe(false)
    expect(wrapper.get('a[href="/login"]').text()).toBe('로그인')
  })

  it('keeps the account and reports a failed logout so it can be retried', async () => {
    useAuth().setUser({ idx: 7, name: '배움이' })
    api.mockRejectedValue(new Error('로그아웃하지 못했습니다. 다시 시도해 주세요.'))
    const wrapper = await mountAt('/courses')
    await wrapper.get('button.app-logout').trigger('click')
    await flushPromises()
    expect(wrapper.get('.app-account-name').text()).toBe('배움이님')
    expect(wrapper.get('[role="alert"]').text()).toContain('로그아웃하지 못했습니다.')
    expect(wrapper.get('button.app-logout').element.disabled).toBe(false)
  })
})
