<template>
  <q-dialog
    ref="dialogRef"
    :model-value="modelValue"
    :maximized="$q.platform.is.mobile"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <q-card class="q-dialog-plugin" style="max-width: 90%; width: 600px">
      <q-card-section horizontal>
        <q-img :src="book.imageUrl" fit="scale-down" class="col-4" />
        <q-card-section class="col-8">
          <q-card-section
            v-for="col in [
              getCol('TITLE'),
              getCol('AUTHORS'),
              getCol('GENRES'),
              getCol('YEAR'),
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
                getCol('READ'),
                getCol('WANT_TO_READ'),
                getCol('OWNED'),
                getCol('WANT_TO_OWN'),
                getCol('STARRED'),
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
        <q-btn
          label="Save"
          color="primary"
          class="q-mx-xs"
          :disable="!book.authors && !book.title"
          @click="emit('newBook', book)"
        />
        <q-btn label="Cancel" color="primary" class="q-mx-xs" v-close-popup />
      </q-card-actions>

      <q-inner-loading :showing="saving">
        <q-spinner-puff size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
    <g-book-selector
      v-model="gBookSelectorActive"
      :books="gBookResults"
      @select-book="selectBook"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Book, getCol, getName } from './models';
import { iconName, iconTooltip } from './icons';
import { fetchGoogleBooksJson, googleBooksLink } from './googleBooks';
import { useQuasar } from 'quasar';
import GBookSelector from './GBookSelector.vue';

const props = defineProps<{
  modelValue: boolean;
  saving: boolean;
  startingBook?: Book;
}>();

const $q = useQuasar();

const emit = defineEmits(['update:modelValue', 'newBook']);

let gBookSelectorActive = ref(false);
let gBookResults = ref<Book[]>([]);

const book: Book = reactive(
  new Book(-1, []).update(getCol('WANT_TO_READ'), 'TRUE')
);

watch(
  () => props.startingBook,
  (newStartingBook: Book) => {
    if (newStartingBook) {
      book.mergeFrom(newStartingBook);
    }
  }
);

function selectBook(newBook: Book) {
  book.mergeFrom(newBook);
  gBookSelectorActive.value = false;
}

function fieldDisplayText(col: string): string {
  switch (getName(col)) {
    case 'TITLE':
      return book.title || '[no title]';
    case 'AUTHORS':
      return book.authors || '[no authors]';
    case 'GENRES':
      return book.genres || '[no genres]';
    case 'YEAR':
      return book.year ? String(book.year) : '[no year]';
  }
  return 'uh oh';
}

function fieldModelValue(col: string) {
  switch (getName(col)) {
    case 'TITLE':
      return book.title;
    case 'AUTHORS':
      return book.authors;
    case 'GENRES':
      return book.genres;
    case 'YEAR':
      return book.year ? String(book.year) : '';
  }
  return 'uh oh';
}

function fieldSetValue(col: string, val: string) {
  switch (getName(col)) {
    case 'TITLE':
      book.title = val;
      break;
    case 'AUTHORS':
      book.authors = val;
      break;
    case 'GENRES':
      book.genres = val;
      break;
    case 'YEAR':
      book.year = Number(val) || undefined;
      break;
  }
}

function iconClick(col: string) {
  switch (getName(col)) {
    case 'READ':
      book.read = !book.read;
      break;
    case 'WANT_TO_READ':
      book.wantToRead = !book.wantToRead;
      break;
    case 'OWNED':
      book.owned = !book.owned;
      break;
    case 'WANT_TO_OWN':
      book.wantToOwn = !book.wantToOwn;
      break;
    case 'STARRED':
      book.starred = !book.starred;
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
