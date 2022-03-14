<template>
  <q-dialog
    ref="dialogRef"
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section horizontal>
        <q-img :src="book.imageUrl" fit="scale-down" class="col-4" />
        <q-card-section class="col-8">
          <q-card-section
            v-for="col in [
              ColumnName.TITLE,
              ColumnName.AUTHORS,
              ColumnName.GENRES,
              ColumnName.YEAR,
            ]"
            :key="col"
          >
            {{ fieldDisplayText(col) }}
            <q-popup-edit
              :model-value="fieldModelValue(col)"
              @update:model-value="(v) => fieldSetValue(col, v)"
              auto-save
              v-slot="scope"
            >
              <q-input
                v-model="scope.value"
                dense
                autofocus
                count
                @keyup.enter="scope.set"
              />
            </q-popup-edit>
          </q-card-section>
          <q-card-section>
            <q-icon
              v-for="colName in [
                ColumnName.READ,
                ColumnName.WANT_TO_READ,
                ColumnName.OWNED,
                ColumnName.WANT_TO_OWN,
              ]"
              :key="colName"
              :name="iconName(colName, book)"
              size="md"
              @click="iconClick(colName)"
              class="q-px-sm cursor-pointer"
            >
              <q-tooltip class="text-body2">{{
                iconTooltip(colName, book)
              }}</q-tooltip>
            </q-icon>
          </q-card-section>
        </q-card-section>
      </q-card-section>
      <q-separator inset />
      <q-card-actions align="center">
        <q-btn label="Search" color="primary" @click="search" class="q-mx-xs" />
        <q-btn label="Save" color="primary" class="q-mx-xs" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { Book, ColumnName } from './models';
import { iconName, iconTooltip } from './icons';
import { fetchGoogleBooksJson } from './googleBooks';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const book: Book = reactive(
  new Book(-1, []).update(ColumnName.WANT_TO_READ, 'TRUE')
);

function fieldDisplayText(col: ColumnName): string {
  switch (col) {
    case ColumnName.TITLE:
      return book.title || '[no title]';
    case ColumnName.AUTHORS:
      return book.authors || '[no authors]';
    case ColumnName.GENRES:
      return book.genres || '[no genres]';
    case ColumnName.YEAR:
      return book.year ? String(book.year) : '[no year]';
  }
  return 'uh oh';
}

function fieldModelValue(col: ColumnName) {
  switch (col) {
    case ColumnName.TITLE:
      return book.title;
    case ColumnName.AUTHORS:
      return book.authors;
    case ColumnName.GENRES:
      return book.genres;
    case ColumnName.YEAR:
      return book.year ? String(book.year) : '';
  }
  return 'uh oh';
}

function fieldSetValue(col: ColumnName, val: string) {
  switch (col) {
    case ColumnName.TITLE:
      book.title = val;
      break;
    case ColumnName.AUTHORS:
      book.authors = val;
      break;
    case ColumnName.GENRES:
      book.genres = val;
      break;
    case ColumnName.YEAR:
      book.year = Number(val) || undefined;
      break;
  }
}

function iconClick(col: ColumnName) {
  switch (col) {
    case ColumnName.READ:
      book.read = !book.read;
      break;
    case ColumnName.WANT_TO_READ:
      book.wantToRead = !book.wantToRead;
      break;
    case ColumnName.OWNED:
      book.owned = !book.owned;
      break;
    case ColumnName.WANT_TO_OWN:
      book.wantToOwn = !book.wantToOwn;
      break;
  }
}

function search() {
  fetchGoogleBooksJson(book.title, book.authors)
    .then((result) => console.log(result))
    .catch((error) => console.log(error));
}
</script>
