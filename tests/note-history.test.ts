import { describe, expect, it } from 'vitest';
import { NoteHistory } from '~/domain/history/note-history';
import { createNote, createTodo } from '~/domain/note/factory';

describe('NoteHistory', () => {
  it('groups continuous edits to one text field into a single undo step', () => {
    const note = createNote();
    const history = new NoteHistory();

    history.setTitle(note, 'Pla');
    history.setTitle(note, 'Plan');
    history.setTitle(note, 'Plans for the week');
    history.flushTextChange(note);

    expect(note.title).toBe('Plans for the week');
    expect(history.undo(note)).toBe(true);
    expect(note.title).toBe('');
    expect(history.canUndo).toBe(false);
    expect(history.redo(note)).toBe(true);
    expect(note.title).toBe('Plans for the week');
  });

  it('keeps atomic todo changes separate and drops the redo branch', () => {
    const note = createNote();
    const todo = createTodo('Call the team');
    const history = new NoteHistory();

    history.insertTodo(note, todo);
    history.toggleTodo(note, todo.id);
    expect(note.todos[0]?.completed).toBe(true);

    history.undo(note);
    expect(note.todos[0]?.completed).toBe(false);
    expect(history.canRedo).toBe(true);

    history.setTitle(note, 'A new title');
    history.flushTextChange(note);
    expect(history.canRedo).toBe(false);
    expect(history.redo(note)).toBe(false);
  });

  it('restores deleted items at their original position', () => {
    const note = createNote();
    const first = createTodo('First');
    const second = createTodo('Second');
    const history = new NoteHistory();

    history.insertTodo(note, first);
    history.insertTodo(note, second);
    history.removeTodo(note, first.id);
    expect(note.todos.map((todo) => todo.text)).toEqual(['Second']);

    history.undo(note);
    expect(note.todos.map((todo) => todo.text)).toEqual(['First', 'Second']);
  });

  it('retains no more than 50 undoable patches', () => {
    const note = createNote();
    const todo = createTodo('Toggle');
    const history = new NoteHistory();
    history.insertTodo(note, todo);

    for (let index = 0; index < 55; index += 1) {
      history.toggleTodo(note, todo.id);
    }

    for (let index = 0; index < 50; index += 1) {
      expect(history.undo(note)).toBe(true);
    }
    expect(history.undo(note)).toBe(false);
    expect(note.todos[0]?.completed).toBe(true);
  });
});
