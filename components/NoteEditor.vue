<script setup lang="ts">
import type { Note } from '~/types/note'

defineProps<{
  note: Note
  canUndo: boolean
  canRedo: boolean
  isNew: boolean
  errorMessage: string | null
  invalidField: string | null
  saveStatus: 'idle' | 'saved'
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:todo-text': [id: string, value: string]
  'update:todo-completed': [id: string]
  'add:todo': []
  'remove:todo': [id: string]
  'flush:text': []
  undo: []
  redo: []
  save: []
  cancel: []
  delete: []
}>()
</script>

<template>
  <main class="editor-page">
    <div class="editor-toolbar">
      <button class="back-link" type="button" @click="emit('cancel')">
        <span aria-hidden="true">&#8592;</span>
        Все заметки
      </button>
      <div class="editor-toolbar__actions">
        <button
          class="button button--quiet"
          type="button"
          :disabled="!canUndo"
          aria-label="Отменить последнее изменение"
          title="Отменить (Ctrl+Z)"
          @click="emit('undo')"
        >
          <span aria-hidden="true">&#8598;</span>
          <span>Отменить</span>
        </button>
        <button
          class="button button--quiet"
          type="button"
          :disabled="!canRedo"
          aria-label="Повторить отменённое изменение"
          title="Повторить (Ctrl+Shift+Z)"
          @click="emit('redo')"
        >
          <span aria-hidden="true">&#8634;</span>
          <span>Повторить</span>
        </button>
      </div>
    </div>

    <section class="editor-card">
      <div class="editor-card__eyebrow">
        <span>{{ isNew ? 'НОВАЯ ЗАМЕТКА' : 'РЕДАКТИРОВАНИЕ' }}</span>
        <span class="save-hint">
          {{ saveStatus === 'saved' ? 'Сохранено' : 'Изменения сохраняются по кнопке' }}
        </span>
      </div>

      <label class="sr-only" for="note-title">Название заметки</label>
      <input
        id="note-title"
        class="note-title"
        type="text"
        :value="note.title"
        placeholder="Название заметки"
        maxlength="120"
        autofocus
        :aria-invalid="invalidField === 'title'"
        :aria-describedby="invalidField === 'title' ? 'form-error' : undefined"
        @input="emit('update:title', ($event.target as HTMLInputElement).value)"
        @blur="emit('flush:text')"
      >

      <div class="todo-heading">
        <div>
          <h1>Список дел</h1>
          <p>Разложите планы на небольшие шаги.</p>
        </div>
        <span>{{ note.todos.filter(todo => todo.completed).length }} из {{ note.todos.length }}</span>
      </div>

      <TodoList
        :todos="note.todos"
        editable
        :invalid-field="invalidField"
        error-id="form-error"
        @update:text="(id, value) => emit('update:todo-text', id, value)"
        @update:completed="id => emit('update:todo-completed', id)"
        @remove="id => emit('remove:todo', id)"
        @flush:text="emit('flush:text')"
      />

      <button class="add-todo" type="button" @click="emit('add:todo')">
        <span aria-hidden="true">+</span>
        Добавить пункт
      </button>

      <p v-if="errorMessage" id="form-error" class="form-error" role="alert">{{ errorMessage }}</p>

      <footer class="editor-card__footer">
        <button
          v-if="!isNew"
          class="button button--danger-quiet"
          type="button"
          @click="emit('delete')"
        >
          Удалить заметку
        </button>
        <span v-else />
        <div class="editor-card__footer-actions">
          <button class="button button--secondary" type="button" @click="emit('cancel')">
            Отменить
          </button>
          <button
            class="button button--primary"
            type="button"
            @click="emit('save')"
          >
            Сохранить
          </button>
        </div>
      </footer>
      <p v-if="saveStatus === 'saved'" class="save-status" role="status">Изменения сохранены</p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.editor-page {
  width: min(100% - 48px, 800px);
  margin: 0 auto;
  padding: 28px 0 72px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;

  &__actions {
    display: flex;
    gap: 5px;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #656b6e;
  font-size: 13px;
  font-weight: 550;
  text-decoration: none;
  border: 0;
  padding: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;

  &:hover {
    color: var(--ink);
  }

  > span {
    font-size: 18px;
    line-height: 1;
  }
}

.editor-card {
  padding: 32px 38px 26px;
  border: 1px solid var(--line);
  border-radius: 17px;
  background: var(--surface);
  box-shadow: 0 12px 40px rgb(34 35 33 / 3%);

  &__eyebrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    color: #929792;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.1px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 30px;
    padding-top: 19px;
    border-top: 1px solid #eeede9;
  }

  &__footer-actions {
    display: flex;
    gap: 9px;
  }
}

.save-hint {
  color: #a4a8a4;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
}

.note-title {
  width: 100%;
  padding: 0 0 21px;
  border: 0;
  border-bottom: 1px solid #eeede9;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-size: clamp(26px, 5vw, 36px);
  font-weight: 680;
  letter-spacing: -1.5px;

  &::placeholder {
    color: #c0c2be;
  }
}

.todo-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 26px 0 11px;

  h1 {
    margin: 0;
    font-size: 14px;
    font-weight: 650;
  }

  p {
    margin: 5px 0 0;
    color: var(--muted);
    font-size: 12px;
  }

  > span {
    color: var(--muted);
    font-size: 12px;
  }
}

.add-todo {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin: 8px 0 0 8px;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  span {
    display: grid;
    width: 19px;
    height: 19px;
    place-items: center;
    border: 1px solid #c9d8d1;
    border-radius: 6px;
    font-size: 17px;
    font-weight: 400;
    line-height: 1;
  }

  &:hover {
    color: #1d5b41;
  }
}

.form-error {
  margin: 12px 0 0;
  color: #ad5144;
  font-size: 13px;
}

.save-status {
  margin: 10px 0 0;
  color: var(--accent);
  font-size: 12px;
  text-align: right;
}

.button {
  display: inline-flex;
  min-height: 37px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 130ms ease, color 130ms ease, border-color 130ms ease;

  &:disabled {
    color: #b6b9b6;
    cursor: not-allowed;
  }

  > span[aria-hidden="true"] {
    font-size: 17px;
    line-height: 1;
  }

  &--quiet {
    min-height: 33px;
    color: #676d70;

    &:hover:not(:disabled) {
      background: #eeede9;
      color: var(--ink);
    }
  }

  &--secondary {
    border-color: var(--line);
    background: var(--surface);
    color: #545a5d;

    &:hover {
      background: #f7f7f5;
    }
  }

  &--primary {
    background: var(--accent);
    color: var(--surface);

    &:hover {
      background: #245c45;
    }
  }

  &--danger-quiet {
    color: #ad5144;

    &:hover {
      background: #fbefed;
    }
  }
}

@media (max-width: 640px) {
  .editor-page {
    width: min(100% - 32px, 800px);
    padding-top: 20px;
  }

  .editor-card {
    padding: 24px 20px 20px;
  }

  .editor-toolbar__actions .button {
    padding: 0 8px;

    span {
      display: none;
    }
  }

  .save-hint {
    display: none;
  }
}

@media (max-width: 420px) {
  .editor-card__footer {
    align-items: flex-start;
    flex-direction: column-reverse;
  }

  .editor-card__footer-actions {
    width: 100%;

    .button {
      flex: 1;
    }
  }
}
</style>
