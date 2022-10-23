# y-books

This is a simple web app for using a Google Sheet to track books you have read and want to read.

The live version is at https://y-books.appspot.com.

## How To Use

### Set up the spreadsheet

1. Copy the [template sheet](https://docs.google.com/spreadsheets/d/1-4QPvyEsRR2MW13ctPwPsARbF705kgAux2riIYolKpA/edit?usp=sharing) to your own drive.
2. In the app, click `Sign In / Authorize`; the app needs permission to change "Files opened with the app" (i.e. the backing spreadsheet).
3. If the "Select a File" dialog doesn't come up, click `Change Spreadsheet`.
4. Choose the copy of the template made in step 1.

### Add / edit books

Click the "New Book" button and set the title and author(s) by clicking on e.g. the `[no title]` text. Once there is a title or author, the "Search" button is enabled, and you can search Google Books to find the book and fill in the details. After saving, an entry can be edited in a similar manner.

`Hide` sets a "hidden" flag to hide the entry from the web app (unless `Show Hidden` is toggled). To fully delete the entry, you can remove the row from the underlying spreadsheet (accessible by the `Open Spreadsheet` button).

## Technical Details

This is a fairly simple web app based on the [Quasar](https://quasar.dev/) framework. It is hosted on Google cloud and should fit comfortably into "free-tier" resources (i.e. cost nothing to run). To host your own version, create a Google cloud project, and enable the Google Sheets and Picker api (maybe some others, I don't remember exactly).

### Secrets

Add two files (not in version control) called `src/keys.ts` and `src/dev_keys.ts` with:

```typescript
export const API_KEY = '<google cloud project api key>';
export const CLIENT_ID = '<google cloud project client id>';
```

In addition to the sheets and picker APIs, the dev keys should allow HTTP origins of `localhost:3000` (for example) and the prod keys should allow the actual origins.

### Firebase

Earlier versions of this app used firebase to store the sheet id (per user). This was silly, and it is now kept in the browser's local storage. (This means for every new device, you must select the sheet.)

### Deploy to Google Cloud

`gcloud app deploy` should do it, as `app.yaml` is configured to serve from the dist/spa directory.
