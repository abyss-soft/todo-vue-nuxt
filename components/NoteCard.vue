<script setup lang="ts">
import type {Note} from '~/types/note'

defineProps<{
  note: Note
}>()

defineEmits<{
  remove: [id: string]
}>()

const PREVIEW_LIMIT = 3
</script>

<template>
  <article>
    <NuxtLink :to="`/notes/${note.id}`">
      <div>
        <h2>{{ note.title }}</h2>
        <span>{{ note.todos.length }}</span>
      </div>
      <ul v-if="note.todos.length">
        <li
            v-for="todo in note.todos.slice(0, PREVIEW_LIMIT)"
            :key="todo.id"
        >
          <span>
            <svg v-if="todo.completed" viewBox="0 0 16 16" focusable="false">
              <path d="m3.5 8.2 2.8 2.7 6.2-6.1"/>
            </svg>
          </span>
          <span>{{ todo.text }}</span>
        </li>
        <li v-if="note.todos.length > PREVIEW_LIMIT">
          Ещё {{ note.todos.length - PREVIEW_LIMIT }}…
        </li>
      </ul>
      <p v-else>Пока нет пунктов</p>
    </NuxtLink>
    <div>
      <time :datetime="note.updatedAt">{{ new Date(note.updatedAt).toLocaleDateString('ru-RU') }}</time>
      <div>
        <NuxtLink :to="`/notes/${note.id}`">
          <svg viewBox="0 0 20 20">
            <path d="m13.8 3.2 3 3-9.5 9.5-4 1 1-4zM11.9 5l3 3"/>
          </svg>
        </NuxtLink>
        <button type="button" @click="$emit('remove', note.id)">
          <svg viewBox="0 0 20 20">
            <path d="M4.5 6h11M8 6V4h4v2m2 0-.6 10H6.6L6 6m2.5 3v4m3-4v4"/>
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
</style>
