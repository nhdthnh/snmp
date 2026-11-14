import json
import threading
import time
import urllib.request
import urllib.error
from http.server import ThreadingHTTPServer

from netmon import auth, config
from netmon.server import Handler
from netmon.storage import MetricStore

TEST_PORT = 18088

class MockCollector:
    state = {
        "ts": int(time.time()),
        "router": {"up": True},
        "interfaces": {"ether1": {"up": True, "rx_bps": 1000, "tx_bps": 2000}},
        "devices": {},
        "routers": {
            "hq": {"interfaces": {"ether1": {}, "ether2": {}}},
            "bob": {"interfaces": {"ether1": {}, "ether2": {}}},
        }
    }

store = MetricStore(config.DB_PATH)
Handler.collector = MockCollector()
Handler.store = store

server = ThreadingHTTPServer(("127.0.0.1", TEST_PORT), Handler)
t = threading.Thread(target=server.serve_forever, daemon=True)
t.start()
time.sleep(0.5)

base_url = f"http://127.0.0.1:{TEST_PORT}"

# Disable automatic redirect to test 302
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirect)

# 1. GET / without cookie -> 302 to /login.html
try:
    res = opener.open(f"{base_url}/")
    code = res.getcode()
    loc = res.headers.get("Location")
except urllib.error.HTTPError as e:
    code = e.code
    loc = e.headers.get("Location")

print(f"1. GET / -> Code: {code}, Location: {loc}")
assert code == 302 and loc == "/login.html", "Expected 302 redirect to /login.html"

# 2. GET /login.html -> 200
res2 = opener.open(f"{base_url}/login.html")
print(f"2. GET /login.html -> Code: {res2.getcode()}, Body len: {len(res2.read())}")
assert res2.getcode() == 200

# 3. GET /api/status without cookie -> 401
try:
    opener.open(f"{base_url}/api/status")
    assert False, "Expected 401 for /api/status without auth"
except urllib.error.HTTPError as e:
    print(f"3. GET /api/status without auth -> Code: {e.code}")
    assert e.code == 401

# 4. POST /api/login with wrong password -> 401
req_bad = urllib.request.Request(
    f"{base_url}/api/login",
    data=json.dumps({"username": "system", "password": "wrong"}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    opener.open(req_bad)
    assert False, "Expected 401 for bad password"
except urllib.error.HTTPError as e:
    print(f"4. POST /api/login with wrong pass -> Code: {e.code}")
    assert e.code == 401

# 5. POST /api/login with correct credentials: system / @cronis1 -> 200
req_good = urllib.request.Request(
    f"{base_url}/api/login",
    data=json.dumps({"username": "system", "password": "@cronis1"}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)
res_login = opener.open(req_good)
data = json.loads(res_login.read().decode("utf-8"))
cookie_hdr = res_login.headers.get("Set-Cookie")
print(f"5. POST /api/login good -> Code: {res_login.getcode()}, Token: {data.get('token')[:8]}..., Cookie: {cookie_hdr[:30]}...")
assert res_login.getcode() == 200 and data.get("ok") is True
token = data["token"]

# 6. GET /api/status with cookie -> 200
req_auth = urllib.request.Request(
    f"{base_url}/api/status",
    headers={"Cookie": f"netmon_session={token}"}
)
res_status = opener.open(req_auth)
status_data = json.loads(res_status.read().decode("utf-8"))
print(f"6. GET /api/status with Cookie -> Code: {res_status.getcode()}, has routers: {'routers' in status_data}")
assert res_status.getcode() == 200

# 7. GET / with cookie -> 200 (serves index.html!)
req_home = urllib.request.Request(
    f"{base_url}/",
    headers={"Cookie": f"netmon_session={token}"}
)
res_home = opener.open(req_home)
home_html = res_home.read().decode("utf-8")
print(f"7. GET / with Cookie -> Code: {res_home.getcode()}, has NetMon: {'NetMon' in home_html}")
assert res_home.getcode() == 200

# 8. POST /api/logout
req_logout = urllib.request.Request(
    f"{base_url}/api/logout",
    headers={"Cookie": f"netmon_session={token}"},
    method="POST"
)
res_logout = opener.open(req_logout)
print(f"8. POST /api/logout -> Code: {res_logout.getcode()}")
assert res_logout.getcode() == 200

# 9. GET /api/status after logout -> 401
try:
    opener.open(req_auth)
    assert False, "Expected 401 after logout"
except urllib.error.HTTPError as e:
    print(f"9. GET /api/status after logout -> Code: {e.code}")
    assert e.code == 401

server.shutdown()
print("\n>>> ALL 9 HTTP SERVER & AUTH TESTS PASSED PERFECTLY! <<<")
