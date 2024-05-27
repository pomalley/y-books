<template>
  <q-card :id="book.id">
    <q-card-section horizontal>
      <q-card-section vertical>
        <q-card-section>
          <q-img :src="book.image_url" />
        </q-card-section>
        <q-card-section class="info">
          <div>{{ book.authors }}</div>
          <div>
            <span class="title">{{ book.title }}</span> ({{ book.year }})
          </div>
          <div class="read" v-if="book.date_read">
            Read {{ readText(book.date_read) }}
          </div>
        </q-card-section>
        <q-card-actions>
          <q-btn
            color="primary"
            :href="googleBooksLink(book.google_books_id)"
            target="_blank"
            class="q-mx-xs"
          >
            Google Books
          </q-btn>
          <q-btn
            outline
            color="primary"
            :href="`${rootPath}#${book.id}`"
            class="q-mx-xs"
          >
            <q-icon size="xs" name="fas fa-link" />
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

.title {
  font-style: italic;
}

.info {
  font-family: 'Open Sans', sans-serif;
  font-size: 18px;
  font-weight: 600;
}

.read {
  font-weight: 300;
}
</style>

<script setup lang="ts">
import markdownit from 'markdown-it';
import { googleBooksLink } from './googleBooks';

const md = markdownit();

export type BookInterface = {
  id: number;
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
  rootPath: string;
}>();

const MONTHS = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Aor',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function readText(dateString: string): string {
  const s = dateString.split('-');
  if (s.length !== 2) return dateString;
  const i = parseInt(s[1]);
  if (!i) return dateString;
  return MONTHS[i] + ' ' + s[0];
}
</script>
