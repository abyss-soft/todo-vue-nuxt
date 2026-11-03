import { defineStore } from 'pinia';
import type { DeleteNoteResult, Note, SaveNoteResult } from '~/types/note';
import { cloneNote } from '~/domain/note/factory';
import {
  NOTES_STORAGE_KEY,
  parseNotes,
  readNotes,
  writeNotes,
} from '~/services/storage/notes-storage';

function nextUpdatedAt(previous: string | undefined): string {
  const previousTime = previous ? Date.parse(previous) : Number.NaN;
  const nextTime = Math.max(
    Date.now(),
    Number.isFinite(previousTime) ? previousTime + 1 : 0,
  );

  return new Date(nextTime).toISOString();
}

export const useNotesStore = defineStore('notes', {
  state: () => ({
    notes: [] as Note[],
    initialized: false,
    storageError: null as string | null,
  }),

  getters: {
    sortedNotes: (state) =>
      [...state.notes].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      ),
  },

  actions: {
    hydrate(): void {
      const result = readNotes();
      this.notes = result.value.map(cloneNote);
      this.storageError = result.error;
      this.initialized = true;
    },

    findNote(id: string): Note | undefined {
      return this.notes.find((note) => note.id === id);
    },

    syncFromStorage(raw: string | null): void {
      if (raw === null) {
        this.notes = [];
        this.storageError = null;
        return;
      }

      const result = parseNotes(raw);
      this.notes = result.value.map(cloneNote);
      this.storageError = result.error;
    },

    saveNote(note: Note, expectedUpdatedAt: string | null): SaveNoteResult {
      const persisted = readNotes();
      if (persisted.error) {
        this.storageError = persisted.error;
        return { status: 'storage-error', message: persisted.error };
      }

      const notes = persisted.value;
      const existing = notes.find((item) => item.id === note.id);

      if (expectedUpdatedAt === null && existing) return { status: 'conflict' };
      if (expectedUpdatedAt !== null && !existing) return { status: 'missing' };
      if (
        expectedUpdatedAt !== null &&
        existing?.updatedAt !== expectedUpdatedAt
      ) {
        return { status: 'conflict' };
      }

      const savedNote: Note = {
        ...cloneNote(note),
        createdAt: existing?.createdAt ?? note.createdAt,
        updatedAt: nextUpdatedAt(existing?.updatedAt),
      };
      const nextNotes = existing
        ? notes.map((item) => (item.id === note.id ? savedNote : item))
        : [...notes, savedNote];

      const error = writeNotes(nextNotes);
      if (error) {
        this.storageError = error;
        return { status: 'storage-error', message: error };
      }

      this.notes = nextNotes.map(cloneNote);
      this.storageError = null;
      return { status: 'saved', note: cloneNote(savedNote) };
    },

    deleteNote(id: string): DeleteNoteResult {
      const persisted = readNotes();
      if (persisted.error) {
        this.storageError = persisted.error;
        return { status: 'storage-error', message: persisted.error };
      }

      if (!persisted.value.some((note) => note.id === id)) {
        this.notes = persisted.value.map(cloneNote);
        return { status: 'missing' };
      }

      const nextNotes = persisted.value.filter((note) => note.id !== id);
      const error = writeNotes(nextNotes);
      if (error) {
        this.storageError = error;
        return { status: 'storage-error', message: error };
      }

      this.notes = nextNotes.map(cloneNote);
      this.storageError = null;
      return { status: 'deleted' };
    },
  },
});

export { NOTES_STORAGE_KEY };
