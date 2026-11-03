import { NOTES_STORAGE_KEY } from '~/services/storage/notes-storage'
import { useNotesStore } from '~/stores/notes'
import { createId } from '~/domain/note/factory'

function getTabId(): string {
  const key = 'daymark:tab-id'

  try {
    const stored = window.sessionStorage.getItem(key)
    if (stored) return stored

    const id = createId()
    window.sessionStorage.setItem(key, id)
    return id
  } catch {
    return createId()
  }
}

export default defineNuxtPlugin(() => {
  const store = useNotesStore()
  store.hydrate()

  const tabId = getTabId()
  useState<string>('daymark-tab-id', () => tabId).value = tabId

  window.addEventListener('storage', (event) => {
    if (event.key === NOTES_STORAGE_KEY || event.key === null) {
      store.syncFromStorage(event.newValue)
    }
  })
})
