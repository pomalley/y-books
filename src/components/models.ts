import sheet_spec from 'assets/sheet_spec.json';

export const COL_TO_NAME = new Map(
  Object.entries(sheet_spec.columns as Record<string, string>).map((value) => [
    value[1],
    value[0],
  ])
);

export const NAME_TO_COL = new Map(
  Object.entries(sheet_spec.columns as Record<string, string>).map((value) => [
    value[0],
    value[1],
  ])
);

export function getCol(name: string): string {
  const c = NAME_TO_COL.get(name);
  if (!c) throw `Invalid column name: ${name}`;
  return c;
}

export function getName(col: string): string {
  const n = COL_TO_NAME.get(col);
  if (!n) throw `Invalid column: ${col}`;
  return n;
}

export class Book {
  row?: number;
  title!: string;
  authors!: string;
  year?: number;
  genres?: string;
  wantToRead?: boolean;
  read?: boolean;
  wantToOwn?: boolean;
  owned?: boolean;
  imageUrl?: string;
  dateRead?: string;
  googleBooksId?: string;
  hidden?: boolean;
  comments?: string;
  createdTimestamp!: number;
  updatedTimestamp!: number;
  starred?: boolean;
  public?: boolean;

  constructor(row: number, sheetData: string[]) {
    this.row = row;
    sheet_spec.columns;

    Object.values(sheet_spec.columns as Record<string, string>).forEach(
      (col, i) => {
        this.update(col, sheetData[i]);
      }
    );
  }

  ToSpreadsheetRow(updateTimeNow = false, creationTimeNow = false): string[] {
    const now = String(Math.round(Date.now() / 1000));
    return [
      this.title,
      this.authors,
      this.year ? String(this.year) : '',
      this.genres || '',
      fromBoolean(this.wantToRead || false),
      fromBoolean(this.read || false),
      fromBoolean(this.wantToOwn || false),
      fromBoolean(this.owned || false),
      this.imageUrl || '',
      this.dateRead || '',
      this.googleBooksId || '',
      fromBoolean(this.hidden || false),
      this.comments || '',
      creationTimeNow ? now : String(this.createdTimestamp),
      updateTimeNow ? now : String(this.updatedTimestamp),
      fromBoolean(this.starred || false),
      fromBoolean(this.public || false),
    ];
  }

  matchesSearch(searchText: string): boolean {
    const lowerText = searchText.toLowerCase();
    return (
      this.title.toLowerCase().includes(lowerText) ||
      this.authors.toLowerCase().includes(lowerText) ||
      Boolean(
        this.year && String(this.year).toLowerCase().includes(lowerText)
      ) ||
      Boolean(this.genres && this.genres.toLowerCase().includes(lowerText)) ||
      Boolean(this.comments && this.comments.toLowerCase().includes(lowerText))
    );
  }

  mergeFrom(newBook: Book) {
    this.title = newBook.title || this.title;
    this.authors = newBook.authors || this.authors;
    this.genres = newBook.genres || this.genres;
    this.year = newBook.year || this.year;
    this.googleBooksId = newBook.googleBooksId || this.googleBooksId;
    this.imageUrl = newBook.imageUrl || this.imageUrl;
  }

  update(col: string, value: string): Book {
    switch (COL_TO_NAME.get(col)) {
      case 'TITLE':
        this.title = value;
        break;
      case 'AUTHORS':
        this.authors = value;
        break;
      case 'YEAR':
        this.year = isNaN(Number(value)) ? undefined : Number(value);
        break;
      case 'GENRES':
        this.genres = value;
        break;
      case 'WANT_TO_READ':
        this.wantToRead = parseBoolean(value);
        break;
      case 'READ':
        this.read = parseBoolean(value);
        break;
      case 'WANT_TO_OWN':
        this.wantToOwn = parseBoolean(value);
        break;
      case 'OWNED':
        this.owned = parseBoolean(value);
        break;
      case 'IMAGE_URL':
        this.imageUrl = value;
        break;
      case 'DATE_READ':
        this.dateRead = value;
        break;
      case 'GOOGLE_BOOKS_ID':
        this.googleBooksId = value;
        break;
      case 'HIDDEN':
        this.hidden = parseBoolean(value);
        break;
      case 'COMMENTS':
        this.comments = value;
        break;
      case 'CREATED_TIMESTAMP':
        this.createdTimestamp = Number(value);
        break;
      case 'UPDATED_TIMESTAMP':
        this.updatedTimestamp = Number(value);
        break;
      case 'STARRED':
        this.starred = parseBoolean(value);
        break;
      case 'PUBLIC':
        this.public = parseBoolean(value);
        break;
    }
    return this;
  }
}

function parseBoolean(v: string): boolean {
  return Boolean(v) && v.toUpperCase().trim() != 'FALSE' && v != '0';
}

function fromBoolean(b: boolean): string {
  return b ? 'TRUE' : 'FALSE';
}

export interface BookCardModel {
  active: boolean;
  book: Book;
}

export enum SortBy {
  AUTHOR = 'Author',
  TITLE = 'Title',
  CREATED = 'Creation Time',
  UPDATED = 'Last Updated',
  DATE_READ = 'Date Read',
  STARRED = 'Starred',
}

export interface Sort {
  by: SortBy;
  desc: boolean;
}

export enum Filter {
  NONE = 'None',
  STARRED = 'Starred',
  WANT_TO_READ = 'Want To Read',
  WANT_TO_OWN = 'Want To Own',
}
