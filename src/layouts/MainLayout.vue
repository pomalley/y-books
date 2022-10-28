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
          />
        </q-item>
        <q-item>
          <q-btn
            v-if="!signedIn"
            @click="handleAuthClick"
            color="warning"
            class="full-width"
          >
            Sign In / Authorize
          </q-btn>
          <q-btn
            v-if="signedIn"
            @click="handleSignoutClick"
            color="secondary"
            class="full-width"
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
            :enabled="signedIn && sheetId"
          >
            Open Spreadsheet
          </q-btn>
        </q-item>
        <q-item>
          <q-btn class="full-width" color="primary" @click="changeSpreadsheet">
            Change Spreadsheet
          </q-btn>
        </q-item>
        <q-item>
          <div id="googleSignIn"></div>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <div v-if="gapiError">{{ gapiError }}</div>
      <router-view
        :sheet-id="sheetId"
        :sheet-data="sheetData"
        :sort="sort"
        :filter="filter"
        :searchText="searchText"
        :showHidden="showHidden"
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
import { reactive, ref, onMounted, nextTick, watch } from 'vue';
import { API_KEY, CLIENT_ID } from 'src/keys';
import { Book, Filter, Sort, SortBy } from 'src/components/models';
import NewBook from 'components/NewBook.vue';
import GBookSelector from 'src/components/GBookSelector.vue';
import { fetchGoogleBooksJson } from 'src/components/googleBooks';
import { useQuasar } from 'quasar';

const leftDrawerOpen = ref(false);
const signedIn = ref(false);
const gapiError = ref('Not Signed In');
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

let pickerLoaded = false;
let apiKey = API_KEY;
let clientId = CLIENT_ID;
let gisClient: google.accounts.oauth2.TokenClient | null = null;

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// Add https://www.googleapis.com/auth/drive.readonly to be able to show
// thumbnails in the picker, at the cost of a much more expansive
// set of permissions.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const SUBSHEET = 'Books';

watch(darkMode, (newDarkMode: boolean) => {
  $q.dark.set(newDarkMode);
  localStorage.darkMode = Boolean(newDarkMode);
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function saveNewBook(book: Book) {
  savingNewBook.value = true;
  const values: string[][] = [book.ToSpreadsheetRow(true, true)];
  try {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: sheetId.value,
      range: SUBSHEET,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    });
    const temp = sheetId.value;
    sheetId.value = '';
    await nextTick(() => (sheetId.value = temp));
  } catch (e) {
    console.error('Failed to save book:', e);
  } finally {
    savingNewBook.value = false;
    newBookActive.value = false;
  }
}

function changeSpreadsheet() {
  createPicker();
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
  gapiscript.onload = () => handleClientLoad();
  gapiscript.async = false;
  document.head.appendChild(gapiscript);
  var gisScript = document.createElement('script');
  gisScript.setAttribute('src', 'https://accounts.google.com/gsi/client');
  gisScript.onload = () => initClient();
  gisScript.async = false;
  document.head.appendChild(gisScript);
});

let gapiLoadOk: (v?: unknown) => void, gapiLoadFail: (reason?: unknown) => void;
const gapiLoadPromise = new Promise((resolve, reject) => {
  gapiLoadOk = resolve;
  gapiLoadFail = reject;
});

watch(sheetId, async (newSheetId: string) => {
  await gapiLoadPromise;
  gapi.client.sheets.spreadsheets.values
    .get({
      spreadsheetId: newSheetId,
      range: 'Books!A2:O',
    })
    .then(function (response) {
      var range = response.result;
      if (range.values !== undefined) {
        sheetData.value = range.values as string[][];
      } else {
        console.error('no sheet data found');
        sheetData.value = [];
      }
    })
    .catch((err) => {
      updateSigninStatus(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err.result.error.code == 401 || err.result.error.code == 403) {
        gisClient?.requestAccessToken();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        // state.error = String(response.result.error.message);
        console.error(err);
        sheetId.value = '';
      }
    });
});

async function handleClientLoad() {
  try {
    await new Promise((resolve, reject) =>
      gapi.load('client:picker', { callback: resolve, onerror: reject })
    );
    pickerLoaded = true;
    await gapi.client.init({ discoveryDocs: DISCOVERY_DOCS });
    gapiLoadOk();
  } catch (e) {
    gapiLoadFail();
  }
}

async function initClient() {
  if (process.env.DEV) {
    const module = await import('src/dev_keys');
    apiKey = module.API_KEY;
    clientId = module.CLIENT_ID;
    console.log('Using dev keys.');
  }
  await gapiLoadPromise;
  await new Promise<void>((resolve, reject) => {
    try {
      gisClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        prompt: 'consent',
        callback: (response) => {
          if (response.error) {
            console.error('Failed to get OAuth token:', response);
            localStorage.oauthToken = undefined;
            updateSigninStatus(false);
          } else {
            localStorage.oauthToken = response.access_token;
            updateSigninStatus(true);
          }
        },
      });
      resolve();
    } catch (error) {
      console.error('Failure initializing token client:', error);
      gapiError.value = 'Failed to init gapi';
      reject(error);
    }
  });
  if (localStorage.oauthToken) {
    gapi.client.setToken({ access_token: String(localStorage.oauthToken) });
    updateSigninStatus(true);
  } else {
    updateSigninStatus(false);
  }
}

function createPicker() {
  if (pickerLoaded && localStorage.oauthToken) {
    var view = new google.picker.DocsView(google.picker.ViewId.DOCS);
    var picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.MINE_ONLY)
      .addViewGroup(
        new google.picker.ViewGroup(google.picker.ViewId.SPREADSHEETS)
      )
      .setAppId(clientId)
      .setOAuthToken(String(localStorage.oauthToken))
      .addView(view)
      .addView(new google.picker.DocsUploadView())
      .setDeveloperKey(apiKey)
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
  }
}

function pickerCallback(data: google.picker.ResponseObject) {
  if (data.action == google.picker.Action.PICKED) {
    var fileId: string = data.docs[0].id;
    sheetId.value = fileId;
    localStorage.sheetId = fileId;
  }
}

function updateSigninStatus(isSignedIn: boolean) {
  signedIn.value = isSignedIn;
  if (isSignedIn) {
    if (localStorage.sheetId) {
      sheetId.value = String(localStorage.sheetId);
      gapiError.value = '';
    } else {
      gapiError.value = 'No Sheet Selected';
    }
  } else {
    sheetId.value = '';
    gapiError.value = 'Not Signed In';
  }
}

function handleAuthClick() {
  gisClient?.requestAccessToken();
}

function handleSignoutClick() {
  google.accounts.oauth2.revoke(String(localStorage.oauthToken), () => {
    updateSigninStatus(false);
    localStorage.oauthToken = undefined;
  });
}
</script>
