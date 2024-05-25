<template>
  <q-card>
    <q-card-section horizontal>
      <q-card-section vertical class="col-2">
        <q-card-section>
          <q-img :src="book.image_url" fit="contain" />
        </q-card-section>
        <q-card-section>
          <q-item>{{ book.title }}</q-item>
          <q-item>{{ book.authors }}</q-item>
          <q-item>{{ book.year }}</q-item>
          <q-item v-if="book.date_read">Read: {{ book.date_read }}</q-item>
        </q-card-section>
        <q-card-actions>
          <q-btn
            color="primary"
            :href="googleBooksLink(book.google_books_id)"
            target="_blank"
          >
            Google Books
          </q-btn>
        </q-card-actions>
      </q-card-section>
      <q-card-section vertical>
        <q-card-section
          class="text-justify comment"
          v-html="md.render(book.comments)"
        >
        </q-card-section>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.comment {
  max-width: 65em;
  font-size: 16px;
  font-family: 'Open Sans', sans-serif;
  font-optical-sizing: auto;
  font-weight: 500;
  font-style: normal;
  font-variation-settings: 'wdth' 100;
}
</style>

<script setup lang="ts">
import markdownit from 'markdown-it';
import { googleBooksLink } from './googleBooks';

const md = markdownit();

export type BookInterface = {
  title: string;
  authors: string;
  year: string;
  image_url: string;
  google_books_id: string;
  comments: string;
  date_read: string;
};

defineProps<{
  book: BookInterface;
}>();
</script>
