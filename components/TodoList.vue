<script setup lang="ts">
import type { TodoItem } from '~/types/note';

defineProps<{
  todos: TodoItem[];
  editable?: boolean;
  invalidField?: string | null;
  errorId?: string;
}>();

defineEmits<{
  'update:text': [id: string, value: string];
  'update:completed': [id: string];
  remove: [id: string];
  'flush:text': [];
}>();
</script>

<template>
  <ul class="todo-list">
    <li v-for="todo in todos" :key="todo.id" class="todo-row">
      <input
        class="todo-row__checkbox"
        type="checkbox"
        :checked="todo.completed"
        :disabled="!editable"
        :aria-label="`${todo.completed ? 'Снять отметку' : 'Отметить'}: ${todo.text || 'пустой пункт'}`"
        @change="$emit('update:completed', todo.id)"
      />
      <input
        v-if="editable"
        class="todo-row__text"
        type="text"
        :value="todo.text"
        :aria-label="`Текст пункта ${todo.text || 'без названия'}`"
        :aria-invalid="invalidField === `todo:${todo.id}`"
        :aria-describedby="
          invalidField === `todo:${todo.id}` ? errorId : undefined
        "
        placeholder="Что нужно сделать?"
        @input="
          $emit(
            'update:text',
            todo.id,
            ($event.target as HTMLInputElement).value,
          )
        "
        @blur="$emit('flush:text')"
      />
      <span
        v-else
        class="todo-row__text"
        :class="{ 'is-completed': todo.completed }"
      >
        {{ todo.text }}
      </span>
      <button
        v-if="editable"
        class="todo-row__remove"
        type="button"
        :aria-label="`Удалить пункт ${todo.text || 'без названия'}`"
        @click="$emit('remove', todo.id)"
      >
        <span aria-hidden="true">&#10005;</span>
      </button>
    </li>
    <li v-if="!todos.length" class="todo-list__empty">
      {{ editable ? 'Добавьте первый пункт в список.' : 'Список пока пуст.' }}
    </li>
  </ul>
</template>

<style scoped lang="scss">
.todo-list {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;

  &__empty {
    padding: 13px 10px;
    color: var(--muted);
    font-size: 14px;
  }
}

.todo-row {
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: 12px;
  padding: 4px 8px;
  border-radius: 9px;

  &:hover {
    background: #f8f8f6;
  }

  &__checkbox {
    width: 17px;
    height: 17px;
    flex: 0 0 17px;
    accent-color: var(--accent);
    cursor: pointer;

    &:disabled {
      cursor: default;
    }
  }

  &__text {
    width: 100%;
    min-width: 0;
    padding: 8px 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: 14px;

    &::placeholder {
      color: #a6aaa8;
    }

    &.is-completed {
      color: #a4a7a5;
      text-decoration: line-through;
    }
  }

  &__remove {
    display: grid;
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    place-items: center;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #969b99;
    cursor: pointer;

    &:hover {
      background: #eeeae7;
      color: #ad5144;
    }

    span {
      font-size: 21px;
      line-height: 1;
    }
  }
}
</style>
