import sys
sys.path.insert(0, r'c:\Users\OQR\Desktop\network')

import urllib.request
import json
import time

# Test server api response
print("Testing collector state directly...")
from netmon.storage import MetricStore
from netmon import config
from netmon.collector import Collector

store = MetricStore(config.DB_PATH)
c = Collector(store)
c._poll()

print("Status keys:", list(c.state.keys()))
print("Routers:", list(c.state.get("routers", {}).keys()))
print("HQ Router:", c.state["routers"]["hq"]["name"])
print("BOB Router:", c.state["routers"]["bob"]["name"])
print("IPsec:", c.state.get("ipsec"))
print("Done!")
