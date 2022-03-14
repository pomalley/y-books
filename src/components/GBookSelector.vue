<template>
  <q-dialog
    ref="dialogRef"
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
    full-width
  >
    <q-card class="q-dialog-plugin">
      <!-- <q-card-section align="center" class="text-h3">
        Google Books Results
      </q-card-section> -->
      <q-card-section class="row justify-center q-gutter-sm">
        <q-card
          v-for="book in books"
          :key="book.googleBooksId"
          bordered
          style="width: 220px"
        >
          <q-card-section @click="click(book)" class="cursor-pointer">
            <div class="text-subtitle1">{{ book.title }}</div>
            <div v-if="book.authors" class="text-subtitle2">
              {{ book.authors }}
            </div>
            <div v-if="book.year" class="text-overline">
              {{ book.year }}
            </div>
          </q-card-section>
          <q-card-section @click="click(book)" class="cursor-pointer">
            <q-img
              :src="book.imageUrl"
              :alt="`${book.title} by ${book.authors}`"
            />
          </q-card-section>
          <q-card-actions align="center">
            <q-btn
              :disable="!book.googleBooksId"
              target="_blank"
              :href="googleBooksLink(book.googleBooksId!)"
              color="primary"
            >
              Link
            </q-btn>
          </q-card-actions>
        </q-card>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn v-close-popup color="primary">Nevermind</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Book } from './models';
import { googleBooksLink } from './googleBooks';

defineProps<{
  modelValue: boolean;
  books: Book[];
}>();

const emit = defineEmits(['update:modelValue', 'selectBook']);

function click(book: Book) {
  emit('selectBook', book);
}
</script>
