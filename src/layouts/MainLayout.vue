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
          >
            Open Spreadsheet
          </q-btn>
        </q-item>
        <q-item>
          <q-btn class="full-width" color="primary" @click="changeSpreadsheet">
            Change Spreadsheet
          </q-btn>
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
import { Book, Filter, Sort, SortBy } from 'components/models';
import NewBook from 'components/NewBook.vue';
import GBookSelector from 'src/components/GBookSelector.vue';
import { fetchGoogleBooksJson } from 'src/components/googleBooks';
import { useQuasar } from 'quasar';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  Firestore,
  updateDoc,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithCredential,
  getAuth,
} from 'firebase/auth';

const leftDrawerOpen = ref(false);
const signedIn = ref(false);
const gapiError = ref('');
const sheetId = ref('');
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
let oauthToken = '';
let userId = '';
let firebaseApp: FirebaseApp | null = null;
let apiKey = API_KEY;
let clientId = CLIENT_ID;

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
// add https://www.googleapis.com/auth/drive.readonly to show thumbnails in the picker?
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const SUBSHEET = 'Books';

const FIREBASE_DOC = 'info';

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
    console.log(e);
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
  document.head.appendChild(gapiscript);
});

function handleClientLoad() {
  gapi.load('client:auth2', () => void initClient());
  gapi.load('client:picker', () => (pickerLoaded = true));
}

async function initClient() {
  if (process.env.DEV) {
    const module = await import('src/dev_keys');
    apiKey = module.API_KEY;
    clientId = module.CLIENT_ID;
    console.log('Using dev keys.');
  }
  try {
    await gapi.client.init({
      apiKey: apiKey,
      clientId: clientId,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    });
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    await updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  } catch (error) {
    console.log(error);
    gapiError.value = 'Failed to init gapi';
  }
}

function createPicker() {
  if (pickerLoaded && oauthToken) {
    var view = new google.picker.DocsView(google.picker.ViewId.DOCS);
    var picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.MINE_ONLY)
      .addViewGroup(
        new google.picker.ViewGroup(google.picker.ViewId.SPREADSHEETS)
      )
      .setAppId(clientId)
      .setOAuthToken(oauthToken)
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
    console.log(data);
    sheetId.value = fileId;
    void saveSheetId();
  }
}

async function updateSigninStatus(isSignedIn: boolean) {
  signedIn.value = isSignedIn;
  if (isSignedIn) {
    const user = gapi.auth2.getAuthInstance().currentUser.get();
    const authResponse = user.getAuthResponse(true);
    oauthToken = authResponse.access_token;
    gapiError.value = '';
    await firebaseAuth(authResponse);
  } else {
    sheetId.value = '';
    oauthToken = '';
    gapiError.value = 'Not Signed In';
  }
}

function handleAuthClick() {
  void gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

async function firebaseAuth(authResponse: gapi.auth2.AuthResponse) {
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: 'y-books.firebaseapp.com',
    projectId: 'y-books',
    storageBucket: 'y-books.appspot.com',
    messagingSenderId: '738811460084',
    appId: '1:738811460084:web:abf15a64100480b9afa1a1',
  };

  firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp);

  const cred = GoogleAuthProvider.credential(
    authResponse.id_token,
    authResponse.access_token
  );
  const userCred = await signInWithCredential(getAuth(firebaseApp), cred);
  userId = userCred.user.uid;

  try {
    const collectionRef = collection(db, userId);
    const snapshot = await getDoc(doc(collectionRef, FIREBASE_DOC));
    if (!snapshot.exists() || !snapshot.data()['spreadsheetId']) {
      await writeNewDoc(db, userId, userCred.user.email || '');
    } else {
      sheetId.value = snapshot.data()['spreadsheetId'] as string;
    }
  } catch (e) {
    console.error("Couldn't get existing doc:", e);
    await writeNewDoc(db, userId, userCred.user.email || '');
  }
  if (!sheetId.value) {
    createPicker();
  }
}

async function writeNewDoc(db: Firestore, userId: string, email: string) {
  const collectionRef = collection(db, userId);
  await setDoc(doc(collectionRef, FIREBASE_DOC), {
    userId: userId,
    email: email,
    spreadsheetId: null,
  });
}

async function saveSheetId() {
  if (!firebaseApp || !userId) {
    console.error('Unable to save sheet id without firebase auth.');
    return;
  }
  await updateDoc(doc(getFirestore(firebaseApp), userId, FIREBASE_DOC), {
    spreadsheetId: sheetId.value,
  });
}
</script>
