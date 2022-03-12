<template>
  <q-page class="col items-center justify-evenly">
    This is the msg: "{{ msg }}".
    <button v-if="!state.signedIn" @click="handleAuthClick">Authorize</button>
    <button v-if="state.signedIn" @click="handleSignoutClick">Sign Out</button>

    <span v-if="state.error">{{ state.error }}</span>
    <q-list bordered separator class="rounded-borders">
      <q-item
        v-for="book in state.books"
        :key="book.row"
        clickable
        v-ripple
        class="row justify-start"
        @click="itemClick(book.row || -1)"
      >
        <q-item-section class="col-4">
          {{ book.title }}
        </q-item-section>
        <q-item-section class="col-2">
          {{ book.authors }}
        </q-item-section>

        <q-item-section class="col-1">
          <div class="row">
            <q-icon :name="readIcon(book)" />
            <q-icon name="none" />
            <q-icon :name="ownIcon(book)" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <book-card v-model="state.bookCardModel" :sheet-id="SHEET_ID" />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import BookCard from 'components/BookCard.vue';
import { Book, BookCardModel } from 'components/models';
import { API_KEY, CLIENT_ID } from '../keys';

defineProps<{
  msg: string;
}>();

interface State {
  signedIn: boolean;
  error?: string;
  books: Book[];
  bookCardModel: BookCardModel;
}
const state: State = reactive({
  signedIn: false,
  books: [],
  bookCardModel: { active: false },
});

onMounted(() => {
  var gapiscript = document.createElement('script');
  gapiscript.setAttribute('src', 'https://apis.google.com/js/api.js');
  gapiscript.onload = () => handleClientLoad();
  document.head.appendChild(gapiscript);
});

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// First book in state.books (index 0) has row number ROW_OFFSET in the sheet.
const ROW_OFFSET = 2;

const SHEET_ID = '1U8Tyh6TuXj9JlFtD5JOHQNkn9f3_1YFq-65Nq0kSuyw';

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

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(
      function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      },
      function (error) {
        console.log(error);
        state.error = 'Failed to init gapi';
      }
    );
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn: boolean) {
  state.signedIn = isSignedIn;
  if (isSignedIn) {
    listMajors();
  } else {
    state.books = [];
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  void gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

function listMajors() {
  gapi.client.sheets.spreadsheets.values
    .get({
      spreadsheetId: SHEET_ID,
      range: 'Books!A2:O',
    })
    .then(
      function (response) {
        var range = response.result;
        if (range.values && range.values.length > 0) {
          state.books = parseBooks(range.values as string[][], ROW_OFFSET);
          state.error = undefined;
        } else {
          state.error = 'no data found';
        }
      },
      function (response) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        state.error = String(response.result.error.message);
      }
    );
}
</script>
