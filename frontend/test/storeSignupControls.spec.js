import { mount } from '@vue/test-utils'
import StoreSelectField from '../components/StoreSelectField.vue'
import StoreCheckbox from '../components/StoreCheckbox.vue'

describe('store signup controls', () => {
  it.each([
    ['select', StoreSelectField, 'select'],
    ['checkbox', StoreCheckbox, 'input'],
  ])('merges and deduplicates external descriptions on %s after attribute-only updates', async (_name, component, control) => {
    const wrapper = mount({
      components: { SignupControl: component },
      data: () => ({ describedBy: 'external  field-hint external', hint: '도움말', error: '오류' }),
      template: '<SignupControl id="field" label="입력" :hint="hint" :error="error" :aria-describedby="describedBy" />',
    })
    expect(wrapper.get(control).attributes('aria-describedby')).toBe('external field-hint field-error')
    await wrapper.setData({ describedBy: 'replacement replacement' })
    expect(wrapper.get(control).attributes('aria-describedby')).toBe('replacement field-hint field-error')
    await wrapper.setData({ hint: '', error: '' })
    expect(wrapper.get(control).attributes('aria-describedby')).toBe('replacement')
    await wrapper.setData({ describedBy: undefined })
    expect(wrapper.get(control).attributes('aria-describedby')).toBeUndefined()
  })

  it('merges caller descriptions with a checkbox description slot', () => {
    const wrapper = mount(StoreCheckbox, { props: { id: 'consent', label: '동의' }, attrs: { 'aria-describedby': 'external consent-hint' }, slots: { description: '동의 안내' } })
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('external consent-hint')
    expect(wrapper.get('#consent-hint').text()).toBe('동의 안내')
  })

  it('associates select label, help, error and forwards native required/name/disabled attributes', async () => {
    const wrapper = mount(StoreSelectField, { props: { id: 'birth-month', label: '태어난 달', hint: '생년월일을 선택하세요.', error: '필수 항목입니다.', placeholder: '월 선택', options: [{ value: 1, label: '1월' }, { value: 2, label: '2월', disabled: true }] }, attrs: { required: true, name: 'birthMonth' } })
    const select = wrapper.get('select')
    expect(wrapper.get('label').attributes('for')).toBe(select.attributes('id'))
    expect(select.element.required).toBe(true)
    expect(select.attributes('name')).toBe('birthMonth')
    expect(select.attributes('aria-describedby')).toBe('birth-month-hint birth-month-error')
    expect(select.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[role="alert"]').text()).toBe('필수 항목입니다.')
    expect(wrapper.findAll('option')[2].element.disabled).toBe(true)
    await wrapper.setProps({ error: '' })
    expect(select.attributes('aria-invalid')).toBeUndefined()
    expect(select.attributes('aria-describedby')).toBe('birth-month-hint')
    const disabled = mount(StoreSelectField, { props: { label: '국가' }, attrs: { disabled: true } })
    expect(disabled.get('select').element.disabled).toBe(true)
  })

  it('preserves numeric option values and supports clearing to the empty placeholder', async () => {
    const wrapper = mount(StoreSelectField, { props: { label: '월', placeholder: '선택', options: [{ value: 1, label: '1월' }, { value: 'kr', label: '대한민국' }, { value: '', label: '선택 안 함' }] } })
    const select = wrapper.get('select')
    await select.setValue('1')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([1])
    await select.setValue('kr')
    expect(wrapper.emitted('update:modelValue')[1]).toEqual(['kr'])
    await select.setValue('')
    expect(wrapper.emitted('update:modelValue')[2]).toEqual([''])
  })

  it('generates different labeled IDs and handles numeric zero without a placeholder', async () => {
    const form = mount({ components: { StoreSelectField }, data: () => ({ options: [{ value: 0, label: '없음' }, { value: 2, label: '둘' }] }), template: '<div><StoreSelectField label="옵션" :options="options" :model-value="2" /><StoreSelectField label="다른 옵션" /></div>' })
    const [first, second] = form.findAllComponents(StoreSelectField)
    expect(first.get('select').attributes('id')).not.toBe(second.get('select').attributes('id'))
    expect(first.get('select').element.value).toBe('2')
    await first.get('select').setValue('0')
    expect(first.emitted('update:modelValue')).toEqual([[0]])
  })

  it('toggles boolean checkbox values and associates consent copy with help and errors', async () => {
    const wrapper = mount(StoreCheckbox, { props: { id: 'terms', label: '약관 동의', hint: '서비스 이용에 필요합니다.', error: '동의가 필요합니다.' }, attrs: { required: true, name: 'terms' } })
    const checkbox = wrapper.get('input')
    expect(checkbox.attributes('type')).toBe('checkbox')
    expect(checkbox.element.required).toBe(true)
    expect(checkbox.attributes('name')).toBe('terms')
    expect(wrapper.get('label').attributes('for')).toBe('terms')
    expect(checkbox.attributes('aria-describedby')).toBe('terms-hint terms-error')
    expect(checkbox.attributes('aria-invalid')).toBe('true')
    await checkbox.setValue(true)
    await checkbox.setValue(false)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true], [false]])
    await wrapper.setProps({ modelValue: true, error: '' })
    expect(checkbox.element.checked).toBe(true)
    expect(checkbox.attributes('aria-invalid')).toBeUndefined()
  })

  it('supports consent links, a description slot and disabled native checkbox', () => {
    const wrapper = mount(StoreCheckbox, { props: { label: '선택 동의' }, attrs: { disabled: true }, slots: { default: '소식 수신에 동의합니다. <a href="/privacy">개인정보 처리방침</a>', description: '언제든 수신을 해지할 수 있습니다.' } })
    expect(wrapper.get('input').element.disabled).toBe(true)
    expect(wrapper.get('label a').attributes('href')).toBe('/privacy')
    const hintId = wrapper.get('input').attributes('aria-describedby')
    expect(wrapper.get(`[id="${hintId}"]`).text()).toBe('언제든 수신을 해지할 수 있습니다.')
    expect(wrapper.get('label').attributes('for')).toBe(wrapper.get('input').attributes('id'))
  })
})
