import type {Note, TodoItem} from '~/types/note'

type TextPatch =
    | { type: 'title'; before: string; after: string }
    | { type: 'todo-text'; todoId: string; before: string; after: string }

type NotePatch =
    | TextPatch
    | { type: 'todo-completed'; todoId: string; before: boolean; after: boolean }
    | { type: 'todo-inserted'; index: number; todo: TodoItem }
    | { type: 'todo-removed'; index: number; todo: TodoItem }

const HISTORY_LIMIT = 50

function patchKey(patch: TextPatch): string {
    return patch.type === 'title' ? 'title' : `todo-text:${patch.todoId}`
}

function applyPatch(note: Note, patch: NotePatch, inverse = false): void {
    switch (patch.type) {
        case 'title':
            note.title = inverse ? patch.before : patch.after
            break
        case 'todo-text': {
            const todo = note.todos.find(item => item.id === patch.todoId)
            if (todo) todo.text = inverse ? patch.before : patch.after
            break
        }
        case 'todo-completed': {
            const todo = note.todos.find(item => item.id === patch.todoId)
            if (todo) todo.completed = inverse ? patch.before : patch.after
            break
        }
        case 'todo-inserted':
            if (inverse) {
                note.todos = note.todos.filter(item => item.id !== patch.todo.id)
            } else if (!note.todos.some(item => item.id === patch.todo.id)) {
                note.todos.splice(Math.min(patch.index, note.todos.length), 0, {...patch.todo})
            }
            break
        case 'todo-removed':
            if (inverse) {
                if (!note.todos.some(item => item.id === patch.todo.id)) {
                    note.todos.splice(Math.min(patch.index, note.todos.length), 0, {...patch.todo})
                }
            } else {
                note.todos = note.todos.filter(item => item.id !== patch.todo.id)
            }
            break
    }
}

export class NoteHistory {
    private patches: NotePatch[] = []
    private cursor = 0
    private pendingText: TextPatch | null = null

    get canUndo(): boolean {
        return this.cursor > 0 || this.pendingText !== null
    }

    get canRedo(): boolean {
        return this.pendingText === null && this.cursor < this.patches.length
    }

    setTitle(note: Note, value: string): void {
        this.updateText(note, {type: 'title', before: note.title, after: value})
        note.title = value
    }

    setTodoText(note: Note, todoId: string, value: string): void {
        const todo = note.todos.find(item => item.id === todoId)
        if (!todo) return

        this.updateText(note, {
            type: 'todo-text',
            todoId,
            before: todo.text,
            after: value,
        })
        todo.text = value
    }

    toggleTodo(note: Note, todoId: string): void {
        this.flushTextChange(note)
        const todo = note.todos.find(item => item.id === todoId)
        if (!todo) return

        const patch: NotePatch = {
            type: 'todo-completed',
            todoId,
            before: todo.completed,
            after: !todo.completed,
        }
        applyPatch(note, patch)
        this.push(patch)
    }

    insertTodo(note: Note, todo: TodoItem): void {
        this.flushTextChange(note)
        const patch: NotePatch = {
            type: 'todo-inserted',
            index: note.todos.length,
            todo: {...todo},
        }
        applyPatch(note, patch)
        this.push(patch)
    }

    removeTodo(note: Note, todoId: string): void {
        this.flushTextChange(note)
        const index = note.todos.findIndex(item => item.id === todoId)
        if (index < 0) return

        const patch: NotePatch = {
            type: 'todo-removed',
            index,
            todo: {...note.todos[index]!},
        }
        applyPatch(note, patch)
        this.push(patch)
    }

    flushTextChange(note: Note): void {
        const patch = this.pendingText
        this.pendingText = null
        if (!patch || patch.before === patch.after) return
        this.push(patch)
    }

    undo(note: Note): boolean {
        this.flushTextChange(note)
        if (this.cursor === 0) return false

        this.cursor -= 1
        applyPatch(note, this.patches[this.cursor]!, true)
        return true
    }

    redo(note: Note): boolean {
        this.flushTextChange(note)
        if (this.cursor >= this.patches.length) return false

        applyPatch(note, this.patches[this.cursor]!)
        this.cursor += 1
        return true
    }

    reset(): void {
        this.patches = []
        this.cursor = 0
        this.pendingText = null
    }

    private updateText(note: Note, patch: TextPatch): void {
        if (this.pendingText && patchKey(this.pendingText) !== patchKey(patch)) {
            this.flushTextChange(note)
        }

        if (!this.pendingText) {
            this.pendingText = {...patch}
        } else {
            this.pendingText = {...this.pendingText, after: patch.after}
        }
    }

    private push(patch: NotePatch): void {
        if (this.cursor < this.patches.length) {
            this.patches.splice(this.cursor)
        }

        this.patches.push(patch)
        this.cursor = this.patches.length

        if (this.patches.length > HISTORY_LIMIT) {
            const overflow = this.patches.length - HISTORY_LIMIT
            this.patches.splice(0, overflow)
            this.cursor -= overflow
        }
    }
}
