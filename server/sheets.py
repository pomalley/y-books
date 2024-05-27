from dataclasses import dataclass
import json
from typing import Dict, List

from googleapiclient.discovery import build

from . import auth

with open('src/assets/sheet_spec.json') as f:
  SHEET_SPEC = json.load(f)


def _get_col(name: str) -> int:
  return ord(SHEET_SPEC['columns'][name]) - ord('A')


def _get(l: List[str], name: str) -> str:
  col = _get_col(name)
  if len(l) <= col:
    return ''
  return l[col]


@dataclass
class BookEntry:
  id: int
  title: str
  authors: str
  year: str
  image_url: str
  google_books_id: str
  comments: str
  date_read: str

  def __init__(self, id: int, row: List[str]):
    self.id = id
    self.title = _get(row, 'TITLE')
    self.authors = _get(row, 'AUTHORS')
    self.year = _get(row, 'YEAR')
    self.image_url = _get(row, 'IMAGE_URL')
    self.google_books_id = _get(row, 'GOOGLE_BOOKS_ID')
    self.comments = _get(row, 'COMMENTS')
    self.date_read = _get(row, 'DATE_READ')

  def __str__(self) -> str:
    return (
        f'{self.title}, by {self.authors} ({self.year}). '
        f'{("Read: " + self.date_read + ".") if self.date_read else "Not read."}'
    )

  def to_dict(self) -> Dict[str, int | str]:
    return {
        'id': self.id,
        'title': self.title,
        'authors': self.authors,
        'year': self.year,
        'image_url': self.image_url,
        'google_books_id': self.google_books_id,
        'comments': self.comments,
        'date_read': self.date_read
    }


def get_public_books(sheet_id: str, userid: str) -> List[BookEntry]:
  d = []
  creds = auth.get_credentials(userid)
  service = build("sheets", "v4", credentials=creds)
  sheet = service.spreadsheets()
  result = sheet.values().get(spreadsheetId=sheet_id,
                              range=SHEET_SPEC['range']).execute()
  for i, row in enumerate(result.get('values', [])):
    if _get(row, 'PUBLIC') == 'TRUE':
      d.append(BookEntry(i, row))
  return d
