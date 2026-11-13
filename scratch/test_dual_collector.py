import sys
sys.path.insert(0, r'c:\Users\OQR\Desktop\network')

from netmon.storage import MetricStore
from netmon import config
from netmon.collector import Collector

store = MetricStore(config.DB_PATH)
c = Collector(store)
c._poll()

print("Poll succeeded!")
print("State routers keys:", list(c.state.get("routers", {}).keys()))
hq = c.state["routers"]["hq"]
bob = c.state["routers"]["bob"]

print("HQ:", hq["name"], "Model:", hq["system"].get("model"))
print("BOB:", bob["name"], "Model:", bob["system"].get("model"))
print("BOB interfaces:", list(bob["interfaces"].keys()))
