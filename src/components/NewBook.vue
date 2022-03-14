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

          <q-btn
            :disable="!book.googleBooksId"
            target="_blank"
            :href="googleBooksLink(book.googleBooksId!)"
            color="primary"
          >
            Google Books
          </q-btn>
        </q-card-section>
      </q-card-section>
      <q-separator inset />
      <q-card-actions align="center">
        <q-btn
          label="Search"
          :disable="!book.authors && !book.title"
          color="primary"
          @click="search"
          class="q-mx-xs"
        />
        <q-btn label="Save" color="primary" class="q-mx-xs" />
      </q-card-actions>
    </q-card>
    <g-book-selector
      v-model="gBookSelectorActive"
      :books="gBookResults"
      @select-book="selectBook"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Book, ColumnName } from './models';
import { iconName, iconTooltip } from './icons';
import { fetchGoogleBooksJson, googleBooksLink } from './googleBooks';
import { useQuasar } from 'quasar';
import GBookSelector from './GBookSelector.vue';

defineProps<{
  modelValue: boolean;
}>();

const $q = useQuasar();

const emit = defineEmits(['update:modelValue']);

let gBookSelectorActive = ref(false);
let gBookResults = ref<Book[]>([]);

const book: Book = reactive(
  new Book(-1, []).update(ColumnName.WANT_TO_READ, 'TRUE')
);

function selectBook(newBook: Book) {
  book.title = newBook.title || book.title;
  book.authors = newBook.authors || book.authors;
  book.genres = newBook.genres || book.genres;
  book.year = newBook.year || book.year;
  book.googleBooksId = newBook.googleBooksId;
  book.imageUrl = newBook.imageUrl || book.imageUrl;
  gBookSelectorActive.value = false;
}

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
    .then((result) => {
      if (!result || result.length == 0) {
        $q.notify({
          message: 'No books found',
          position: 'center',
          closeBtn: true,
        });
        return;
      }
      gBookResults.value = result;
      gBookSelectorActive.value = true;
    })
    .catch((error) => console.log(error));
}
</script>
