import type { Note, PersistedNotes, ReadResult } from '~/types/note'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const NOTES_STORAGE_KEY = 'daymark:notes'
const NOTES_SCHEMA_VERSION = 2

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTodo(value: unknown): boolean {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.text === 'string'
    && typeof value.completed === 'boolean'
}

function isNote(value: unknown): value is Note {
  if (!isRecord(value) || !Array.isArray(value.todos)) return false

  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && value.todos.every(isTodo)
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
}

export function parseNotes(raw: string): ReadResult<Note[]> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { value: [], error: 'Данные заметок повреждены и не могут быть прочитаны.' }
  }

  if (!isRecord(parsed)) {
    return { value: [], error: 'Формат сохранённых заметок не распознан.' }
  }

  if (parsed.version !== NOTES_SCHEMA_VERSION) {
    return { value: [], error: 'Версия хранилища заметок не поддерживается.' }
  }

  if (!Array.isArray(parsed.notes) || !parsed.notes.every(isNote)) {
    return { value: [], error: 'Структура сохранённых заметок повреждена.' }
  }

  return { value: parsed.notes, error: null }
}

export function readNotes(storage: StorageLike | null = browserStorage()): ReadResult<Note[]> {
  if (!storage) {
    return {
      value: [],
      error: typeof window === 'undefined' ? null : 'Браузерное хранилище недоступно.',
    }
  }

  try {
    const raw = storage.getItem(NOTES_STORAGE_KEY)
    if (raw === null) return { value: [], error: null }

    const result = parseNotes(raw)
    if (result.error && result.error !== 'Версия хранилища заметок не поддерживается.') {
      try {
        storage.removeItem(NOTES_STORAGE_KEY)
      } catch {
        return { ...result, error: `${result.error} Повреждённую запись не удалось очистить.` }
      }
    }

    return result
  } catch {
    return { value: [], error: 'Не удалось прочитать заметки из локального хранилища.' }
  }
}

export function writeNotes(
  notes: Note[],
  storage: StorageLike | null = browserStorage(),
): string | null {
  if (!storage) {
    return typeof window === 'undefined' ? null : 'Браузерное хранилище недоступно.'
  }

  try {
    const payload: PersistedNotes = { version: NOTES_SCHEMA_VERSION, notes }
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify(payload))
    return null
  } catch {
    return 'Не удалось сохранить заметки. Проверьте доступное место в браузере.'
  }
}
