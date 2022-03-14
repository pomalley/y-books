// Functions for fetching data from Google Books.

export function fetchGoogleBooksJson(title: string, authors: string) {
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
  return fetchJson(
    'https://www.googleapis.com/books/v1/volumes?q=' + qString
  ).then((response) => {
    console.log(response);
    return convertGoogleBooksData(response as GoogleBooksResponse);
  });
}

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

interface GoogleBooksResponse {
  volumeInfo: VolumeInfo;
  id: string;
}

function convertGoogleBooksData(googleData: GoogleBooksResponse) {
  const maybeJoin = function (maybeArr: string[]) {
    return maybeArr ? maybeArr.join(';') : '';
  };
  return {
    title: googleData.volumeInfo.title,
    authors: maybeJoin(googleData.volumeInfo.authors),
    imageUrl: googleData.volumeInfo.imageLinks
      ? googleData.volumeInfo.imageLinks.thumbnail
      : '',
    googleBooksId: googleData.id,
    year: googleData.volumeInfo.publishedDate
      ? googleData.volumeInfo.publishedDate.split('-')[0]
      : '',
    genres: maybeJoin(googleData.volumeInfo.categories),
  };
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
