from typing import Dict, List, Literal, Tuple

from google.cloud import firestore

from . import auth, sheets

db = firestore.Client()

PARAM_TYPE = Literal['sheet_id', 'external_path']
_USERS_COLLECTION = 'users'
_PUBLIC_COLLECTION = 'public_books'


def get_token(userid: str,
              type: Literal['auth', 'refresh'] = 'auth') -> str | None:
  doc = db.collection(_USERS_COLLECTION).document(userid).get()
  if not doc.exists:
    return None
  key = 'refresh_token' if type == 'refresh' else 'token'
  d = doc.to_dict()
  return d.get(key, None) if d else None


def store_tokens(userid: str, token: str, refresh_token: str):
  db.collection(_USERS_COLLECTION).document(userid).set(
      {
          'token': token,
          'refresh_token': refresh_token
      }, merge=True)


def _clear_tokens(userid: str):
  doc_ref = db.collection(_USERS_COLLECTION).document(userid)
  doc_ref.update({
      'token': firestore.DELETE_FIELD,
      'refresh_token': firestore.DELETE_FIELD
  })


def refresh_token(userid: str, refresh_token: str):
  if (refresh_token is None):
    _clear_tokens(userid)
    return None
  access_token = auth.get_refreshed_token(refresh_token)
  if not access_token:
    _clear_tokens(userid)
  else:
    store_tokens(userid, access_token, refresh_token)


def store_param(userid: str, param: PARAM_TYPE, value: str):
  db.collection(_USERS_COLLECTION).document(userid).set({param: value},
                                                        merge=True)


def get_param(userid: str, param: PARAM_TYPE) -> str | None:
  doc = db.collection(_USERS_COLLECTION).document(userid).get()
  if not doc.exists:
    return None
  d = doc.to_dict()
  return d.get(param, None) if d else None


def get_all_sheets() -> List[Tuple[str, str, str]]:
  '''Returns (userid, sheet_id, external_path) for all users.'''
  d = []
  for doc in db.collection(_USERS_COLLECTION).where(
      # This should filter to all non-empty strings.
      filter=firestore.FieldFilter("sheet_id", ">=", "\0")).stream():
    id = doc.id
    doc = doc.to_dict()
    if not doc:
      continue
    d.append((id, doc.get('sheet_id', None), doc.get('external_path', None)))
  return d


def get_public_books(external_path: str) -> List[Dict[str, str]]:
  r = []
  for doc in db.collection(_USERS_COLLECTION).where(
      filter=firestore.FieldFilter('external_path', '==',
                                   external_path)).stream():
    for book_ref in doc.reference.collection(
        _PUBLIC_COLLECTION).list_documents():
      data = book_ref.get().to_dict()
      if data:
        r.append(data)
  return r
