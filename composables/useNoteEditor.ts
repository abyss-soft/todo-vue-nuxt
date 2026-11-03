import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { NoteHistory } from '~/domain/history/note-history'
import { cloneNote, createNote, createTodo } from '~/domain/note/factory'
import { validateNote } from '~/domain/note/validation'
import {
  readDraft,
  removeDraft,
  writeDraft,
} from '~/services/storage/notes-storage'
import { useNotesStore } from '~/stores/notes'
import type { Note, NoteDraft } from '~/types/note'

const DRAFT_DELAY = 700
const TEXT_COMMIT_DELAY = 500

export type SaveStatus = 'idle' | 'saved'
export type ConflictState = 'updated' | 'deleted' | null

export function useNoteEditor(routeId: Ref<string>) {
  const store = useNotesStore()
  const router = useRouter()
  const tabId = useState<string>('daymark-tab-id', () => '')
  const history = reactive(new NoteHistory())

  const note = ref<Note | null>(null)
  const initialNote = ref<Note | null>(null)
  const baseUpdatedAt = ref<string | null>(null)
  const pendingDraft = ref<NoteDraft | null>(null)
  const explicitConflict = ref<ConflictState>(null)
  const errorMessage = ref<string | null>(null)
  const invalidField = ref<string | null>(null)
  const saveStatus = ref<SaveStatus>('idle')

  let draftTimer: ReturnType<typeof setTimeout> | undefined
  let textTimer: ReturnType<typeof setTimeout> | undefined

  const routeKey = computed(() => routeId.value)
  const isNewSession = computed(
    () => routeId.value === 'new' || (note.value !== null && note.value.id !== routeId.value),
  )
  const isMissing = computed(() => routeId.value !== 'new' && note.value === null)
  const remoteConflict = computed<ConflictState>(() => {
    if (!note.value
      || routeId.value === 'new'
      || note.value.id !== routeId.value
      || baseUpdatedAt.value === null) {
      return null
    }

    const current = store.findNote(routeId.value)
    if (!current) return 'deleted'
    return current.updatedAt === baseUpdatedAt.value ? null : 'updated'
  })
  const conflictState = computed(
    () => explicitConflict.value ?? remoteConflict.value,
  )
  const draftConflicts = computed(() => {
    const draft = pendingDraft.value
    if (!draft?.noteId) return false
    const current = store.findNote(draft.noteId)
    return !current || current.updatedAt !== draft.baseUpdatedAt
  })
  const isDirty = computed(() => {
    if (!note.value || !initialNote.value) return false
    return JSON.stringify(note.value) !== JSON.stringify(initialNote.value)
  })
  const canUndo = computed(() => history.canUndo)
  const canRedo = computed(() => history.canRedo)

  watch(routeId, (id) => {
    const saved = id === 'new' ? undefined : store.findNote(id)
    const current = saved ? cloneNote(saved) : id === 'new' ? createNote() : null

    note.value = current
    initialNote.value = current ? cloneNote(current) : null
    baseUpdatedAt.value = saved?.updatedAt ?? null
    pendingDraft.value = null
    explicitConflict.value = null
    errorMessage.value = null
    invalidField.value = null
    saveStatus.value = 'idle'
    history.reset()
  }, { immediate: true })

  function flushTextChange(): void {
    if (textTimer) clearTimeout(textTimer)
    textTimer = undefined
    if (note.value) history.flushTextChange(note.value)
  }

  function persistDraftNow(): void {
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = undefined

    if (!note.value || !isDirty.value || pendingDraft.value || !tabId.value) return

    const isSavedNote = note.value.id === routeId.value && routeId.value !== 'new'
    const draft: NoteDraft = {
      version: 1,
      noteId: isSavedNote ? routeId.value : null,
      baseUpdatedAt: isSavedNote ? baseUpdatedAt.value : null,
      note: cloneNote(note.value),
      savedAt: new Date().toISOString(),
    }
    const error = writeDraft(tabId.value, routeKey.value, draft)
    store.storageError = error
  }

  function queueDraftSave(): void {
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = setTimeout(persistDraftNow, DRAFT_DELAY)
  }

  function scheduleTextCommit(): void {
    if (textTimer) clearTimeout(textTimer)
    textTimer = setTimeout(() => {
      flushTextChange()
    }, TEXT_COMMIT_DELAY)
  }

  function updateNote(action: (current: Note) => void): void {
    if (!note.value) return
    action(note.value)
    errorMessage.value = null
    invalidField.value = null
    saveStatus.value = 'idle'
    queueDraftSave()
  }

  function setTitle(value: string): void {
    updateNote(current => history.setTitle(current, value))
    scheduleTextCommit()
  }

  function setTodoText(todoId: string, value: string): void {
    updateNote(current => history.setTodoText(current, todoId, value))
    scheduleTextCommit()
  }

  function addTodo(): void {
    flushTextChange()
    updateNote(current => history.insertTodo(current, createTodo()))
  }

  function removeTodo(todoId: string): void {
    flushTextChange()
    updateNote(current => history.removeTodo(current, todoId))
  }

  function toggleTodo(todoId: string): void {
    flushTextChange()
    updateNote(current => history.toggleTodo(current, todoId))
  }

  function undo(): void {
    if (!note.value) return
    flushTextChange()
    history.undo(note.value)
    saveStatus.value = 'idle'
    queueDraftSave()
  }

  function redo(): void {
    if (!note.value) return
    flushTextChange()
    history.redo(note.value)
    saveStatus.value = 'idle'
    queueDraftSave()
  }

  function restorePendingDraft(): void {
    const draft = pendingDraft.value
    if (!draft) return

    const current = draft.noteId ? store.findNote(draft.noteId) : undefined
    const restored = cloneNote(draft.note)

    if (draft.noteId && !current) {
      const replacement = createNote()
      restored.id = replacement.id
      restored.createdAt = replacement.createdAt
      restored.updatedAt = replacement.updatedAt
      baseUpdatedAt.value = null
      initialNote.value = createNote()
    } else if (draft.noteId && current) {
      baseUpdatedAt.value = current.updatedAt
      initialNote.value = cloneNote(current)
    } else {
      baseUpdatedAt.value = null
      initialNote.value = routeId.value === 'new' && note.value
        ? cloneNote(note.value)
        : createNote()
    }

    note.value = restored
    pendingDraft.value = null
    explicitConflict.value = null
    errorMessage.value = null
    invalidField.value = null
    history.reset()
    queueDraftSave()
  }

  function discardPendingDraft(): void {
    const error = removeDraft(tabId.value, routeKey.value)
    if (error) store.storageError = error
    pendingDraft.value = null
  }

  function resolveConflict(action: 'reload' | 'recover'): void {
    if (action === 'reload') {
      store.hydrate()
      const latest = store.findNote(routeId.value)
      if (!latest) return
      note.value = cloneNote(latest)
      initialNote.value = cloneNote(latest)
      baseUpdatedAt.value = latest.updatedAt
      const error = removeDraft(tabId.value, routeKey.value)
      if (error) store.storageError = error
    } else if (note.value) {
      const recovered = cloneNote(note.value)
      const replacement = createNote()
      recovered.id = replacement.id
      recovered.createdAt = replacement.createdAt
      recovered.updatedAt = replacement.updatedAt
      note.value = recovered
      initialNote.value = createNote()
      baseUpdatedAt.value = null
      queueDraftSave()
    }

    explicitConflict.value = null
    errorMessage.value = null
    invalidField.value = null
    saveStatus.value = 'idle'
    history.reset()
  }

  async function save(): Promise<boolean> {
    flushTextChange()
    if (!note.value) return false
    if (pendingDraft.value) {
      errorMessage.value = 'Сначала выберите, восстановить или удалить найденный черновик.'
      return false
    }

    const validation = validateNote(note.value)
    if (!validation.valid) {
      errorMessage.value = validation.message
      invalidField.value = validation.field
      saveStatus.value = 'idle'
      return false
    }

    const result = store.saveNote(note.value, baseUpdatedAt.value)
    if (result.status === 'conflict' || result.status === 'missing') {
      explicitConflict.value = result.status === 'missing' ? 'deleted' : 'updated'
      errorMessage.value = result.status === 'missing'
        ? 'Заметка удалена в другой вкладке.'
        : 'Заметка изменилась в другой вкладке.'
      saveStatus.value = 'idle'
      return false
    }
    if (result.status === 'storage-error') {
      errorMessage.value = result.message
      saveStatus.value = 'idle'
      return false
    }

    note.value = cloneNote(result.note)
    initialNote.value = cloneNote(result.note)
    baseUpdatedAt.value = result.note.updatedAt
    explicitConflict.value = null
    errorMessage.value = null
    invalidField.value = null
    history.reset()
    saveStatus.value = 'saved'

    const draftError = removeDraft(tabId.value, routeKey.value)
    if (draftError) store.storageError = draftError

    if (routeId.value !== result.note.id) {
      await router.push(`/notes/${result.note.id}`)
    }
    return true
  }

  async function cancel(): Promise<void> {
    flushTextChange()
    if (note.value) initialNote.value = cloneNote(note.value)
    history.reset()
    const error = removeDraft(tabId.value, routeKey.value)
    if (error) store.storageError = error
    await router.push('/')
  }

  async function removeCurrentNote(): Promise<boolean> {
    if (!note.value || note.value.id !== routeId.value || routeId.value === 'new') {
      return false
    }

    flushTextChange()
    const previousVersion = baseUpdatedAt.value
    const previousBaseline = initialNote.value ? cloneNote(initialNote.value) : null
    baseUpdatedAt.value = null
    initialNote.value = cloneNote(note.value)
    const result = store.deleteNote(routeId.value)
    if (result.status === 'storage-error') {
      baseUpdatedAt.value = previousVersion
      initialNote.value = previousBaseline
      errorMessage.value = result.message
      return false
    }

    const error = removeDraft(tabId.value, routeKey.value)
    if (error) store.storageError = error
    await router.push('/')
    return true
  }

  function recoverAsNew(): void {
    if (!note.value) return
    const recovered = cloneNote(note.value)
    const replacement = createNote()
    recovered.id = replacement.id
    recovered.createdAt = replacement.createdAt
    recovered.updatedAt = replacement.updatedAt
    note.value = recovered
    initialNote.value = createNote()
    baseUpdatedAt.value = null
    explicitConflict.value = null
    errorMessage.value = null
    invalidField.value = null
    history.reset()
    queueDraftSave()
  }

  onBeforeRouteLeave(() => {
    flushTextChange()
    persistDraftNow()
  })

  onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {
      flushTextChange()
      persistDraftNow()
    }
  })

  onMounted(() => {
    if (!tabId.value) return

    const result = readDraft(tabId.value, routeKey.value)
    if (result.error) store.storageError = result.error
    if (result.value) pendingDraft.value = result.value
    window.addEventListener('pagehide', persistDraftNow)
  })

  onBeforeUnmount(() => {
    if (textTimer) clearTimeout(textTimer)
    persistDraftNow()
    window.removeEventListener('pagehide', persistDraftNow)
  })

  return {
    note,
    isNewSession,
    isMissing,
    conflictState,
    pendingDraft,
    draftConflicts,
    errorMessage,
    invalidField,
    saveStatus,
    isDirty,
    canUndo,
    canRedo,
    setTitle,
    setTodoText,
    addTodo,
    removeTodo,
    toggleTodo,
    flushTextChange,
    undo,
    redo,
    restorePendingDraft,
    discardPendingDraft,
    resolveConflict,
    save,
    cancel,
    removeCurrentNote,
    recoverAsNew,
  }
}
