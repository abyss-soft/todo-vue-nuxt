<script setup lang="ts">
import { ref } from 'vue';
import NoteCard from '@/components/NoteCard.vue';
import { useNotesStore } from '~/stores/notes';

const store = useNotesStore();
const noteToDelete = ref<string | null>(null);
const deletionError = ref<string | null>(null);

const targetNote = computed(() => store.findNote(noteToDelete.value ?? ''));

function openDelete(id: string): void {
  deletionError.value = null;
  noteToDelete.value = id;
}

function confirmDelete(): void {
  if (!noteToDelete.value) return;

  const result = store.deleteNote(noteToDelete.value);
  if (result.status === 'storage-error') {
    deletionError.value = result.message;
  } else {
    noteToDelete.value = null;
    deletionError.value = null;
  }
}
</script>

<template>
  <main class="home-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">ВАШЕ ПРОСТРАНСТВО</p>
        <h1 data-page-focus tabindex="-1">Заметки</h1>
        <p class="page-heading__description">
          Соберите важные мысли и планы в одном месте.
        </p>
      </div>
      <NuxtLink class="create-button" to="/notes/new">
        <span aria-hidden="true">+</span>
        Новая заметка
      </NuxtLink>
    </div>

    <section
      v-if="store.sortedNotes.length"
      class="notes-grid"
      aria-label="Все заметки"
    >
      <NoteCard
        v-for="note in store.sortedNotes"
        :key="note.id"
        :note="note"
        @remove="openDelete"
      />
    </section>

    <section v-else class="empty-state">
      <h2>Пока здесь тихо</h2>
      <p>Создайте первую заметку — и добавьте к ней список дел.</p>
      <NuxtLink class="button-primary" to="/notes/new"
        >Создать заметку</NuxtLink
      >
    </section>

    <AppModal
      v-if="noteToDelete"
      label="Подтверждение удаления заметки"
      @close="noteToDelete = null"
    >
      <div class="confirm-icon confirm-icon--danger" aria-hidden="true">
        <span>!</span>
      </div>
      <h2 class="modal-title">Удалить заметку?</h2>
      <p class="modal-copy">
        «{{ targetNote?.title }}» будет удалена без возможности восстановления.
      </p>
      <p v-if="deletionError" class="modal-error" role="alert">
        {{ deletionError }}
      </p>
      <div class="modal-actions">
        <button
          class="button-secondary"
          type="button"
          @click="noteToDelete = null"
        >
          Оставить
        </button>
        <button class="button-danger" type="button" @click="confirmDelete">
          Удалить
        </button>
      </div>
    </AppModal>
  </main>
</template>

<style scoped lang="scss">
.home-page {
  width: min(100% - 48px, 1120px);
  min-height: calc(100vh - 76px);
  margin: 0 auto;
  padding: 60px 0 80px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 33px;

  h1 {
    margin: 8px 0 0;
    font-size: clamp(30px, 5vw, 40px);
    font-weight: 690;
    letter-spacing: -1.7px;
  }

  &__description {
    margin: 9px 0 0;
    color: var(--muted);
    font-size: 14px;
  }
}

.eyebrow {
  margin: 0;
  color: #858b88;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.3px;
}

.create-button,
.button-primary {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 16px;
  border: 0;
  border-radius: 9px;
  background: var(--accent);
  color: white;
  font-size: 13px;
  font-weight: 620;
  text-decoration: none;
  transition:
    background 140ms ease,
    transform 140ms ease;

  &:hover {
    transform: translateY(-1px);
    background: #245c45;
  }

  span {
    font-size: 19px;
    font-weight: 400;
    line-height: 1;
  }
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.empty-state {
  display: flex;
  min-height: 390px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;

  &__icon {
    display: grid;
    width: 66px;
    height: 66px;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: var(--surface);
    color: #7d9789;

    span {
      font-size: 31px;
      line-height: 1;
    }
  }

  h2 {
    margin: 19px 0 7px;
    font-size: 18px;
    letter-spacing: -0.3px;
  }

  p {
    margin: 0 0 20px;
    color: var(--muted);
    font-size: 13px;
  }
}

.confirm-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #fbefed;
  color: #ad5144;

  span {
    font-size: 22px;
    line-height: 1;
  }
}

.modal-title {
  margin: 17px 0 7px;
  font-size: 18px;
  letter-spacing: -0.4px;
}

.modal-copy,
.modal-error {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.modal-error {
  margin-top: 12px;
  color: #ad5144;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.button-secondary,
.button-danger {
  min-height: 37px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: #51575a;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.button-danger {
  border-color: #ad5144;
  background: #ad5144;
  color: white;
}

@media (max-width: 900px) {
  .notes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .home-page {
    width: min(100% - 32px, 1120px);
    padding-top: 38px;
  }

  .page-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }

  .empty-state {
    min-height: 340px;
  }
}
</style>
