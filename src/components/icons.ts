import { Book, ColumnName } from './models';

export function iconName(type: ColumnName, book: Book): string {
  switch (type) {
    case ColumnName.READ:
      return book.read ? 'fas fa-check' : 'la la-times';
    case ColumnName.WANT_TO_READ:
      return book.wantToRead ? 'fas fa-book-open' : 'la la-book-open';
    case ColumnName.OWNED:
      return book.owned ? 'fas fa-book-medical' : 'la la-book-medical';
    case ColumnName.WANT_TO_OWN:
      return book.wantToOwn ? 'fas fa-coins' : 'la la-coins';
    case ColumnName.STARRED:
      return book.starred ? 'fas fa-star' : 'far fa-star';
    default:
      return 'none';
  }
}

export function iconTooltip(type: ColumnName, book: Book): string {
  switch (type) {
    case ColumnName.READ:
      return book.read ? 'Read' : 'Not Read';
    case ColumnName.WANT_TO_READ:
      return book.wantToRead ? 'Want to Read' : 'Do Not Want to Read';
    case ColumnName.OWNED:
      return book.owned ? 'Owned' : 'Not Owned';
    case ColumnName.WANT_TO_OWN:
      return book.wantToOwn ? 'Want to Own' : 'Do Not Want To Own';
    case ColumnName.STARRED:
      return book.starred ? 'Starred' : 'Not Starred';
    default:
      return 'Uh Oh!';
  }
}
