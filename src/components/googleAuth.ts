// Google authentication and authorization stuff.

import { CLIENT_ID, API_KEY } from 'src/keys';
import { ref } from 'vue';

const SCOPES =
  'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file openid';
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
];

let _API_KEY = API_KEY;
let _CLIENT_ID = CLIENT_ID;

let gsiReady: (client: google.accounts.oauth2.CodeClient) => void;
let gapiReady: () => void;
let loginReady: () => void;
let authReady: () => void;
export const TOKEN = ref(false);
const gsiPromise = new Promise(
  (resolve: (client: google.accounts.oauth2.CodeClient) => void) => {
    gsiReady = resolve;
  }
);
const gapiPromise = new Promise((resolve) => {
  gapiReady = resolve as () => void;
});

// Call on gsi script loaded to init Google auth.
export async function gsiLoaded() {
  if (process.env.DEV) {
    const module = await import('src/dev_keys');
    _API_KEY = module.API_KEY;
    _CLIENT_ID = module.CLIENT_ID;
    console.log('Using dev keys.');
  }
  // init google sign-in.
  google.accounts.id.initialize({
    client_id: _CLIENT_ID,
    callback: loginCallback,
  });
  // init google authorization.
  const gsiClient = google.accounts.oauth2.initCodeClient({
    client_id: _CLIENT_ID,
    scope: SCOPES,
    ux_mode: 'popup',
    callback: (response) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open('POST', '/auth', true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      // Set custom header for CRSF
      xhr.setRequestHeader('X-Requested-With', 'XmlHttpRequest');
      xhr.onload = function () {
        console.log('Auth code response:', xhr.response);
        const token = (xhr.response as { token: string }).token;
        gapi.client.setToken({ access_token: token });
        authReady();
      };
      xhr.send('code=' + (response as { code: string }).code);
    },
  });
  // gsi finished loading.
  gsiReady(gsiClient);
}

// Call on gApi script loaded to init gapi client.
export async function gapiLoaded() {
  await gsiPromise; // make sure we have the right API key (dev/prod).
  gapi.load('client', () => {
    gapi.client
      .init({
        apiKey: _API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
      })
      .then(() => {
        return new Promise((resolve, reject) =>
          gapi.load('client:picker', { callback: resolve, onerror: reject })
        );
      })
      .then(() => {
        gapiReady();
      })
      .catch((reason) => {
        console.log('Error initializing gapi library.');
        throw reason;
      });
    // gapi finished loading.
  });
}

// Call a function (e.g. a sheets API call), making sure we have an auth token,
// getting and/or refreshing the auth token as needed.
export async function callWithAuth<T>(
  call: () => Promise<T>,
  shouldRefreshToken = false
): Promise<T> {
  await gapiPromise;
  const gsiClient = await gsiPromise;
  if (!TOKEN.value) {
    let path = '/token';
    if (shouldRefreshToken) path += '?refresh=1';
    const tokenResponse = await fetchWithHeaders(path);
    if (tokenResponse.ok) {
      const jsonResponse = (await tokenResponse.json()) as { token: string };
      gapi.client.setToken({ access_token: jsonResponse.token });
      TOKEN.value = true;
    } else if (tokenResponse.status === 401) {
      // /token endpoint returned 401, indicating we're not logged in.
      await login();
      return callWithAuth(call);
    } else if (tokenResponse.status === 403) {
      // /token endpoint returned 403, indicated we're not authorized.
      const authPromise = new Promise((resolve) => {
        authReady = resolve as () => void;
      });
      gsiClient.requestCode();
      console.log('Awaiting auth.');
      await authPromise;
      return callWithAuth(call);
    }
  }
  try {
    return await call();
  } catch (error: unknown) {
    if (shouldRefreshToken) {
      console.error('Refreshing token failed.');
      TOKEN.value = false;
      throw error;
    }
    const e = error as { result?: { error?: { code?: number } } };
    if (e.result?.error?.code === 401 || e.result?.error?.code === 403) {
      console.log('Requesting token refresh.');
      TOKEN.value = false;
      return callWithAuth(call, true);
    }
    throw error;
  }
}

export async function showPicker(): Promise<google.picker.ResponseObject> {
  // Picker API doesn't have a convenient way to handle 403s when the token
  // expires, so force a refresh here. The picker should only be called
  // very infrequently, anyway.
  await forceTokenRefresh();
  return callWithAuth(() => {
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
    return new Promise(
      (resolve: (pickerResponse: google.picker.ResponseObject) => void) => {
        const picker = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.MINE_ONLY)
          .addViewGroup(
            new google.picker.ViewGroup(google.picker.ViewId.SPREADSHEETS)
          )
          .setAppId(_CLIENT_ID)
          .setOAuthToken(gapi.client.getToken().access_token)
          .addView(view)
          .addView(new google.picker.DocsUploadView())
          .setDeveloperKey(_API_KEY)
          .setCallback((x: google.picker.ResponseObject) => {
            if (
              x.action === google.picker.Action.PICKED ||
              x.action === google.picker.Action.CANCEL
            ) {
              resolve(x);
            }
          })
          .build();
        picker.setVisible(true);
      }
    );
  });
}

export async function login() {
  const loginPromise = new Promise((resolve) => {
    loginReady = resolve as () => void;
  });
  google.accounts.id.prompt();
  console.log('Awaiting login.');
  return loginPromise;
}

export async function logout() {
  return fetchWithHeaders('/logout').then(() => {
    TOKEN.value = false;
  });
}

export async function getParams() {
  return callWithAuth(async () => {
    const getResponse = await fetchWithHeaders('/token');
    if (getResponse.status !== 200) throw getResponse.statusText;
    return getResponse.json() as { sheet_id?: string; external_path?: string };
  });
}

export async function setSheetId(sheet_id: string) {
  return callWithAuth(async () => {
    return (
      await fetchWithHeaders('/set/sheet_id', { value: sheet_id })
    ).json();
  });
}

export async function setExternalPath(external_path: string) {
  return callWithAuth(async () => {
    return (
      await fetchWithHeaders('/set/external_path', { value: external_path })
    ).json();
  });
}

async function forceTokenRefresh() {
  TOKEN.value = false;
  return callWithAuth(async () => {
    return fetchWithHeaders('/token');
  }, true);
}

function loginCallback(googleSignInResponse: unknown) {
  fetchWithHeaders('/login', googleSignInResponse)
    .then((loginResponse) => loginResponse.json())
    .then((j: { token?: string }) => {
      if (j.token) {
        TOKEN.value = true;
        gapi.client.setToken({ access_token: j.token });
      }
      loginReady();
    })
    .catch((reason) => {
      console.log('Error with Google sign-in.');
      throw reason;
    });
}

export function fetchWithHeaders(path: string, body?: unknown) {
  // This is ugly, but whatever.
  const gets = /^\/(token|pub)/;
  return fetch(path, {
    method: gets.test(path) ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XmlHttpRequest',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
