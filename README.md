# y-books (y-books)

More books, but y.

## Install the dependencies

```bash
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
npm run lint
```

### Format the files

```bash
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).

### Secrets

Add two files (not in version control) called `src/keys.ts` and `src/dev_keys.ts` with:

```typescript
export const API_KEY = '<google cloud project api key>';
export const CLIENT_ID = '<google cloud project client id>';
```

The dev keys should allow HTTP origins of `localhost:3000` (for example) and the prod keys should allow the actual origins.
