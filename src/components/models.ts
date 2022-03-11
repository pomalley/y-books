export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface Book {
  row: number;
  title: string;
  authors: string;
  year?: number;
  genres: string;
  wantToRead: boolean;
  read: boolean;
  wantToOwn: boolean;
  owned: boolean;
  imageUrl: string;
  dateRead: string;
  googleBooksId: string;
  hidden: boolean;
  comments: string;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface BookCardModel {
  active: boolean;
  book?: Book;
}
