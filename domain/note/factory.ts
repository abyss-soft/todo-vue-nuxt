import type { Note, TodoItem } from '~/types/note'

export function createId(): string {
  return globalThis.crypto.randomUUID()
}

export function createNote(now = new Date()): Note {
  const timestamp = now.toISOString()

  return {
    id: createId(),
    title: '',
    todos: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createTodo(text = ''): TodoItem {
  return {
    id: createId(),
    text,
    completed: false,
  }
}

export function cloneNote(note: Note): Note {
  return {
    ...note,
    todos: note.todos.map(todo => ({ ...todo })),
  }
}
