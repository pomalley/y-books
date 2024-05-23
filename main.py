from typing import Literal

from flask import Flask, request, abort, send_file, send_from_directory, session
import google_auth_oauthlib
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from google.cloud import firestore
import json
import requests

db = firestore.Client()

app = Flask(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile', 'openid'
]

with open('flask_secret.txt') as f:
  app.secret_key = f.read()

with open('client_secret.json') as f:
  CLIENT_SECRET = json.load(f)['web']


def _get_token(userid: str,
               type: Literal['auth', 'refresh'] = 'auth') -> str | None:
  doc = db.collection("users").document(userid).get()
  if not doc.exists:
    return None
  key = 'refresh_token' if type == 'refresh' else 'token'
  d = doc.to_dict()
  return d.get(key, None) if d else None


def _store_tokens(userid: str, token: str, refresh_token: str):
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


def _refresh_token(userid: str, refresh_token: str):
  if (refresh_token is None):
    _clear_tokens(userid)
    return None
  r = requests.post(CLIENT_SECRET['token_uri'],
                    data={
                        'client_id': CLIENT_SECRET['client_id'],
                        'client_secret': CLIENT_SECRET['client_secret'],
                        'grant_type': 'refresh_token',
                        'refresh_token': refresh_token
                    })
  if (r.status_code != 200):
    _clear_tokens(userid)
    return None
  response = r.json()
  _store_tokens(userid, response['access_token'], refresh_token)


def _get_sheet_id(userid: str) -> str | None:
  doc = db.collection("users").document(userid).get()
  if not doc.exists:
    return None
  d = doc.to_dict()
  return d.get('sheet_id', None) if d else None


def _store_sheet_id(userid: str, sheet_id: str):
  doc = db.collection("users").document(userid).set({'sheet_id': sheet_id},
                                                    merge=True)


@app.route("/token")
def token():
  '''Get the auth token (and sheet id), if present.'''
  if 'userid' not in session:
    abort(401)
  if request.args.get('refresh', ''):
    refresh_token = _get_token(session['userid'], type='refresh')
    if not refresh_token:
      abort(403)
    _refresh_token(session['userid'], refresh_token=refresh_token)
  t = _get_token(session['userid'])
  if not t:
    abort(403)
  return {'token': t, 'sheet_id': _get_sheet_id(session['userid'])}


@app.route("/logout")
def logout():
  '''Log the user out.'''
  session.pop('userid')
  return {}


@app.route("/login", methods=['POST'])
def login():
  '''Verify JWT oauth2 credential, and return auth token if we have it.'''
  if not request.is_json:
    abort(400, 'JWT required as json.')
  try:
    token = request.json['credential']  # type: ignore
    idinfo = id_token.verify_oauth2_token(token, grequests.Request(),
                                          CLIENT_SECRET['client_id'])
    session['userid'] = idinfo['sub']
    t = _get_token(session['userid'])
    if t:
      return {'token': t, 'sheet_id': _get_sheet_id(session['userid'])}
    return {}
  except (ValueError, TypeError, AttributeError) as e:
    abort(401, 'Google sign-in failed.')


@app.route("/auth", methods=['POST'])
def auth():
  '''Get auth/refresh tokens after the user authorization flow.'''
  if request.headers.get('X-Requested-With') != 'XmlHttpRequest':
    abort(400, 'Invalid X-Requested-With')
  if 'userid' not in session:
    abort(401, 'Cannot authorize without authentication.')
  flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(  # type: ignore
      'client_secret.json',
      scopes=SCOPES,
  )
  flow.redirect_uri = 'postmessage'
  flow.fetch_token(code=request.form.get('code'))
  c = {
      'token': flow.credentials.token,
      'refresh_token': flow.credentials.refresh_token,
      'token_uri': flow.credentials.token_uri,
      'client_id': flow.credentials.client_id,
      'client_secret': flow.credentials.client_secret,
      'scopes': flow.credentials.scopes
  }
  _store_tokens(session['userid'], c['token'], c['refresh_token'])
  return c


@app.route("/set_sheet_id", methods=["POST"])
def set_sheet_id():
  '''Set the sheet id for this user (in the datastore).'''
  if request.headers.get('X-Requested-With') != 'XmlHttpRequest':
    abort(400, 'Invalid X-Requested-With')
  if 'userid' not in session:
    abort(401, 'Not signed in.')
  j = request.json
  if not j:
    abort(400, 'No data provided.')
  sheet_id = j.get('sheet_id', None)
  if not sheet_id:
    abort(400, 'No sheet provided.')
  _store_sheet_id(session['userid'], sheet_id=str(sheet_id))
  return {}


@app.route('/')
def root():
  '''Serve dist/spa/index.html as root. Only used in the dev environment.'''
  return send_file('dist/spa/index.html')


@app.route("/<path:name>")
def all(name):
  '''Serve dist/spa as static files. Only used in dev environment.'''
  return send_from_directory('dist/spa', name)


if __name__ == "__main__":
  app.run(host="127.0.0.1", port=8080, debug=True)
