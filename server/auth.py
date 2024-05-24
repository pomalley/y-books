from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import json
import requests

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
