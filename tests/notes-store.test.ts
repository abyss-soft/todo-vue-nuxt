import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createNote } from '~/domain/note/factory';
import {
  NOTES_STORAGE_KEY,
  readNotes,
  writeNotes,
} from '~/services/storage/notes-storage';
import { useNotesStore } from '~/stores/notes';

describe('notes store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('saves notes and detects stale edits instead of overwriting them', () => {
    const store = useNotesStore();
    const note = createNote();
    note.title = 'First version';

    const firstSave = store.saveNote(note, null);
    expect(firstSave.status).toBe('saved');
    if (firstSave.status !== 'saved') return;

    const remoteVersion = {
      ...firstSave.note,
      title: 'Updated elsewhere',
      updatedAt: new Date(
        Date.parse(firstSave.note.updatedAt) + 1,
      ).toISOString(),
    };
    const persistError = writeNotes([remoteVersion]);
    expect(persistError).toBeNull();

    const staleSave = store.saveNote(
      { ...note, title: 'My stale edit' },
      firstSave.note.updatedAt,
    );
    expect(staleSave.status).toBe('conflict');
    expect(readNotes().value[0]?.title).toBe('Updated elsewhere');
  });

  it('removes a note from persistence', () => {
    const store = useNotesStore();
    const note = createNote();
    note.title = 'Remove me';
    store.saveNote(note, null);

    expect(store.deleteNote(note.id).status).toBe('deleted');
    expect(store.findNote(note.id)).toBeUndefined();
    expect(readNotes().value).toEqual([]);
  });

  it('syncs a deletion written by another tab', () => {
    const store = useNotesStore();
    const note = createNote();
    note.title = 'Deleted elsewhere';
    store.saveNote(note, null);

    expect(writeNotes([])).toBeNull();
    store.syncFromStorage(localStorage.getItem(NOTES_STORAGE_KEY));

    expect(store.findNote(note.id)).toBeUndefined();
  });
});
