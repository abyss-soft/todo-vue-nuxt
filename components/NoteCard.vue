<script setup lang="ts">
import type { Note } from '~/types/note';

defineProps<{
  note: Note;
}>();

defineEmits<{
  remove: [id: string];
}>();

const PREVIEW_LIMIT = 3;
</script>

<template>
  <article class="note-card">
    <NuxtLink class="note-card__main" :to="`/notes/${note.id}`">
      <div class="note-card__heading">
        <h2>{{ note.title }}</h2>
        <span>{{ note.todos.length }}</span>
      </div>
      <ul
        v-if="note.todos.length"
        class="note-card__todos"
        aria-label="Пункты заметки"
      >
        <li
          v-for="todo in note.todos.slice(0, PREVIEW_LIMIT)"
          :key="todo.id"
          :class="{ 'is-completed': todo.completed }"
        >
          <span class="todo-check" aria-hidden="true">
            <span v-if="todo.completed">&#10004;</span>
          </span>
          <span>{{ todo.text }}</span>
        </li>
        <li v-if="note.todos.length > PREVIEW_LIMIT" class="note-card__more">
          Ещё {{ note.todos.length - PREVIEW_LIMIT }}…
        </li>
      </ul>
      <p v-else class="note-card__empty">Пока нет пунктов</p>
    </NuxtLink>
    <div class="note-card__footer">
      <time :datetime="note.updatedAt"
        >{{ new Date(note.updatedAt).toLocaleDateString('ru-RU') }}
      </time>
      <div class="note-card__actions">
        <NuxtLink
          class="icon-button"
          :to="`/notes/${note.id}`"
          :aria-label="`Изменить: ${note.title}`"
        >
          <span aria-hidden="true">&#x270E;</span>
        </NuxtLink>
        <button
          class="icon-button"
          type="button"
          :aria-label="`Удалить: ${note.title}`"
          @click="$emit('remove', note.id)"
        >
          <span aria-hidden="true">&#128465;</span>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.note-card {
  display: flex;
  min-height: 232px;
  flex-direction: column;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: var(--surface);
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #d7d5ce;
    box-shadow: 0 10px 24px rgb(32 35 38 / 5%);
  }

  &__main {
    display: block;
    flex: 1;
    color: inherit;
    text-decoration: none;
  }

  &__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h2 {
      overflow: hidden;
      margin: 0;
      font-size: 16px;
      font-weight: 650;
      letter-spacing: -0.35px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > span {
      flex: 0 0 auto;
      color: var(--muted);
      font-size: 12px;
    }
  }

  &__todos {
    display: grid;
    gap: 10px;
    margin: 19px 0 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 9px;
      overflow: hidden;
      color: #555b61;
      font-size: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .is-completed > span:last-child {
      color: #a4a7a5;
      text-decoration: line-through;
    }
  }

  &__more {
    padding-left: 25px;
    color: var(--muted) !important;
  }

  &__empty {
    margin: 20px 0 0;
    color: var(--muted);
    font-size: 13px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid #f0efec;
    color: var(--muted);
    font-size: 12px;
  }

  &__actions {
    display: flex;
    gap: 4px;
  }
}

.todo-check {
  display: grid;
  color: var(--surface);
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  place-items: center;
  border: 1px solid #d5d7d4;
  border-radius: 5px;

  .is-completed & {
    border-color: var(--accent);
    background: var(--accent);
  }

  span {
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
  }
}

.icon-button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #858a8d;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: #f0efec;
    color: var(--ink);
  }

  span {
    font-size: 17px;
    line-height: 1;
  }
}
</style>
