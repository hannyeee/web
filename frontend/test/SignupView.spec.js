import { mount, flushPromises } from '@vue/test-utils'
import SignupView from '../src/views/SignupView.vue'
import StoreAccountPanel from '../components/StoreAccountPanel.vue'
import StoreFormField from '../components/StoreFormField.vue'
jest.mock('../src/lib/api', () => ({ api: jest.fn() }))
const mockPush = jest.fn()
jest.mock('vue-router', () => ({ RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }, useRouter: () => ({ push: mockPush }) }))
import { api } from '../src/lib/api'

describe('signup account page', () => {
  beforeEach(() => { api.mockReset(); mockPush.mockReset() })

  async function fillSignup() {
    const wrapper = mount(SignupView)
    await wrapper.get('#signup-name').setValue('  학습자  ')
    await wrapper.get('#signup-email').setValue('reader@example.com')
    await wrapper.get('#signup-password').setValue(' secret ')
    return wrapper
  }

  it('uses the account components and sends only the existing trimmed signup payload', async () => {
    api.mockResolvedValue({})
    const wrapper = await fillSignup()
    // Set the model through the field event to exercise server-payload trimming too.
    wrapper.findAllComponents(StoreFormField)[1].vm.$emit('update:modelValue', ' reader@example.com ')
    const panel = wrapper.findComponent(StoreAccountPanel)
    expect(panel.exists()).toBe(true)
    expect(wrapper.get('h1').text()).toBe('배움을 시작하세요.')
    expect(wrapper.findAll('input')).toHaveLength(3)
    expect(wrapper.get('#signup-name').element.required).toBe(true)
    expect(wrapper.get('#signup-password').attributes('autocomplete')).toBe('new-password')
    expect(wrapper.get('a[href="/courses"]').text()).toBe('강의 둘러보기')
    expect(wrapper.get('a[href="/login"]').text()).toBe('로그인')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api).toHaveBeenCalledWith('/user/signup', { method: 'POST', body: JSON.stringify({ name: '학습자', email: 'reader@example.com', password: ' secret ' }) })
    expect(mockPush).toHaveBeenCalledWith('/login?created=1')
  })

  it('shows API errors and re-enables submission without changing route', async () => {
    api.mockRejectedValue(new Error('이미 가입된 이메일입니다.'))
    const wrapper = await fillSignup()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('이미 가입된 이메일입니다.')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('blocks duplicate signup and disables native fields while saving', async () => {
    let resolveRequest
    api.mockImplementation(() => new Promise(resolve => { resolveRequest = resolve }))
    const wrapper = await fillSignup()
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(api).toHaveBeenCalledTimes(1)
    expect(wrapper.get('fieldset').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').text()).toBe('가입하는 중…')
    resolveRequest({})
    await flushPromises()
    expect(mockPush).toHaveBeenCalledWith('/login?created=1')
    expect(wrapper.get('fieldset').element.disabled).toBe(false)
  })
})
