export interface TodoItem {
  id: string
  text: string
  completed: boolean
}

export interface Note {
  id: string
  title: string
  todos: TodoItem[]
  createdAt: string
  updatedAt: string
}

export interface PersistedNotes {
  version: 2
  notes: Note[]
}

export type SaveNoteResult =
    | { status: 'saved'; note: Note }
    | { status: 'conflict' }
    | { status: 'missing' }
    | { status: 'storage-error'; message: string }

export type DeleteNoteResult =
    | { status: 'deleted' }
    | { status: 'missing' }
    | { status: 'storage-error'; message: string }

export interface ReadResult<T> {
  value: T
  error: string | null
}
