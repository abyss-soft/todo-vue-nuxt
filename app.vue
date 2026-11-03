<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import { useNotesStore } from '~/stores/notes';

const notesStore = useNotesStore();
</script>

<template>
  <div>
    <AppHeader />
    <NuxtPage />
    <p
      v-if="notesStore.storageError"
      class="global-storage-error"
      role="alert"
      aria-live="assertive"
    >
      {{ notesStore.storageError }}
    </p>
  </div>
</template>
