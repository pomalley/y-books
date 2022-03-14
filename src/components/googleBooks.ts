// Functions for fetching data from Google Books.

import { Book, ColumnName } from './models';

export function googleBooksLink(id: string) {
  return `http://books.google.com/books?id=${id}&source=gbs_api`;
}

export async function fetchGoogleBooksJson(title: string, authors: string) {
  if (!title && !authors) {
    return Promise.reject(
      'Must specify title and/or author to query Google Books.'
    );
  }
  let qString = '';
  if (title) {
    qString += '+intitle:' + encodeURIComponent(title);
  }
  if (authors) {
    qString += '+inauthor:' + encodeURIComponent(authors);
  }
  const response = await fetchJson(
    'https://www.googleapis.com/books/v1/volumes?q=' + qString
  );
  const resp = response as GoogleBooksResponse;
  if (!resp.items) {
    return [];
  }
  return resp.items.map(convertGoogleBooksData);
}

function convertGoogleBooksData(googleData: GoogleBook) {
  const maybeJoin = function (maybeArr: string[]) {
    return maybeArr ? maybeArr.join(';') : '';
  };
  return new Book(-1, [])
    .update(ColumnName.TITLE, googleData.volumeInfo.title)
    .update(ColumnName.AUTHORS, maybeJoin(googleData.volumeInfo.authors))
    .update(ColumnName.GENRES, maybeJoin(googleData.volumeInfo.categories))
    .update(ColumnName.GOOGLE_BOOKS_ID, googleData.id)
    .update(
      ColumnName.IMAGE_URL,
      googleData.volumeInfo.imageLinks
        ? googleData.volumeInfo.imageLinks.thumbnail
        : ''
    )
    .update(
      ColumnName.YEAR,
      googleData.volumeInfo.publishedDate
        ? googleData.volumeInfo.publishedDate.split('-')[0]
        : ''
    );
}

function fetchJson(url: string, json?: object) {
  return new Promise((resolve, reject) => {
    const httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          // TODO: if this is a login page, redirect to it.
          resolve(JSON.parse(httpRequest.responseText));
        } else {
          reject(httpRequest.responseText);
        }
      }
    };
    if (json === undefined) {
      httpRequest.open('GET', url);
      httpRequest.send();
    } else {
      httpRequest.open('POST', url);
      httpRequest.setRequestHeader(
        'Content-Type',
        'application/json;charset=UTF-8'
      );
      httpRequest.send(JSON.stringify(json));
    }
  });
}

// Rough typing for the google books api response.
interface ImageLinks {
  thumbnail: string;
}

interface VolumeInfo {
  title: string;
  authors: string[];
  categories: string[];
  publishedDate: string;
  imageLinks?: ImageLinks;
}

interface GoogleBook {
  volumeInfo: VolumeInfo;
  id: string;
}

interface GoogleBooksResponse {
  items: GoogleBook[];
  totalItems: number;
  kind: string;
}
