"""HTTP server: Cung cấp API JSON và phục vụ các file tĩnh trong web/."""
import json
import mimetypes
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from . import config
from .collector import Collector
from .storage import MetricStore

MAX_RANGE = config.RETENTION_DAYS * 86400

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/json", ".json")


class Handler(BaseHTTPRequestHandler):
    collector: Collector = None
    store: MetricStore = None

    def do_GET(self):
        url = urlparse(self.path)
        path = url.path
        query = parse_qs(url.query)

        if path == "/api/status":
            self._json(self.collector.state)
        elif path == "/api/traffic":
            self._handle_traffic(query)
        elif path == "/api/metrics":
            self._handle_metrics(query)
        elif path == "/api/summary":
            self._handle_summary(query)
        elif path == "/api/history":
            self._handle_history(query)
        else:
            self._static(path)

    def _handle_traffic(self, query):
        seconds = min(int(query.get("range", ["3600"])[0]), MAX_RANGE)
        ifaces = [n for n in query.get("ifaces", [""])[0].split(",") if n]
        if not ifaces:
            ifaces = list(self.collector.state.get("interfaces", {}).keys())
        bucket = max(config.POLL_INTERVAL, seconds // 300)
        since = int(time.time()) - seconds
        series = self.store.traffic(ifaces, since, bucket)
        stats = self.store.traffic_summary(ifaces, since)
        self._json({"range": seconds, "series": series, "stats": stats})

    def _handle_metrics(self, query):
        seconds = min(int(query.get("range", ["3600"])[0]), MAX_RANGE)
        keys = [k for k in query.get("keys", [""])[0].split(",") if k]
        if not keys:
            keys = ["cpu", "ram", "disk", "temp", "voltage", "power", "leases", "err_in", "err_out", "drop_in", "drop_out", "ucast_out"]
        bucket = max(config.POLL_INTERVAL, seconds // 300)
        since = int(time.time()) - seconds
        series = self.store.metrics(keys, since, bucket)
        self._json({"range": seconds, "series": series})

    def _handle_summary(self, query):
        seconds = min(int(query.get("range", ["3600"])[0]), MAX_RANGE)
        ifaces = [n for n in query.get("ifaces", [""])[0].split(",") if n]
        if not ifaces:
            ifaces = list(self.collector.state.get("interfaces", {}).keys())
        since = int(time.time()) - seconds
        stats = self.store.traffic_summary(ifaces, since)
        self._json({"range": seconds, "stats": stats})

    def _handle_history(self, query):
        seconds = min(int(query.get("range", ["3600"])[0]), MAX_RANGE)
        wan_ifaces = [iface for _, iface in config.WAN_LINES]
        bucket = max(config.POLL_INTERVAL, seconds // 300)
        since = int(time.time()) - seconds
        series = self.store.traffic(wan_ifaces, since, bucket)
        self._json({"range": seconds, "series": series})

    def _static(self, path):
        clean_path = path.lstrip("/")
        if not clean_path:
            clean_path = "index.html"
        target = (config.WEB_DIR / clean_path).resolve()
        
        # Ngăn chặn Path Traversal
        if config.WEB_DIR.resolve() not in target.parents and target != config.WEB_DIR / "index.html":
            return self._send(404, b"Not found", "text/plain")
        if not target.is_file():
            # Thử tìm file index.html
            target = config.WEB_DIR / "index.html"
            if not target.is_file():
                return self._send(404, b"Not found", "text/plain")

        mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        try:
            body = target.read_bytes()
            self._send(200, body, mime)
        except OSError:
            self._send(500, b"Internal Error", "text/plain")

    def _json(self, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._send(200, body, "application/json")

    def _send(self, code, body, content_type):
        self.send_response(code)
        if content_type.startswith("text/") or content_type in ("application/javascript", "application/json"):
            content_type += "; charset=utf-8"
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        # Tắt bớt log HTTP để terminal gọn gàng
        pass


def run():
    store = MetricStore(config.DB_PATH)
    collector = Collector(store)
    collector.start()
    Handler.collector = collector
    Handler.store = store
    print(f"============================================================")
    print(f"  NetMon - Giám sát mạng MikroTik qua SNMP")
    print(f"  Giao diện: http://localhost:{config.HTTP_PORT}")
    print(f"  Router IP: {config.ROUTER_IP} (community: {config.SNMP_COMMUNITY})")
    print(f"============================================================")
    server = ThreadingHTTPServer(("0.0.0.0", config.HTTP_PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng NetMon.")
