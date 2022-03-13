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

  constructor(row: number, sheetData: string[]) {
    this.row = row;
    for (let i = 0; i < 15; i++) {
      this.update(String.fromCharCode(65 + i) as ColumnName, sheetData[i]);
    }
  }

  update(col: ColumnName, value: string): void {
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
    }
  }
}

function parseBoolean(v: string) {
  return Boolean(v) && v.toUpperCase().trim() != 'FALSE' && v != '0';
}

export interface BookCardModel {
  active: boolean;
  book?: Book;
}

export enum SortBy {
  AUTHOR = 'Author',
  TITLE = 'Title',
  CREATED = 'Creation Time',
  UPDATED = 'Last Updated',
}

export interface Sort {
  by: SortBy;
  desc: boolean;
}

export enum Filter {
  NONE = 'None',
  WANT_TO_READ = 'Want To Read',
  WANT_TO_OWN = 'Want To Own',
}
