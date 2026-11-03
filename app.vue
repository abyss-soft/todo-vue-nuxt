<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import { useNotesStore } from '~/stores/notes';

const notesStore = useNotesStore();

function exportStorageData(): void {
  const data = notesStore.storageExportData;
  if (!data) return;

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'daymark-notes-unsupported-version.json';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
</script>

<template>
  <div>
    <AppHeader />
    <NuxtPage />
    <div
      v-if="notesStore.storageError"
      class="global-storage-error"
      role="alert"
      aria-live="assertive"
    >
      <span>{{ notesStore.storageError }}</span>
      <button
        v-if="notesStore.storageExportData"
        class="global-storage-error__export"
        type="button"
        @click="exportStorageData"
      >
        Скачать данные
      </button>
    </div>
  </div>
</template>
