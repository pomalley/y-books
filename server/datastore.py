from typing import Literal

from google.cloud import firestore

from . import auth

db = firestore.Client()

PARAM_TYPE = Literal['sheet_id', 'external_path']


def get_token(userid: str,
              type: Literal['auth', 'refresh'] = 'auth') -> str | None:
  doc = db.collection("users").document(userid).get()
  if not doc.exists:
    return None
  key = 'refresh_token' if type == 'refresh' else 'token'
  d = doc.to_dict()
  return d.get(key, None) if d else None


def store_tokens(userid: str, token: str, refresh_token: str):
  db.collection("users").document(userid).set(
      {
          'token': token,
          'refresh_token': refresh_token
      }, merge=True)


def _clear_tokens(userid: str):
  doc_ref = db.collection("users").document(userid)
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
  db.collection("users").document(userid).set({param: value}, merge=True)


def get_param(userid: str, param: PARAM_TYPE) -> str | None:
  doc = db.collection("users").document(userid).get()
  if not doc.exists:
    return None
  d = doc.to_dict()
  return d.get(param, None) if d else None
