<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNoteEditor } from '~/composables/useNoteEditor'

const route = useRoute()
const routeId = computed(() => String(route.params.id ?? ''))
const {
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
  toggleTodo,
  addTodo,
  removeTodo,
  flushTextChange,
  undo,
  redo,
  restorePendingDraft,
  discardPendingDraft,
  resolveConflict,
  save: saveNote,
  cancel: cancelEdit,
  removeCurrentNote,
  recoverAsNew,
} = useNoteEditor(routeId)
const activeDialog = ref<'draft' | 'cancel' | 'delete' | 'conflict' | 'deleted' | null>(null)

function handleGlobalUndo(event: KeyboardEvent): void {
  if (activeDialog.value) return
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return

  const target = event.target
  const isTextEditing = target instanceof HTMLElement
      && (target.isContentEditable
          || target instanceof HTMLTextAreaElement
          || (target instanceof HTMLInputElement && target.type !== 'checkbox' && target.type !== 'button'))

  if (isTextEditing) return

  event.preventDefault()
  if (event.shiftKey) redo()
  else undo()
}

watch(pendingDraft, (draft) => {
  if (draft) activeDialog.value = 'draft'
})

watch(conflictState, (conflict) => {
  if (conflict === 'deleted') activeDialog.value = 'deleted'
  else if (conflict === 'updated') activeDialog.value = 'conflict'
})

onMounted(() => window.addEventListener('keydown', handleGlobalUndo))
onBeforeUnmount(() => window.removeEventListener('keydown', handleGlobalUndo))

async function save(): Promise<void> {
  const saved = await saveNote()
  if (saved) activeDialog.value = null
}

async function cancel(): Promise<void> {
  activeDialog.value = null
  await cancelEdit()
}

async function requestCancel(): Promise<void> {
  if (isDirty.value) {
    activeDialog.value = 'cancel'
    return
  }
  await cancelEdit()
}

async function deleteNote(): Promise<void> {
  const deleted = await removeCurrentNote()
  if (deleted) activeDialog.value = null
}

async function goHome(): Promise<void> {
  activeDialog.value = null
  await navigateTo('/')
}
</script>

<template>
  <main v-if="isMissing" class="missing-page">
    <div class="missing-page__code">404</div>
    <h1 data-page-focus tabindex="-1">Заметка не найдена</h1>
    <p>Возможно, её удалили или ссылка устарела.</p>
    <NuxtLink class="missing-page__link" to="/">Вернуться к заметкам</NuxtLink>
  </main>

  <NoteEditor
      v-else-if="note"
      :note="note"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :is-new="isNewSession"
      :error-message="errorMessage"
      :invalid-field="invalidField"
      :save-status="saveStatus"
      @update:title="setTitle"
      @update:todo-text="setTodoText"
      @update:todo-completed="toggleTodo"
      @add:todo="addTodo"
      @remove:todo="removeTodo"
      @flush:text="flushTextChange"
      @undo="undo"
      @redo="redo"
      @save="save"
      @cancel="requestCancel"
      @delete="activeDialog = 'delete'"
  />

  <button
      v-if="pendingDraft && activeDialog !== 'draft'"
      class="draft-banner"
      type="button"
      @click="activeDialog = 'draft'"
  >
    Найден несохранённый черновик — выбрать действие
  </button>
  <button
      v-if="conflictState && activeDialog !== (conflictState === 'deleted' ? 'deleted' : 'conflict')"
      class="draft-banner"
      type="button"
      @click="activeDialog = conflictState === 'deleted' ? 'deleted' : 'conflict'"
  >
    {{ conflictState === 'deleted' ? 'Заметка удалена в другой вкладке' : 'Заметка изменилась в другой вкладке' }}
  </button>

</template>

<style scoped lang="scss">
.missing-page {
  display: flex;
  min-height: calc(100vh - 76px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 32px;
  text-align: center;

  &__code {
    color: #c8d6ce;
    font-size: 72px;
    font-weight: 700;
    letter-spacing: -5px;
  }

  h1 {
    margin: 8px 0;
    font-size: 22px;
    letter-spacing: -0.6px;
  }

  p {
    margin: 0 0 21px;
    color: var(--muted);
    font-size: 14px;
  }

  &__link {
    color: var(--accent);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }
}

.dialog-symbol {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #eaf1ed;
  color: var(--accent);
  font-size: 22px;
  font-weight: 600;

  &--warning {
    background: #fbf2df;
    color: #9a7126;
  }

  .draft-banner {
    position: fixed;
    z-index: 5;
    right: 20px;
    bottom: 20px;
    padding: 12px 16px;
    border: 1px solid #d5e0d9;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 8px 30px rgb(32 35 38 / 8%);
    color: var(--accent);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
}

.dialog-title {
  margin: 17px 0 7px;
  font-size: 18px;
  letter-spacing: -0.4px;
}

.dialog-copy {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.65;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}

.action-button {
  min-height: 37px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &--secondary {
    border-color: var(--line);
    background: white;
    color: #51575a;
  }

  &--primary {
    background: var(--accent);
    color: white;
  }

  &--danger {
    background: #ad5144;
    color: white;
  }
}
</style>
