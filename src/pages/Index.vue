<template>
  <q-page class="col items-center justify-evenly">
    <span v-if="props.error || state.error">
      {{ props.error }} {{ state.error }}
    </span>
    <q-list bordered separator class="rounded-borders">
      <q-item
        v-for="book in sortedBooks"
        :key="book.row"
        clickable
        v-ripple
        class="row justify-start"
        @click="itemClick(book.row || -1)"
      >
        <q-item-section class="col-1 col-md-auto">
          <div class="row">
            <q-icon :name="readIcon(book)" />
            <q-icon name="none" />
            <q-icon :name="ownIcon(book)" />
            <q-icon name="fas fa-ban" v-if="book.hidden" />
          </div>
        </q-item-section>
        <q-item-section class="col-md-4 col-6">
          {{ book.title }}
        </q-item-section>
        <q-item-section class="col-1 col-md-2">
          {{ book.authors }}
        </q-item-section>
      </q-item>
    </q-list>
    <book-card v-model="state.bookCardModel" :sheet-id="props.sheetId" />
  </q-page>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import BookCard from 'components/BookCard.vue';
import { Book, BookCardModel, Sort, SortBy, Filter } from 'components/models';

interface State {
  books: Book[];
  bookCardModel: BookCardModel;
  error?: string;
}
const state: State = reactive({
  books: [],
  bookCardModel: { active: false, book: new Book(-1, []) },
});

const props = defineProps<{
  sheetId: string;
  error: string;
  sort: Sort;
  filter: Filter;
  searchText: string;
  showHidden: boolean;
}>();

// First book in state.books (index 0) has row number ROW_OFFSET in the sheet.
const ROW_OFFSET = 2;

function itemClick(row: number) {
  state.bookCardModel.active = true;
  state.bookCardModel.book = state.books[row - ROW_OFFSET];
}

function readIcon(b: Book): string {
  if (b.wantToRead) {
    return 'fas fa-book-open';
  }
  if (b.read) {
    return 'fas fa-check';
  }
  return 'none';
}

function ownIcon(b: Book): string {
  if (b.wantToOwn) {
    return 'fas fa-coins';
  }
  if (b.owned) {
    return 'fas fa-book-medical';
  }
  return 'none';
}

function parseBooks(sheetData: string[][], firstRow: number) {
  let newBooks: Book[] = [];
  for (let row of sheetData) {
    newBooks.push(new Book(firstRow++, row));
  }
  return newBooks;
}

const sortedBooks = computed(() => {
  let filtered = state.books.filter((book) => {
    if (!props.showHidden && book.hidden) return false;
    switch (props.filter) {
      case Filter.WANT_TO_OWN:
        return book.wantToOwn;
      case Filter.WANT_TO_READ:
        return book.wantToRead;
      case Filter.NONE:
        return true;
    }
  });
  if (props.searchText) {
    filtered = filtered.filter((book) => {
      return book.matchesSearch(props.searchText);
    });
  }
  return filtered.sort((a, b) => {
    switch (props.sort.by) {
      case SortBy.UPDATED:
        return a.updatedTimestamp < b.updatedTimestamp != props.sort.desc
          ? -1
          : 1;
      case SortBy.TITLE:
        return a.title < b.title != props.sort.desc ? -1 : 1;
      case SortBy.AUTHOR:
        return a.authors < b.authors != props.sort.desc ? -1 : 1;
      case SortBy.CREATED:
        return a.createdTimestamp < b.createdTimestamp != props.sort.desc
          ? -1
          : 1;
    }
  });
});

watch(
  () => props.sheetId,
  (newSheetId: string) => {
    if (!newSheetId) {
      state.books = [];
      return;
    }
    gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: newSheetId,
        range: 'Books!A2:O',
      })
      .then(
        function (response) {
          var range = response.result;
          if (range.values !== undefined) {
            state.books = parseBooks(range.values as string[][], ROW_OFFSET);
            state.error = undefined;
          } else {
            state.error = 'no data found';
            state.books = [];
          }
        },
        function (response) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          state.error = String(response.result.error.message);
        }
      );
  }
);
</script>
