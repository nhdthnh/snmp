"""Lưu trữ lịch sử lưu lượng (traffic) và chỉ số hệ thống (metrics) vào SQLite."""
import sqlite3
import threading
import time
from .config import RETENTION_DAYS


class MetricStore:
    def __init__(self, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(str(path), check_same_thread=False)
        self._lock = threading.Lock()
        with self._lock:
            self._db.execute("PRAGMA journal_mode=WAL")
            self._db.execute("""
                CREATE TABLE IF NOT EXISTS traffic (
                    ts INTEGER,
                    iface TEXT,
                    rx INTEGER,
                    tx INTEGER
                )
            """)
            self._db.execute("""
                CREATE TABLE IF NOT EXISTS metrics (
                    ts INTEGER,
                    key TEXT,
                    value REAL
                )
            """)
            self._db.execute("CREATE INDEX IF NOT EXISTS idx_traffic_ts_iface ON traffic (ts, iface)")
            self._db.execute("CREATE INDEX IF NOT EXISTS idx_metrics_ts_key ON metrics (ts, key)")
            self._db.commit()

    def add(self, ts, traffic, metrics):
        """Lưu điểm dữ liệu mới.
        
        traffic: iterable [(iface, rx_bps, tx_bps), ...]
        metrics: dict {key: numeric_value}
        """
        cutoff = ts - RETENTION_DAYS * 86400
        with self._lock:
            if traffic:
                self._db.executemany(
                    "INSERT INTO traffic VALUES (?, ?, ?, ?)",
                    [(ts, iface, int(rx), int(tx)) for iface, rx, tx in traffic]
                )
            if metrics:
                self._db.executemany(
                    "INSERT INTO metrics VALUES (?, ?, ?)",
                    [(ts, k, float(v)) for k, v in metrics.items() if v is not None]
                )
            # Tự động dọn dẹp dữ liệu cũ hơn RETENTION_DAYS
            self._db.execute("DELETE FROM traffic WHERE ts < ?", (cutoff,))
            self._db.execute("DELETE FROM metrics WHERE ts < ?", (cutoff,))
            self._db.commit()

    def traffic(self, ifaces, since, bucket):
        """Lấy chuỗi lịch sử lưu lượng theo bucket: {iface: [[ts, avg_rx, avg_tx], ...]}"""
        if not ifaces:
            return {}
        marks = ",".join("?" * len(ifaces))
        bucket = max(1, int(bucket))
        sql = f"""
            SELECT iface, (ts / {bucket}) * {bucket} AS t, AVG(rx), AVG(tx)
            FROM traffic
            WHERE ts >= ? AND iface IN ({marks})
            GROUP BY iface, t
            ORDER BY t ASC
        """
        with self._lock:
            rows = self._db.execute(sql, (since, *ifaces)).fetchall()
        series = {name: [] for name in ifaces}
        for name, t, rx, tx in rows:
            if name in series:
                series[name].append([int(t), round(rx or 0, 1), round(tx or 0, 1)])
        return series

    def metrics(self, keys, since, bucket):
        """Lấy chuỗi chỉ số hệ thống theo bucket: {key: [[ts, avg_val], ...]}"""
        if not keys:
            return {}
        marks = ",".join("?" * len(keys))
        bucket = max(1, int(bucket))
        sql = f"""
            SELECT key, (ts / {bucket}) * {bucket} AS t, AVG(value)
            FROM metrics
            WHERE ts >= ? AND key IN ({marks})
            GROUP BY key, t
            ORDER BY t ASC
        """
        with self._lock:
            rows = self._db.execute(sql, (since, *keys)).fetchall()
        series = {k: [] for k in keys}
        for k, t, val in rows:
            if k in series:
                series[k].append([int(t), round(val or 0, 2)])
        return series

    def traffic_summary(self, ifaces, since):
        """Tính toán các chỉ số thống kê (mean, max, min, last) cho từng interface."""
        if not ifaces:
            return {}
        marks = ",".join("?" * len(ifaces))
        sql_agg = f"""
            SELECT iface, AVG(rx), MAX(rx), MIN(rx), AVG(tx), MAX(tx), MIN(tx)
            FROM traffic
            WHERE ts >= ? AND iface IN ({marks})
            GROUP BY iface
        """
        sql_last = f"""
            SELECT t.iface, t.rx, t.tx
            FROM traffic t
            INNER JOIN (
                SELECT iface, MAX(ts) as max_ts FROM traffic WHERE ts >= ? GROUP BY iface
            ) m ON t.iface = m.iface AND t.ts = m.max_ts
            WHERE t.iface IN ({marks})
        """
        with self._lock:
            aggs = {r[0]: r[1:] for r in self._db.execute(sql_agg, (since, *ifaces)).fetchall()}
            lasts = {r[0]: (r[1], r[2]) for r in self._db.execute(sql_last, (since, *ifaces)).fetchall()}

        summary = {}
        for name in ifaces:
            agg = aggs.get(name, (0, 0, 0, 0, 0, 0))
            last_rx, last_tx = lasts.get(name, (0, 0))
            summary[name] = {
                "rx": {
                    "mean": round(agg[0] or 0, 1),
                    "max": round(agg[1] or 0, 1),
                    "min": round(agg[2] or 0, 1),
                    "last": round(last_rx or 0, 1),
                },
                "tx": {
                    "mean": round(agg[3] or 0, 1),
                    "max": round(agg[4] or 0, 1),
                    "min": round(agg[5] or 0, 1),
                    "last": round(last_tx or 0, 1),
                }
            }
        return summary
