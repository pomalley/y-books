<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> {{ route.params['external_path'] }} </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-spinner color="primary" class="q-ma-xl" size="xl" v-if="loading" />
      <public-book
        v-for="book in data"
        :key="book.google_books_id"
        :book="(book as BookInterface)"
      />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { fetchWithHeaders } from 'src/components/googleAuth';
import PublicBook, { BookInterface } from 'components/PublicBook.vue';

const darkMode = ref(true);
const $q = useQuasar();
const route = useRoute();
const errorMessage = ref('');
const loading = ref(true);
const data = ref([] as Record<string, string>[]);

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
    const response = await fetchWithHeaders(`/pub/${p}`);
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
</script>
