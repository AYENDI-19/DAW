import urllib.request
import json
import urllib.error

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/login',
    data=json.dumps({'email':'cliente@irongym.com', 'password':'iron123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    resp = urllib.request.urlopen(req)
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("RESPONSE BODY:")
    print(e.read().decode())
