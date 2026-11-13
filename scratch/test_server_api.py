import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import urllib.request, time, threading
from netmon.server import run

t = threading.Thread(target=run, kwargs={'host': '127.0.0.1', 'port': 8088}, daemon=True)
t.start()
time.sleep(2.0)

req = urllib.request.urlopen('http://127.0.0.1:8088/api/status', timeout=3)
data = req.read().decode('utf-8')
print('Status code:', req.status)
print('Data length:', len(data))
print('Has routers.bob:', '"bob"' in data)
print('Has routers.hq:', '"hq"' in data)
print('Has ipsec:', '"ipsec"' in data)

# Test static file serving
req_js = urllib.request.urlopen('http://127.0.0.1:8088/rows/topology_row.js', timeout=3)
js_data = req_js.read().decode('utf-8')
print('topology_row.js status:', req_js.status, 'length:', len(js_data))
print('Contains p2 (Trunk):', 'p2 (Trunk)' in js_data)
print('Contains eth3 (p2):', 'eth3 (p2)' in js_data)
print('SUCCESS!')
