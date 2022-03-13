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

        <q-btn v-if="!signedIn" @click="handleAuthClick" class="bg-accent">
          Authorize
        </q-btn>
        <q-btn v-if="signedIn" @click="handleSignoutClick" class="bg-secondary">
          Sign Out
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Maybe add some links or something. </q-item-label>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view :error="gapiError" :sheet-id="sheetId" />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { API_KEY, CLIENT_ID } from 'src/keys';

const leftDrawerOpen = ref(false);
const signedIn = ref(false);
const gapiError = ref('');
const sheetId = ref('');

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const SHEET_ID = '1U8Tyh6TuXj9JlFtD5JOHQNkn9f3_1YFq-65Nq0kSuyw';

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
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
