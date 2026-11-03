import { describe, expect, it } from 'vitest';
import {
  draftStorageKey,
  NOTES_STORAGE_KEY,
  parseNotes,
  readDraft,
  readNotes,
  writeDraft,
} from '~/services/storage/notes-storage';
import { createNote } from '~/domain/note/factory';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('notes persistence', () => {
  it('reports and clears malformed note data', () => {
    const storage = new MemoryStorage();
    storage.setItem(NOTES_STORAGE_KEY, '{broken');

    const result = readNotes(storage);

    expect(result.value).toEqual([]);
    expect(result.error).toMatch(/повреждены/i);
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBeNull();
  });

  it('preserves data written with the current schema version', () => {
    const note = createNote();
    const raw = JSON.stringify({ version: 2, notes: [note] });

    expect(parseNotes(raw)).toEqual({ value: [note], error: null });
  });

  it('rejects unsupported schema versions without deleting stored data', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ version: 1, notes: [] });
    storage.setItem(NOTES_STORAGE_KEY, raw);

    expect(parseNotes(raw)).toEqual({
      value: [],
      error: 'Версия хранилища заметок не поддерживается.',
    });
    expect(readNotes(storage)).toEqual({
      value: [],
      error: 'Версия хранилища заметок не поддерживается.',
    });
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(raw);
  });

  it('persists and restores a versioned draft per tab and route', () => {
    const storage = new MemoryStorage();
    const note = createNote();
    note.title = 'Unsaved';
    const draft = {
      version: 1 as const,
      noteId: null,
      baseUpdatedAt: null,
      note,
      savedAt: new Date().toISOString(),
    };

    expect(writeDraft('tab-a', 'new', draft, storage)).toBeNull();
    expect(storage.getItem(draftStorageKey('tab-a', 'new'))).not.toBeNull();
    expect(readDraft('tab-a', 'new', storage)).toEqual({
      value: draft,
      error: null,
    });
    expect(readDraft('tab-b', 'new', storage).value).toBeNull();
  });
});
