from typing import Iterable
import json

from google.cloud import storage
from server.sheets import BookEntry


def clear_all_public_books(path_root: str):
  pass


def write_public_books(bucket_name: str, external_path: str,
                       books: Iterable[BookEntry]):
  storage_client = storage.Client()
  bucket = storage_client.bucket(bucket_name)
  blob = bucket.blob(external_path + '.json')
  blob.upload_from_string(json.dumps(list(b.to_dict() for b in books)))
