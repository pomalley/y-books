<template>
  <q-layout view="hHh lpR fFf">
    <q-footer elevated>
      <q-toolbar>
        <q-toolbar-title> {{ route.params['external_path'] }} </q-toolbar-title>
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <q-spinner color="primary" class="q-ma-xl" size="xl" v-if="loading" />
      <public-book
        v-for="book in sortedBooks"
        :key="book.id"
        :book="(book as BookInterface)"
        :rootPath="`/p/${route.params['external_path']}`"
      />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import PublicBook, { BookInterface } from 'components/PublicBook.vue';

const darkMode = ref(true);
const $q = useQuasar();
const route = useRoute();
const errorMessage = ref('');
const loading = ref(true);
const data = ref([] as Record<string, number | string>[]);

watch(darkMode, (newDarkMode: boolean) => {
  $q.dark.set(newDarkMode);
  localStorage.darkMode = Boolean(newDarkMode);
});

onMounted(async () => {
  if (localStorage.darkMode) {
    darkMode.value = Boolean(localStorage.darkMode);
  }
  $q.dark.set(darkMode.value);

  const p = route.params['external_path'] as string;
  try {
    // For local development, set CORS header in main.py, use plain `fetch`,
    // and add Flask server path (http://localhost:8080)
    const response = await fetch(
      `https://y-books-public.storage.googleapis.com/${p}.json`
    );
    if (response.status !== 200) {
      throw p + ': ' + response.status.toString() + ' ' + response.statusText;
    }
    data.value = (await response.json()) as Record<string, string>[];
  } catch (err) {
    console.error(err);
    errorMessage.value = `Failed to fetch for ${p}`;
  } finally {
    loading.value = false;
  }
});

const sortedBooks = computed(() => {
  return data.value
    .slice()
    .sort((a, b) => (a.date_read > b.date_read ? -1 : 1));
});
</script>
