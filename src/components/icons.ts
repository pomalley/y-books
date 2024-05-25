import { Book, COL_TO_NAME } from './models';

export function iconName(col: string, book: Book): string {
  switch (COL_TO_NAME.get(col)) {
    case 'READ':
      return book.read ? 'fas fa-check' : 'la la-times';
    case 'WANT_TO_READ':
      return book.wantToRead ? 'fas fa-book-open' : 'la la-book-open';
    case 'OWNED':
      return book.owned ? 'fas fa-book-medical' : 'la la-book-medical';
    case 'WANT_TO_OWN':
      return book.wantToOwn ? 'fas fa-coins' : 'la la-coins';
    case 'STARRED':
      return book.starred ? 'fas fa-star' : 'far fa-star';
    case 'PUBLIC':
      return book.public ? 'fas fa-pen-nib' : 'la fa-pen-nib';
    default:
      return 'none';
  }
}

export function iconTooltip(col: string, book: Book): string {
  switch (COL_TO_NAME.get(col)) {
    case 'READ':
      return book.read ? 'Read' : 'Not Read';
    case 'WANT_TO_READ':
      return book.wantToRead ? 'Want to Read' : 'Do Not Want to Read';
    case 'OWNED':
      return book.owned ? 'Owned' : 'Not Owned';
    case 'WANT_TO_OWN':
      return book.wantToOwn ? 'Want to Own' : 'Do Not Want To Own';
    case 'STARRED':
      return book.starred ? 'Starred' : 'Not Starred';
    case 'PUBLIC':
      return book.public ? 'Public' : 'Not Public;';
    default:
      return 'Uh Oh!';
  }
}
