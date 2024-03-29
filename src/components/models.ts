// Enum values are spreadsheet columns.
export enum ColumnName {
  TITLE = 'A',
  AUTHORS = 'B',
  YEAR = 'C',
  GENRES = 'D',
  WANT_TO_READ = 'E',
  READ = 'F',
  WANT_TO_OWN = 'G',
  OWNED = 'H',
  IMAGE_URL = 'I',
  DATE_READ = 'J',
  GOOGLE_BOOKS_ID = 'K',
  HIDDEN = 'L',
  COMMENTS = 'M',
  CREATED_TIMESTAMP = 'N',
  UPDATED_TIMESTAMP = 'O',
  STARRED = 'P',
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

  constructor(row: number, sheetData: string[]) {
    this.row = row;
    for (let i = 0; i < 16; i++) {
      this.update(String.fromCharCode(65 + i) as ColumnName, sheetData[i]);
    }
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

  update(col: ColumnName, value: string): Book {
    switch (col) {
      case ColumnName.TITLE:
        this.title = value;
        break;
      case ColumnName.AUTHORS:
        this.authors = value;
        break;
      case ColumnName.YEAR:
        this.year = isNaN(Number(value)) ? undefined : Number(value);
        break;
      case ColumnName.GENRES:
        this.genres = value;
        break;
      case ColumnName.WANT_TO_READ:
        this.wantToRead = parseBoolean(value);
        break;
      case ColumnName.READ:
        this.read = parseBoolean(value);
        break;
      case ColumnName.WANT_TO_OWN:
        this.wantToOwn = parseBoolean(value);
        break;
      case ColumnName.OWNED:
        this.owned = parseBoolean(value);
        break;
      case ColumnName.IMAGE_URL:
        this.imageUrl = value;
        break;
      case ColumnName.DATE_READ:
        this.dateRead = value;
        break;
      case ColumnName.GOOGLE_BOOKS_ID:
        this.googleBooksId = value;
        break;
      case ColumnName.HIDDEN:
        this.hidden = parseBoolean(value);
        break;
      case ColumnName.COMMENTS:
        this.comments = value;
        break;
      case ColumnName.CREATED_TIMESTAMP:
        this.createdTimestamp = Number(value);
        break;
      case ColumnName.UPDATED_TIMESTAMP:
        this.updatedTimestamp = Number(value);
        break;
      case ColumnName.STARRED:
        this.starred = parseBoolean(value);
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
