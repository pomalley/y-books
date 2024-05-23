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

        <a
          href="https://github.com/pomalley/y-books#readme"
          target="_blank"
          style="text-decoration: inherit; color: inherit"
        >
          <q-icon name="help" size="sm" class="q-mx-sm">
            <q-tooltip>What is this?</q-tooltip>
          </q-icon>
        </a>
        <q-input
          standout
          dark
          dense
          v-model="searchText"
          @keyup.enter="searchExternal"
          @keyup.escape="searchText = ''"
          placeholder="Search"
        >
          <template v-slot:before>
            <q-icon name="search" v-if="!searchText" />
            <q-btn dense v-if="searchText" color="info" @click="searchExternal">
              <q-icon name="search" />
            </q-btn>
          </template>
          <template v-slot:append>
            <q-btn dense v-if="searchText" @click="searchText = ''">
              <q-icon name="clear" />
            </q-btn>
          </template>
        </q-input>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item><q-toggle v-model="darkMode" label="Dark Mode" /></q-item>
        <q-separator inset />
        <q-item-label header> Filter </q-item-label>
        <q-item v-for="f in Filter" :key="f" class="q-pa-xs">
          <q-btn
            color="info"
            :outline="filter !== f"
            @click="filter = f"
            class="full-width"
          >
            {{ f }}
          </q-btn>
        </q-item>
        <q-item><q-toggle v-model="showHidden" label="Show Hidden" /></q-item>
        <q-separator inset />
        <q-item-label header>Sort</q-item-label>
        <q-item>
          <q-btn :label="sort.by" color="positive" class="full-width">
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
        <q-separator inset />
        <q-item>
          <q-btn
            label="New Book"
            color="accent"
            @click="newBookActive = true"
            class="full-width"
            :loading="!initialLoadDone"
          />
        </q-item>
        <q-item>
          <q-btn
            v-if="!signedIn"
            @click="handleAuthClick"
            color="warning"
            class="full-width"
            :loading="!initialLoadDone"
          >
            Sign In / Authorize
          </q-btn>
          <q-btn
            v-if="signedIn"
            @click="handleSignoutClick"
            color="secondary"
            class="full-width"
            :loading="!initialLoadDone"
          >
            Sign Out
          </q-btn>
        </q-item>
        <q-separator inset />
        <q-item>
          <q-btn
            class="full-width"
            color="primary"
            target="_blank"
            :href="`https://docs.google.com/spreadsheets/d/${sheetId}`"
            :loading="!initialLoadDone"
            :disable="!(signedIn && sheetId)"
          >
            Open Spreadsheet
          </q-btn>
        </q-item>
        <q-item>
          <q-btn
            class="full-width"
            color="primary"
            @click="changeSpreadsheet"
            :loading="!initialLoadDone"
          >
            {{ sheetId.length > 0 ? 'Change' : 'Choose' }} Spreadsheet
          </q-btn>
        </q-item>
        <q-item>
          <div id="googleSignIn"></div>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view
        :sheet-id="sheetId"
        :sheet-data="sheetData"
        :sort="sort"
        :filter="filter"
        :searchText="searchText"
        :showHidden="showHidden"
        :initialLoadDone="initialLoadDone"
      />
    </q-page-container>

    <new-book
      v-model="newBookActive"
      @new-book="saveNewBook"
      :saving="savingNewBook"
      :starting-book="startingBook"
    />

    <g-book-selector
      v-model="gBookSelectorActive"
      :books="gBookResults"
      @select-book="selectBook"
    />
  </q-layout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue';
import { Book, Filter, Sort, SortBy } from 'src/components/models';
import NewBook from 'components/NewBook.vue';
import GBookSelector from 'src/components/GBookSelector.vue';
import { fetchGoogleBooksJson } from 'src/components/googleBooks';
import { useQuasar } from 'quasar';
import {
  gsiLoaded,
  gapiLoaded,
  callWithAuth,
  showPicker,
  TOKEN,
  logout,
  login,
  getSheetId,
  setSheetId,
} from 'src/components/googleAuth';

const leftDrawerOpen = ref(false);
const initialLoadDone = ref(false);
const signedIn = ref(false);
const sheetId = ref('');
const sheetData = ref<string[][]>([]);
const sort: Sort = reactive({ by: SortBy.CREATED, desc: true });
const filter = ref(Filter.NONE);
const newBookActive = ref(false);
const savingNewBook = ref(false);
const searchText = ref('');
const gBookResults = ref<Book[]>([]);
const gBookSelectorActive = ref(false);
const startingBook = ref<Book>();
const showHidden = ref(false);
const darkMode = ref(false);
const $q = useQuasar();

const SUBSHEET = 'Books';

watch(darkMode, (newDarkMode: boolean) => {
  $q.dark.set(newDarkMode);
  localStorage.darkMode = Boolean(newDarkMode);
});

watch(TOKEN, (n) => {
  signedIn.value = n;
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function saveNewBook(book: Book) {
  savingNewBook.value = true;
  const values: string[][] = [book.ToSpreadsheetRow(true, true)];
  try {
    await callWithAuth(async () =>
      gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId.value,
        range: SUBSHEET,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values,
        },
      })
    );
    await refreshSheet(sheetId.value);
  } catch (e) {
    console.error('Failed to save book:', e);
  } finally {
    savingNewBook.value = false;
    newBookActive.value = false;
  }
}

async function searchExternal() {
  const results = await fetchGoogleBooksJson('', '', searchText.value);
  gBookResults.value = results;
  gBookSelectorActive.value = true;
}

function selectBook(book: Book) {
  gBookSelectorActive.value = false;
  startingBook.value = book;
  newBookActive.value = true;
  searchText.value = '';
}

onMounted(() => {
  if (localStorage.darkMode) {
    darkMode.value = Boolean(localStorage.darkMode);
  }
  var gapiscript = document.createElement('script');
  gapiscript.setAttribute('src', 'https://apis.google.com/js/api.js');
  gapiscript.onload = () => gapiLoaded();
  gapiscript.async = false;
  document.head.appendChild(gapiscript);
  var gisScript = document.createElement('script');
  gisScript.setAttribute('src', 'https://accounts.google.com/gsi/client');
  gisScript.onload = () => gsiLoaded();
  gisScript.async = false;
  document.head.appendChild(gisScript);

  getSheetId()
    .then((value: string | undefined) => {
      if (value) {
        sheetId.value = value;
      }
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      initialLoadDone.value = true;
    });
});

watch(sheetId, async (newSheetId: string) => {
  await refreshSheet(newSheetId);
});

async function refreshSheet(sheetId: string) {
  await callWithAuth(async () => {
    let sheetsResponse = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Books!A2:P',
    });
    let range = sheetsResponse.result;
    if (range.values !== undefined) {
      sheetData.value = range.values as string[][];
    } else {
      console.error('no sheet data found');
      sheetData.value = [];
    }
  });
}

async function changeSpreadsheet() {
  const data = await showPicker();
  if (data.action == google.picker.Action.PICKED) {
    var fileId: string = data.docs[0].id;
    sheetId.value = fileId;
    void setSheetId(fileId);
  }
}

async function handleAuthClick() {
  await login();
}

async function handleSignoutClick() {
  await logout();
  sheetData.value = [];
}
</script>
