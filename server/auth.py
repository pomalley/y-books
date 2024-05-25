from google.oauth2 import id_token
from google.oauth2.credentials import Credentials
from google.auth.transport import requests as grequests
import json
import requests

from . import datastore as ds

SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile', 'openid'
]

with open('client_secret.json') as f:
  CLIENT_SECRET = json.load(f)['web']


def get_refreshed_token(refresh_token: str) -> str | None:
  r = requests.post(CLIENT_SECRET['token_uri'],
                    data={
                        'client_id': CLIENT_SECRET['client_id'],
                        'client_secret': CLIENT_SECRET['client_secret'],
                        'grant_type': 'refresh_token',
                        'refresh_token': refresh_token
                    })
  if (r.status_code != 200):
    return None
  return r.json().get('access_token', None)


def verify_jwt(jwt: str):
  return id_token.verify_oauth2_token(jwt, grequests.Request(),
                                      CLIENT_SECRET['client_id'])


def get_credentials(userid: str) -> Credentials | None:
  auth = ds.get_token(userid, 'auth')
  refresh = ds.get_token(userid, 'refresh')
  if not (auth and refresh):
    return None
  return Credentials(auth,
                     refresh_token=refresh,
                     client_id=CLIENT_SECRET['client_id'],
                     client_secret=CLIENT_SECRET['client_secret'],
                     token_uri=CLIENT_SECRET['token_uri'],
                     scopes=SCOPES)
