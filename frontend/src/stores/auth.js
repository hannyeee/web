import { readonly, ref, shallowRef } from 'vue'
import { api } from '../lib/api'

export function createAuthStore(request = api) {
  const user = shallowRef(null)
  const initialized = ref(false)
  const restoring = ref(false)
  const restoreError = ref('')
  const logoutBusy = ref(false)
  const logoutError = ref('')
  let revision = 0
  let pendingRestore = null

  function setUser(profile) {
    revision += 1
    user.value = profile
    initialized.value = true
    restoreError.value = ''
    logoutError.value = ''
  }

  function restoreSession() {
    if (initialized.value) return Promise.resolve()
    if (pendingRestore) return pendingRestore
    const startedAt = revision
    restoring.value = true
    restoreError.value = ''
    pendingRestore = (async () => {
      try {
        const profile = await request('/user/me')
        if (revision === startedAt) {
          user.value = profile
          initialized.value = true
        }
      } catch (error) {
        if (revision !== startedAt) return
        if (error.status === 401) {
          user.value = null
          initialized.value = true
        } else {
          restoreError.value = error.message
        }
      } finally {
        restoring.value = false
        pendingRestore = null
      }
    })()
    return pendingRestore
  }

  async function logout() {
    if (logoutBusy.value) return false
    logoutBusy.value = true
    logoutError.value = ''
    try {
      await request('/user/logout', { method: 'POST' })
      setUser(null)
      return true
    } catch (error) {
      logoutError.value = error.message
      return false
    } finally {
      logoutBusy.value = false
    }
  }

  return {
    user: readonly(user), initialized: readonly(initialized), restoring: readonly(restoring),
    restoreError: readonly(restoreError), logoutBusy: readonly(logoutBusy), logoutError: readonly(logoutError),
    setUser, restoreSession, logout,
  }
}

const auth = createAuthStore()
export function useAuth() { return auth }
