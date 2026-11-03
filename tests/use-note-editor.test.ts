import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type App,
  createApp,
  defineComponent,
  nextTick,
  ref,
  type Ref,
} from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createNote } from '~/domain/note/factory';
import { draftStorageKey, writeNotes } from '~/services/storage/notes-storage';
import { useNotesStore } from '~/stores/notes';
import { useNoteEditor } from '~/composables/useNoteEditor';

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn(),
  onBeforeRouteUpdate: vi.fn(),
}));

type Editor = ReturnType<typeof useNoteEditor>;

let mountedApps: Array<{ app: App; host: HTMLElement }> = [];
let routerPush: ReturnType<typeof vi.fn>;

function mountEditor(initialRouteId: string): {
  editor: Editor;
  routeId: Ref<string>;
} {
  const routeId = ref(initialRouteId);
  let editor!: Editor;
  const app = createApp(
    defineComponent({
      setup() {
        editor = useNoteEditor(routeId);
        return () => null;
      },
    }),
  );
  const host = document.createElement('div');
  document.body.append(host);
  app.mount(host);
  mountedApps.push({ app, host });
  return { editor, routeId };
}

describe('useNoteEditor workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    mountedApps = [];
    routerPush = vi.fn(async () => undefined);
    setActivePinia(createPinia());
    vi.stubGlobal('useRouter', () => ({ push: routerPush }));
    vi.stubGlobal('useState', (key: string, initializer: () => string) =>
      ref(key === 'daymark-tab-id' ? 'test-tab' : initializer()),
    );
  });

  afterEach(() => {
    for (const { app, host } of mountedApps) {
      app.unmount();
      host.remove();
    }
    mountedApps = [];
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('saves the same existing note repeatedly without a stale baseline conflict', async () => {
    const { editor, routeId } = mountEditor('new');
    editor.setTitle('First version');
    expect(editor.canUndo.value).toBe(true);
    editor.undo();
    expect(editor.note.value?.title).toBe('');
    expect(editor.canRedo.value).toBe(true);
    editor.redo();

    expect(await editor.save()).toBe(true);
    const savedId = editor.note.value!.id;
    routeId.value = savedId;
    await nextTick();

    editor.setTitle('Second version');
    expect(await editor.save()).toBe(true);
    expect(editor.note.value?.title).toBe('Second version');
    expect(editor.isDirty.value).toBe(false);
    expect(editor.saveStatus.value).toBe('saved');

    editor.setTitle('Third version');
    expect(await editor.save()).toBe(true);
    expect(useNotesStore().findNote(savedId)?.title).toBe('Third version');
  });

  it('detects an update from another tab and offers reload or recovery', async () => {
    const store = useNotesStore();
    const original = createNote();
    original.title = 'Original';
    const saved = store.saveNote(original, null);
    if (saved.status !== 'saved')
      throw new Error('Test setup could not save the note');

    const { editor } = mountEditor(saved.note.id);
    editor.setTitle('My changes');

    const remote = {
      ...saved.note,
      title: 'Changed elsewhere',
      updatedAt: new Date(Date.parse(saved.note.updatedAt) + 1).toISOString(),
    };
    expect(writeNotes([remote])).toBeNull();

    expect(await editor.save()).toBe(false);
    expect(editor.conflictState.value).toBe('updated');

    editor.resolveConflict('reload');
    expect(editor.note.value?.title).toBe('Changed elsewhere');
    expect(editor.isDirty.value).toBe(false);

    editor.setTitle('Keep these changes');
    const latest = store.findNote(saved.note.id)!;
    store.deleteNote(latest.id);
    expect(editor.conflictState.value).toBe('deleted');
    editor.resolveConflict('recover');
    expect(editor.isNewSession.value).toBe(true);
    expect(await editor.save()).toBe(true);
    expect(store.findNote(editor.note.value!.id)?.title).toBe(
      'Keep these changes',
    );
  });

  it('restores a recovered-as-new draft after reload on the original route', async () => {
    vi.useFakeTimers();
    const store = useNotesStore();
    const original = createNote();
    original.title = 'Recover this';
    const saved = store.saveNote(original, null);
    if (saved.status !== 'saved')
      throw new Error('Test setup could not save the note');

    const firstSession = mountEditor(saved.note.id);
    store.deleteNote(saved.note.id);
    firstSession.editor.recoverAsNew();
    const recoveredId = firstSession.editor.note.value!.id;
    expect(recoveredId).not.toBe(saved.note.id);
    await vi.advanceTimersByTimeAsync(700);

    const storedDraft = JSON.parse(
      localStorage.getItem(draftStorageKey('test-tab', saved.note.id)) ??
        'null',
    ) as { noteId: string | null; note: { id: string } };
    expect(storedDraft.noteId).toBeNull();
    expect(storedDraft.note.id).toBe(recoveredId);

    for (const { app, host } of mountedApps) {
      app.unmount();
      host.remove();
    }
    mountedApps = [];

    setActivePinia(createPinia());
    useNotesStore().hydrate();
    const restoredSession = mountEditor(saved.note.id);
    await nextTick();
    expect(restoredSession.editor.pendingDraft.value).not.toBeNull();

    restoredSession.editor.restorePendingDraft();
    expect(restoredSession.editor.isNewSession.value).toBe(true);
    expect(restoredSession.editor.note.value?.id).toBe(recoveredId);
    expect(await restoredSession.editor.save()).toBe(true);
    expect(useNotesStore().findNote(recoveredId)?.title).toBe('Recover this');
  });
});
