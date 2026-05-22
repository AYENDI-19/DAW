import subprocess
import time
import urllib.request
import json
import urllib.error
import sys

# Start uvicorn
proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

# Wait for it to start
time.sleep(3)

# Hit the endpoint
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/login',
    data=json.dumps({'email':'cliente@irongym.com', 'password':'iron123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    resp = urllib.request.urlopen(req)
    print("SUCCESS")
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)

# Kill uvicorn
proc.terminate()
stdout, stderr = proc.communicate()

print("STDOUT:")
print(stdout.decode('utf-8', errors='ignore'))
print("STDERR:")
print(stderr.decode('utf-8', errors='ignore'))
