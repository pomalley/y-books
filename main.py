from flask import Flask, jsonify, request, abort, send_file, send_from_directory, session
import google_auth_oauthlib

from server.auth import verify_jwt, SCOPES
import server.datastore as ds
import server.sheets as sheets

app = Flask(__name__)

with open('flask_secret.txt') as f:
  app.secret_key = f.read()


def _all_params(userid: str):
  return {
      'token': ds.get_token(userid),
      'sheet_id': ds.get_param(userid, 'sheet_id'),
      'external_path': ds.get_param(userid, 'external_path')
  }


# Enable in dev mode.
# @app.after_request
# def after_request(response):
#   response.headers.add('Access-Control-Allow-Origin', '*')
#   response.headers.add('Access-Control-Allow-Headers',
#                        'Content-Type,Authorization')
#   response.headers.add('Access-Control-Allow-Methods',
#                        'GET,PUT,POST,DELETE,OPTIONS')
#   return response


@app.route("/token")
def token():
  '''Get the auth token (and sheet id), if present.'''
  if request.headers.get('X-Requested-With') != 'XmlHttpRequest':
    abort(400, 'Invalid X-Requested-With')
  if 'userid' not in session:
    abort(401)
  if request.args.get('refresh', ''):
    refresh_token = ds.get_token(session['userid'], type='refresh')
    if not refresh_token:
      abort(403)
    ds.refresh_token(session['userid'], refresh_token=refresh_token)
  t = ds.get_token(session['userid'])
  if not t:
    abort(403)
  return _all_params(session['userid'])


@app.route("/logout")
def logout():
  '''Log the user out.'''
  session.pop('userid')
  return {}


@app.route("/login", methods=['POST'])
def login():
  '''Verify JWT oauth2 credential, and return auth token if we have it.'''
  if request.headers.get('X-Requested-With') != 'XmlHttpRequest':
    abort(400, 'Invalid X-Requested-With')
  if not request.is_json:
    abort(400, 'JWT required as json.')
  try:
    idinfo = verify_jwt(request.json['credential'])  # type: ignore
    session['userid'] = idinfo['sub']
    return _all_params(session['userid'])
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
  ds.store_tokens(session['userid'], c['token'], c['refresh_token'])
  return _all_params(session['userid'])


@app.route("/set/<param>", methods=["POST"])
def set_sheet_id(param: str):
  '''Set the sheet id for this user (in the datastore).'''
  if request.headers.get('X-Requested-With') != 'XmlHttpRequest':
    abort(400, 'Invalid X-Requested-With')
  if 'userid' not in session:
    abort(401, 'Not signed in.')
  if param not in ('sheet_id', 'external_path'):
    abort(400, 'Invalid param.')
  j = request.json
  if not j:
    abort(400, 'No data provided.')
  value = j.get('value', None)
  if not value:
    abort(400, 'No value provided.')
  ds.store_param(session['userid'], param=param, value=str(value))
  return _all_params(session['userid'])


@app.route("/update")
def update():
  sheet_ids = ds.get_all_sheets()
  for userid, sheet_id, _external_path in sheet_ids:
    books = sheets.get_public_books(sheet_id=sheet_id, userid=userid)
    ds.update_public_books(userid, books)
  return {}


@app.route("/pub/<external_path>")
def pub(external_path: str):
  response = jsonify(ds.get_public_books(external_path))
  # response.headers.add('Access-Control-Allow-Origin', '*')  # enable for dev
  return response


@app.route('/')
@app.route('/p/<external_path>')
def root(external_path=None):
  '''Serve dist/spa/index.html as root. Only used in the dev environment.'''
  del external_path
  return send_file('dist/spa/index.html')


@app.route("/<path:name>")
def all(name):
  '''Serve dist/spa as static files. Only used in dev environment.'''
  return send_from_directory('dist/spa', name)


if __name__ == "__main__":
  app.run(host="127.0.0.1", port=8080, debug=True)
