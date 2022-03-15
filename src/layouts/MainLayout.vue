<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> y-books </q-toolbar-title>

        <q-btn
          label="New Book"
          class="bg-accent q-mx-sm"
          @click="newBookActive = true"
        />

        <q-btn
          v-if="!signedIn"
          @click="handleAuthClick"
          class="bg-warning q-mx-sm"
        >
          Authorize
        </q-btn>
        <q-btn
          v-if="signedIn"
          @click="handleSignoutClick"
          class="bg-secondary q-mx-sm"
        >
          Sign Out
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-input
          outlined
          v-model="searchText"
          placeholder="Search"
          class="q-ma-sm"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <!-- <template v-slot:append><kbd>/</kbd></template> -->
        </q-input>
        <q-item-label header> Filter </q-item-label>
        <q-item>
          <q-btn
            color="info"
            :outline="filter !== f"
            v-for="f in Filter"
            :key="f"
            @click="filter = f"
            class="q-mx-xs"
          >
            {{ f }}
          </q-btn>
        </q-item>
        <q-item-label header>Sort</q-item-label>
        <q-item>
          <q-btn :label="sort.by" color="positive">
            <q-menu auto-close>
              <q-list>
                <q-item
                  v-for="by in SortBy"
                  :key="by"
                  clickable
                  @click="sort.by = by"
                >
                  {{ by }}
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            class="q-mx-xs"
            color="positive"
            @click="sort.desc = !sort.desc"
            :label="sort.desc ? 'DESC' : 'ASC'"
          />
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view
        :error="gapiError"
        :sheet-id="sheetId"
        :sort="sort"
        :filter="filter"
        :searchText="searchText"
      />
    </q-page-container>

    <new-book
      v-model="newBookActive"
      @new-book="saveNewBook"
      :saving="savingNewBook"
    />
  </q-layout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, nextTick } from 'vue';
import { API_KEY, CLIENT_ID } from 'src/keys';
import { Book, Filter, Sort, SortBy } from 'components/models';
import NewBook from 'components/NewBook.vue';

const leftDrawerOpen = ref(false);
const signedIn = ref(false);
const gapiError = ref('');
const sheetId = ref('');
const sort: Sort = reactive({ by: SortBy.CREATED, desc: true });
const filter = ref(Filter.NONE);
const newBookActive = ref(false);
const savingNewBook = ref(false);
const searchText = ref('');

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const SHEET_ID = '1U8Tyh6TuXj9JlFtD5JOHQNkn9f3_1YFq-65Nq0kSuyw';
const SUBSHEET = 'Books';

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function saveNewBook(book: Book) {
  savingNewBook.value = true;
  const values: string[][] = [book.ToSpreadsheetRow(true, true)];
  try {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SUBSHEET,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    });
    sheetId.value = '';
    await nextTick(() => (sheetId.value = SHEET_ID));
  } catch (e) {
    console.log(e);
  } finally {
    savingNewBook.value = false;
    newBookActive.value = false;
  }
}

onMounted(() => {
  var gapiscript = document.createElement('script');
  gapiscript.setAttribute('src', 'https://apis.google.com/js/api.js');
  gapiscript.onload = () => handleClientLoad();
  document.head.appendChild(gapiscript);
});

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

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
        gapiError.value = 'Failed to init gapi';
      }
    );
}

function updateSigninStatus(isSignedIn: boolean) {
  signedIn.value = isSignedIn;
  if (isSignedIn) {
    sheetId.value = SHEET_ID;
  } else {
    sheetId.value = '';
  }
}

function handleAuthClick() {
  void gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}
</script>
