<template>
  <q-page class="col items-center justify-evenly">
    <q-list bordered separator class="rounded-borders">
      <q-item
        v-for="book in sortedBooks"
        :key="book.row"
        v-show="bookIsVisible(book)"
        clickable
        v-ripple
        class="row justify-start"
        @click="itemClick(book.row || -1)"
      >
        <q-item-section class="col-1 col-md-auto">
          <div class="row">
            <q-icon name="fas fa-star" v-if="book.starred" />
            <q-icon name="none" />
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
    <h4 class="q-mx-sm" v-if="initialLoadDone && !(sheetId.length > 0)">
      Please select a sheet to use.
    </h4>
    <q-spinner
      color="primary"
      class="q-ma-xl"
      size="xl"
      v-if="!initialLoadDone"
    />
  </q-page>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import BookCard from 'components/BookCard.vue';
import { Book, BookCardModel, Sort, SortBy, Filter } from 'components/models';

interface State {
  books: Book[];
  bookCardModel: BookCardModel;
}

const state: State = reactive({
  books: [],
  bookCardModel: { active: false, book: new Book(-1, []) },
});

const props = defineProps<{
  sheetData: string[][];
  sheetId: string;
  sort: Sort;
  filter: Filter;
  searchText: string;
  showHidden: boolean;
  initialLoadDone: boolean;
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

function bookIsVisible(book: Book) {
  return (
    // Not hidden, or we're showing hidden books
    (props.showHidden || !book.hidden) &&
    // and it's in the filter
    (props.filter === Filter.NONE ||
      (props.filter === Filter.WANT_TO_OWN && book.wantToOwn) ||
      (props.filter == Filter.WANT_TO_READ && book.wantToRead) ||
      (props.filter === Filter.STARRED && book.starred)) &&
    // And it matches the search
    book.matchesSearch(props.searchText)
  );
}

const sortedBooks = computed(() => {
  return state.books.slice().sort((a, b) => {
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
      case SortBy.DATE_READ:
        // Sort by date read, breaking ties by whether it is read.
        const a_date = a.dateRead || '';
        const b_date = b.dateRead || '';
        if (a_date === b_date)
          return (a.read || false) < (b.read || false) != props.sort.desc
            ? -1
            : 1;
        return a_date < b_date != props.sort.desc ? -1 : 1;
      case SortBy.STARRED:
        return !!a.starred == !!b.starred ? 0 : !!a.starred ? -1 : 1;
    }
  });
});

watch(
  () => props.sheetData,
  (newSheetData: string[][]) => {
    if (!newSheetData) {
      state.books = [];
      return;
    }
    state.books = parseBooks(newSheetData, ROW_OFFSET);
  }
);
</script>
