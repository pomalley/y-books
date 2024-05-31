from typing import Iterable
import json
import pathlib
import shutil

from server.sheets import BookEntry


def clear_all_public_books(path_root: str):
  shutil.rmtree(path_root, ignore_errors=True)


def write_public_books(path_root: str, external_path: str,
                       books: Iterable[BookEntry]):
  root = pathlib.Path(path_root)
  root.mkdir(parents=True, exist_ok=True)
  file = root / (external_path + '.json')
  with file.open('w') as f:
    json.dump(list(b.to_dict() for b in books), f)
