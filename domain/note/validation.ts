import type { Note } from '~/types/note'

export type NoteValidation =
  | { valid: true; message: null; field: null }
  | { valid: false; message: string; field: string }

export function validateNote(note: Note): NoteValidation {
  if (!note.title.trim()) {
    return { valid: false, message: 'Добавьте название заметки.', field: 'title' }
  }

  const emptyTodo = note.todos.find(todo => !todo.text.trim())
  if (emptyTodo) {
    return {
      valid: false,
      message: 'Заполните или удалите пустые пункты списка.',
      field: `todo:${emptyTodo.id}`,
    }
  }

  return { valid: true, message: null, field: null }
}
