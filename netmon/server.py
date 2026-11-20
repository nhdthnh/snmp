"""HTTP server: Cung cấp API JSON có bảo mật và phục vụ các file tĩnh trong web/."""
import json
import mimetypes
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from . import auth, config
from .ai_analyzer import AiAnalyzer
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
    ai_analyzer: AiAnalyzer = None

    def do_POST(self):
        url = urlparse(self.path)
        path = url.path
        is_auth = auth.is_authenticated(self.headers)

        if path == "/api/login":
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
            try:
                data = json.loads(raw_body.decode("utf-8"))
            except Exception:
                data = {}
            username = str(data.get("username", "")).strip()
            password = str(data.get("password", "")).strip()

            token = auth.authenticate(username, password)
            if token:
                cookie = f"netmon_session={token}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly"
                self._json({"ok": True, "token": token, "username": username}, cookies=[cookie])
            else:
                self._json({"ok": False, "error": "Tên đăng nhập hoặc mật khẩu không chính xác!"}, code=401)

        elif path == "/api/logout":
            token = auth.get_token_from_headers(self.headers)
            if token:
                auth.logout(token)
            cookie = "netmon_session=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly"
            self._json({"ok": True}, cookies=[cookie])
        elif path == "/api/ai-analyze-now":
            if not is_auth:
                return self._json({"error": "Unauthorized", "login_url": "/login.html"}, code=401)
            ok = self.ai_analyzer.trigger_now() if self.ai_analyzer else False
            self._json({
                "ok": ok,
                "message": "Đã bắt đầu chu kỳ phân tích lưu lượng AI..." if ok else "AI đang trong quá trình phân tích, vui lòng đợi..."
            })
        elif path == "/api/topology-config":
            if not is_auth:
                return self._json({"error": "Unauthorized", "login_url": "/login.html"}, code=401)
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
            try:
                cfg = json.loads(raw_body.decode("utf-8"))
                cfg_path = config.DATA_DIR / "topology_config.json"
                cfg_path.parent.mkdir(parents=True, exist_ok=True)
                cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
                self._json({"ok": True, "message": "Đã lưu cấu hình sơ đồ và IP thành công!"})
            except Exception as e:
                self._json({"ok": False, "error": str(e)}, code=400)
        else:
            self._send(404, b"Not found", "text/plain")

    def do_GET(self):
        url = urlparse(self.path)
        path = url.path
        query = parse_qs(url.query)

        is_auth = auth.is_authenticated(self.headers)

        # 1. API kiểm tra phiên đăng nhập
        if path == "/api/auth-check":
            return self._json({
                "authenticated": is_auth,
                "username": auth.VALID_USERNAME if is_auth else None
            })

        # 2. Trang đăng nhập login.html
        if path in ("/login", "/login.html"):
            if is_auth:
                return self._redirect("/")
            return self._static("login.html")

        # 3. Các file tĩnh phục vụ cho màn hình đăng nhập (css, js, ảnh)
        if path in ("/login.css", "/login.js", "/favicon.ico") or path.endswith((".png", ".jpg", ".svg", ".ico", ".woff", ".woff2")):
            return self._static(path)

        # 4. Bảo vệ các endpoint API
        if path.startswith("/api/"):
            if not is_auth:
                return self._json({"error": "Unauthorized", "login_url": "/login.html"}, code=401)

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
            elif path == "/api/ai-analysis":
                data = self.ai_analyzer.get_latest_analysis() if self.ai_analyzer else {}
                self._json({"ok": True, "data": data})
            elif path == "/api/topology-config":
                cfg_path = config.DATA_DIR / "topology_config.json"
                if cfg_path.is_file():
                    try:
                        cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
                        self._json({"ok": True, "config": cfg})
                        return
                    except Exception:
                        pass
                self._json({"ok": False, "error": "Chưa có file topology_config.json"})
            else:
                self._send(404, b"Not found", "text/plain")
            return

        # 5. Các trang giao diện chính: chuyển hướng sang login nếu chưa đăng nhập
        if not is_auth:
            return self._redirect("/login.html")

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
            target = config.WEB_DIR / "index.html"
            if not target.is_file():
                return self._send(404, b"Not found", "text/plain")

        mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        try:
            body = target.read_bytes()
            self._send(200, body, mime)
        except OSError:
            self._send(500, b"Internal Error", "text/plain")

    def _redirect(self, location):
        self.send_response(302)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.end_headers()

    def _json(self, payload, code=200, cookies=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._send(code, body, "application/json", cookies=cookies)

    def _send(self, code, body, content_type, cookies=None):
        self.send_response(code)
        if content_type.startswith("text/") or content_type in ("application/javascript", "application/json"):
            content_type += "; charset=utf-8"
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Access-Control-Allow-Origin", "*")
        if cookies:
            for c in cookies:
                self.send_header("Set-Cookie", c)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass


def run():
    store = MetricStore(config.DB_PATH)
    collector = Collector(store)
    collector.start()
    ai_analyzer = AiAnalyzer(collector)
    ai_analyzer.start()
    Handler.collector = collector
    Handler.store = store
    Handler.ai_analyzer = ai_analyzer
    print(f"============================================================")
    print(f"  NetMon - Giám sát mạng MikroTik qua SNMP")
    print(f"  Giao diện: http://localhost:{config.HTTP_PORT}")
    print(f"  Router IP: {config.ROUTER_IP} (community: {config.SNMP_COMMUNITY})")
    print(f"  Trợ lý AI: Model mục tiêu {config.AI_PRIMARY_MODEL} (Chu kỳ {config.AI_ANALYSIS_INTERVAL // 60}m)")
    print(f"  Trạng thái bảo mật: Đã kích hoạt xác thực người dùng")
    print(f"============================================================")
    server = ThreadingHTTPServer(("0.0.0.0", config.HTTP_PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng NetMon.")
