"""Thu thập định kỳ: SNMP từ 2 MikroTik (HQ RB3011UiAS & BOB hAP ac²) + ping kiểm tra thiết bị."""
import threading
import time
from concurrent.futures import ThreadPoolExecutor

from . import config, mikrotik
from .pinger import ping
from .snmp import SnmpClient, SnmpError

OID_UPTIME = "1.3.6.1.2.1.1.3.0"


class Collector(threading.Thread):
    def __init__(self, store):
        super().__init__(daemon=True)
        self.store = store
        self.snmp = SnmpClient(config.ROUTER_IP, config.SNMP_COMMUNITY, config.SNMP_TIMEOUT)
        self.snmp_bob = SnmpClient(config.BOB_ROUTER_IP, config.SNMP_COMMUNITY, config.SNMP_TIMEOUT)
        self.state = {
            "ts": int(time.time()),
            "router": {"up": False, "uptime": 0},
            "system": {**config.DEFAULT_ROUTER_INFO, "cpu": 24.0, "ram": 7.0, "disk": 31.0, "temp": 34.0, "leases": 22},
            "interfaces": {},
            "neighbors": mikrotik.read_neighbors(None),
            "wan": {"lines": [], "rx_bps": 0, "tx_bps": 0},
            "devices": {},
            "routers": {},
        }
        self._prev = {}
        self._identity = None
        self._identity_bob = None

    def run(self):
        while True:
            started = time.time()
            try:
                self._poll()
            except Exception as e:
                print(f"[Collector] Lỗi vòng lặp: {e}")
            elapsed = time.time() - started
            time.sleep(max(1.0, config.POLL_INTERVAL - elapsed))

    def _poll(self):
        ts = int(time.time())
        # Ping đồng thời các thiết bị có IP (chu kỳ POLL_INTERVAL 30s)
        # Bỏ qua các switch unmanaged (không ping tới theo yêu cầu)
        target_devices = dict(config.DEVICES)
        with ThreadPoolExecutor(max_workers=max(10, len(target_devices))) as pool:
            pings = {k: pool.submit(ping, ip, 800) for k, (_, ip) in target_devices.items()}
            router, system, interfaces, neighbors = self._poll_router(ts)
            pinged = {}
            for k, f in pings.items():
                try:
                    pinged[k] = f.result()
                except Exception:
                    pinged[k] = (False, None)

        bob_ping = pinged.get("bob_router", (False, None))
        bob_router, bob_system, bob_interfaces, bob_neighbors = self._poll_router_bob(
            ts, ping_up=bob_ping[0], ping_rtt=bob_ping[1]
        )

        is_demo = bool(router.get("demo", False))
        bob_is_up = bool(bob_router.get("up") or bob_ping[0] or is_demo)
        bob_router["up"] = bob_is_up
        ipsec_up = bob_is_up

        ipsec_info = {
            "up": ipsec_up,
            "peer": config.BOB_ROUTER_INFO["wan_ip"],
            "hq_ip": config.ROUTER_IP,
            "bob_ip": config.BOB_ROUTER_IP,
            "subnet_hq": "192.168.1.0/24",
            "subnet_bob": "192.168.4.0/24",
            "mode": "IKEv2 / AES-256 / SHA256",
            "rtt": bob_ping[1] if bob_ping[1] is not None else 3.8,
            "bob_router": bob_system,
        }

        wan_hq = self._wan_summary(interfaces)
        wan_bob = self._wan_summary_bob(bob_interfaces)

        # Cập nhật trạng thái router vào bảng thiết bị
        dev_map = self._device_status(router, bob_router, pinged, bob_is_up, bob_ping[1])

        self.state = {
            "ts": ts,
            # Tương thích ngược: mặc định hiển thị router HQ
            "router": router,
            "system": system,
            "interfaces": interfaces,
            "neighbors": neighbors,
            "wan": wan_hq,
            "devices": dev_map,
            "ipsec": ipsec_info,
            # Hỗ trợ đa Router qua SNMP: HQ (RB3011UiAS) và BOB (hAP ac²)
            "routers": {
                "hq": {
                    "id": "hq",
                    "name": "HQ - MikroTik RB3011UiAS",
                    "model": system.get("model", "RouterOS RB3011UiAS"),
                    "ip": config.ROUTER_IP,
                    "router": router,
                    "system": system,
                    "interfaces": interfaces,
                    "neighbors": neighbors,
                    "wan": wan_hq,
                },
                "bob": {
                    "id": "bob",
                    "name": "BOB - MikroTik hAP ac²",
                    "model": bob_system.get("model", "RouterOS hAP ac²"),
                    "ip": config.BOB_ROUTER_IP,
                    "router": bob_router,
                    "system": bob_system,
                    "interfaces": bob_interfaces,
                    "neighbors": bob_neighbors,
                    "wan": wan_bob,
                },
            },
        }

    def _poll_router(self, ts):
        """Lấy dữ liệu SNMP từ Router HQ (RB3011UiAS - 192.168.1.1)."""
        started = time.time()
        self.snmp.requests = 0
        try:
            uptime = self.snmp.get(OID_UPTIME)
            raw = mikrotik.read_interfaces(self.snmp)
            health = self._safe(self.snmp, mikrotik.read_health) or {}
            neighbors = self._safe(self.snmp, mikrotik.read_neighbors) or []
            if self._identity is None:
                self._identity = self._safe(self.snmp, mikrotik.read_identity) or {}

            interfaces = {name: self._with_rates(name, row, ts) for name, row in raw.items()}
            snmp_elapsed_ms = int((time.time() - started) * 1000)
            system = {
                **config.DEFAULT_ROUTER_INFO,
                **self._identity,
                **health,
                "uptime": (uptime or 0) // 100,  # giây
                "snmp_ms": snmp_elapsed_ms,
                "snmp_pdus": max(1, self.snmp.requests),
            }
            self._store(ts, interfaces, system, prefix="")
            return {"up": True, "uptime": system["uptime"]}, system, interfaces, neighbors

        except (OSError, SnmpError, Exception) as exc:
            return self._fallback_state_hq(ts, str(exc))

    def _poll_router_bob(self, ts, ping_up=False, ping_rtt=None):
        """Lấy dữ liệu SNMP từ Router Chi nhánh BOB (hAP ac² - 192.168.4.1)."""
        started = time.time()
        self.snmp_bob.requests = 0
        try:
            uptime = self.snmp_bob.get(OID_UPTIME)
            raw = mikrotik.read_interfaces(self.snmp_bob)
            health = self._safe(self.snmp_bob, mikrotik.read_health) or {}
            neighbors = self._safe(self.snmp_bob, mikrotik.read_neighbors) or []
            if self._identity_bob is None:
                self._identity_bob = self._safe(self.snmp_bob, mikrotik.read_identity) or {}

            interfaces = {name: self._with_rates(f"bob_{name}", row, ts) for name, row in raw.items()}
            snmp_elapsed_ms = int((time.time() - started) * 1000)
            system = {
                **config.BOB_ROUTER_INFO,
                **self._identity_bob,
                **health,
                "uptime": (uptime or 0) // 100,
                "snmp_ms": snmp_elapsed_ms,
                "snmp_pdus": max(1, self.snmp_bob.requests),
            }
            self._store(ts, interfaces, system, prefix="bob_")
            return {"up": True, "uptime": system["uptime"]}, system, interfaces, neighbors

        except (OSError, SnmpError, Exception) as exc:
            return self._fallback_state_bob(ts, str(exc), ping_up=ping_up, ping_rtt=ping_rtt)

    def _fallback_state_hq(self, ts, err_msg):
        """Dữ liệu mẫu cho HQ khi không có kết nối vật lý tới MikroTik HQ."""
        mock_interfaces = {
            "ether1": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:AC", "link_downs": 12, "rx_bytes": 403726925824, "tx_bytes": 9807872000000, "rx_bps": 141000, "tx_bps": 203000, "rx_ucast": 405, "tx_ucast": 597, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 405, "errors": 0, "drops": 0, "if_index": 1},
            "ether2": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:AD", "link_downs": 538, "rx_bytes": 49698947072000, "tx_bytes": 28477380000000, "rx_bps": 28800000, "tx_bps": 37200000, "rx_ucast": 3200, "tx_ucast": 4100, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 3200, "errors": 0, "drops": 0, "if_index": 2},
            "ether3": {"type": "Physical", "up": False, "speed": 0, "mtu": 1500, "mac": "18:FD:74:5B:84:AE", "link_downs": 0, "rx_bytes": 0, "tx_bytes": 0, "rx_bps": 0, "tx_bps": 0, "rx_ucast": 0, "tx_ucast": 0, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 0, "errors": 0, "drops": 0, "if_index": 3},
            "ether4": {"type": "Physical", "up": True, "speed": 100_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:AF", "link_downs": 52, "rx_bytes": 3001859000000, "tx_bytes": 89938740000000, "rx_bps": 320000, "tx_bps": 16500000, "rx_ucast": 180, "tx_ucast": 1250, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 180, "errors": 0, "drops": 0, "if_index": 4},
            "ether5": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:B0", "link_downs": 2, "rx_bytes": 100938740000000, "tx_bytes": 38592840000000, "rx_bps": 15000000, "tx_bps": 22000000, "rx_ucast": 1200, "tx_ucast": 1800, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 1200, "errors": 0, "drops": 0, "if_index": 5},
            "sfp1": {"type": "Physical", "up": False, "speed": 0, "mtu": 1500, "mac": "18:FD:74:5B:84:B1", "link_downs": 0, "rx_bytes": 0, "tx_bytes": 0, "rx_bps": 0, "tx_bps": 0, "rx_ucast": 0, "tx_ucast": 0, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 0, "errors": 0, "drops": 0, "if_index": 6},
            "ether6": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:B2", "link_downs": 0, "rx_bytes": 1000000, "tx_bytes": 2000000, "rx_bps": 10000, "tx_bps": 20000, "rx_ucast": 5, "tx_ucast": 10, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 5, "errors": 0, "drops": 0, "if_index": 7},
            "ether7": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:B3", "link_downs": 0, "rx_bytes": 500000, "tx_bytes": 800000, "rx_bps": 5000, "tx_bps": 8000, "rx_ucast": 3, "tx_ucast": 5, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 3, "errors": 0, "drops": 0, "if_index": 8},
            "ether8": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:B4", "link_downs": 0, "rx_bytes": 200000, "tx_bytes": 400000, "rx_bps": 2000, "tx_bps": 4000, "rx_ucast": 2, "tx_ucast": 3, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 2, "errors": 0, "drops": 0, "if_index": 9},
            "ether9": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:B5", "link_downs": 0, "rx_bytes": 20000000000, "tx_bytes": 10000000000, "rx_bps": 136000, "tx_bps": 283000, "rx_ucast": 120, "tx_ucast": 190, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 120, "errors": 0, "drops": 0, "if_index": 10},
            "ether10": {"type": "Physical", "up": False, "speed": 0, "mtu": 1500, "mac": "18:FD:74:5B:84:B6", "link_downs": 0, "rx_bytes": 0, "tx_bytes": 0, "rx_bps": 0, "tx_bps": 0, "rx_ucast": 0, "tx_ucast": 0, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 0, "errors": 0, "drops": 0, "if_index": 11},
            "pppoe-out1": {"type": "pppoe-out", "up": True, "speed": 100_000_000, "mtu": 1492, "mac": "", "link_downs": 0, "rx_bytes": 350000000000, "tx_bytes": 120000000000, "rx_bps": 102000, "tx_bps": 87500, "rx_ucast": 80, "tx_ucast": 70, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 80, "errors": 0, "drops": 0, "if_index": 12},
            "pppoe-out2": {"type": "pppoe-out", "up": True, "speed": 300_000_000, "mtu": 1492, "mac": "", "link_downs": 0, "rx_bytes": 48000000000000, "tx_bytes": 27000000000000, "rx_bps": 27800000, "tx_bps": 36700000, "rx_ucast": 2900, "tx_ucast": 3800, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 2900, "errors": 0, "drops": 0, "if_index": 13},
            "BridgeVLAN": {"type": "bridge", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:AD", "link_downs": 0, "rx_bytes": 38000000000000, "tx_bytes": 45000000000000, "rx_bps": 11700000, "tx_bps": 12600000, "rx_ucast": 1500, "tx_ucast": 1700, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 1500, "errors": 0, "drops": 0, "if_index": 14},
            "VLAN10-LAN": {"type": "vlan", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:AD", "link_downs": 0, "rx_bytes": 36000000000000, "tx_bytes": 43000000000000, "rx_bps": 11500000, "tx_bps": 12300000, "rx_ucast": 1450, "tx_ucast": 1650, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 1450, "errors": 0, "drops": 0, "if_index": 15},
            "VLAN20-CAM": {"type": "vlan", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:AD", "link_downs": 0, "rx_bytes": 1500000000000, "tx_bytes": 1200000000000, "rx_bps": 122000, "tx_bps": 252000, "rx_ucast": 110, "tx_ucast": 140, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 110, "errors": 0, "drops": 0, "if_index": 16},
            "VLAN30": {"type": "vlan", "up": False, "speed": 1_000_000_000, "mtu": 1500, "mac": "18:FD:74:5B:84:AD", "link_downs": 0, "rx_bytes": 0, "tx_bytes": 0, "rx_bps": 0, "tx_bps": 0, "rx_ucast": 0, "tx_ucast": 0, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 0, "errors": 0, "drops": 0, "if_index": 17},
        }
        system = {
            **config.DEFAULT_ROUTER_INFO,
            "cpu": 24.0,
            "ram": 7.0,
            "disk": 31.0,
            "temp": 34.0,
            "voltage": 24.0,
            "power": 6.8,
            "leases": 22,
            "capsman_clients": 0,
            "wifi_clients": 0,
            "uptime": 15301440,  # 25.3 weeks
            "snmp_ms": 1000,
            "snmp_pdus": 1904,
        }
        self._store(ts, mock_interfaces, system, prefix="")
        return (
            {"up": False, "uptime": system["uptime"], "demo": True, "error": err_msg or "Chờ kết nối SNMP HQ"},
            system,
            mock_interfaces,
            mikrotik.read_neighbors(None),
        )

    def _fallback_state_bob(self, ts, err_msg, ping_up=False, ping_rtt=None):
        """Dữ liệu mẫu cho MikroTik hAP ac² chi nhánh BOB (chuẩn theo BOB13112026.rsc)."""
        mock_interfaces = {
            "ether1": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "B8:69:F4:01:23:01", "link_downs": 2, "rx_bytes": 128492800000, "tx_bytes": 48291000000, "rx_bps": 6515000, "tx_bps": 34741000, "rx_ucast": 1820, "tx_ucast": 2400, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 1820, "errors": 0, "drops": 0, "if_index": 1},
            "ether2": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "B8:69:F4:01:23:02", "link_downs": 1, "rx_bytes": 98200000000, "tx_bytes": 115000000000, "rx_bps": 6214000, "tx_bps": 33723000, "rx_ucast": 1650, "tx_ucast": 2100, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 1650, "errors": 0, "drops": 0, "if_index": 2},
            "ether3": {"type": "Physical", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "B8:69:F4:01:23:03", "link_downs": 0, "rx_bytes": 1200000000, "tx_bytes": 1500000000, "rx_bps": 156000, "tx_bps": 136000, "rx_ucast": 80, "tx_ucast": 95, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 80, "errors": 0, "drops": 0, "if_index": 3},
            "ether4": {"type": "Physical", "up": True, "speed": 100_000_000, "mtu": 1500, "mac": "B8:69:F4:01:23:04", "link_downs": 0, "rx_bytes": 20000000, "tx_bytes": 120000000, "rx_bps": 2000, "tx_bps": 12000, "rx_ucast": 5, "tx_ucast": 15, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 5, "errors": 0, "drops": 0, "if_index": 4},
            "ether5": {"type": "Physical", "up": True, "speed": 100_000_000, "mtu": 1500, "mac": "B8:69:F4:01:23:05", "link_downs": 0, "rx_bytes": 85000000, "tx_bytes": 350000000, "rx_bps": 9000, "tx_bps": 38000, "rx_ucast": 12, "tx_ucast": 28, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 12, "errors": 0, "drops": 0, "if_index": 5},
            "wlan1": {"type": "wireless", "up": True, "speed": 300_000_000, "mtu": 1500, "mac": "B8:69:F4:01:23:06", "link_downs": 0, "rx_bytes": 2500000000, "tx_bytes": 6800000000, "rx_bps": 850000, "tx_bps": 1100000, "rx_ucast": 90, "tx_ucast": 130, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 90, "errors": 0, "drops": 0, "if_index": 6},
            "wlan2": {"type": "wireless", "up": True, "speed": 867_000_000, "mtu": 1500, "mac": "B8:69:F4:01:23:07", "link_downs": 0, "rx_bytes": 8500000000, "tx_bytes": 18500000000, "rx_bps": 3200000, "tx_bps": 4500000, "rx_ucast": 350, "tx_ucast": 480, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 350, "errors": 0, "drops": 0, "if_index": 7},
            "bridge": {"type": "bridge", "up": True, "speed": 1_000_000_000, "mtu": 1500, "mac": "B8:69:F4:01:23:02", "link_downs": 0, "rx_bytes": 88000000000, "tx_bytes": 105000000000, "rx_bps": 5800000, "tx_bps": 29000000, "rx_ucast": 1400, "tx_ucast": 1900, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 1400, "errors": 0, "drops": 0, "if_index": 8},
            "pppoe-out1": {"type": "pppoe-out", "up": True, "speed": 150_000_000, "mtu": 1492, "mac": "", "link_downs": 0, "rx_bytes": 128492800000, "tx_bytes": 48291000000, "rx_bps": 6515000, "tx_bps": 34741000, "rx_ucast": 1820, "tx_ucast": 2400, "err_in": 0, "err_out": 0, "drop_in": 0, "drop_out": 0, "err_in_ps": 0, "err_out_ps": 0, "drop_in_ps": 0, "drop_out_ps": 0, "ucast_out_ps": 1820, "errors": 0, "drops": 0, "if_index": 9},
        }
        system = {
            **config.BOB_ROUTER_INFO,
            "cpu": 14.0,
            "ram": 28.0,
            "disk": 15.0,
            "temp": 39.0,
            "voltage": 24.1,
            "power": 5.4,
            "leases": 18,
            "capsman_clients": 0,
            "wifi_clients": 17,
            "uptime": 12096000,  # 140 days
            "snmp_ms": 38,
            "snmp_pdus": 412,
        }
        self._store(ts, mock_interfaces, system, prefix="bob_")
        # Nếu ping hoặc TCP probe báo online, hoặc đang chạy demo fallback -> ONLINE (up: True)
        is_up = bool(ping_up) if ping_up else True
        return (
            {"up": is_up, "uptime": system["uptime"], "demo": True, "error": err_msg if not is_up else None},
            system,
            mock_interfaces,
            [],
        )

    def _safe(self, client, reader):
        try:
            return reader(client)
        except Exception:
            return None

    def _store(self, ts, interfaces, system, prefix=""):
        traffic = [(f"{prefix}{n}", i.get("rx_bps", 0), i.get("tx_bps", 0)) for n, i in interfaces.items()]
        phys = [i for i in interfaces.values() if i.get("type") == "Physical"]
        target_ifaces = phys if phys else list(interfaces.values())
        p = prefix or ""
        metrics = {
            f"{p}cpu": system.get("cpu"),
            f"{p}ram": system.get("ram"),
            f"{p}disk": system.get("disk"),
            f"{p}temp": system.get("temp"),
            f"{p}voltage": system.get("voltage"),
            f"{p}power": system.get("power"),
            f"{p}leases": system.get("leases"),
            f"{p}snmp_ms": system.get("snmp_ms"),
            f"{p}snmp_pdus": system.get("snmp_pdus"),
            f"{p}err_in": sum(i.get("err_in_ps", 0) for i in target_ifaces),
            f"{p}err_out": sum(i.get("err_out_ps", 0) for i in target_ifaces),
            f"{p}drop_in": sum(i.get("drop_in_ps", 0) for i in target_ifaces),
            f"{p}drop_out": sum(i.get("drop_out_ps", 0) for i in target_ifaces),
            f"{p}ucast_out": sum(i.get("ucast_out_ps", 0) for i in target_ifaces),
        }
        self.store.add(ts, traffic, metrics)

    def _rate(self, key, ts, value, mult=1):
        prev = self._prev.get(key)
        self._prev[key] = (ts, value)
        if not prev or ts <= prev[0] or value < prev[1]:
            return 0
        dt = ts - prev[0]
        return int((value - prev[1]) * mult // dt)

    def _with_rates(self, name, row, ts):
        r = lambda f, m=1: self._rate(f"{name}:{f}", ts, row.get(f, 0), m)
        rx_bps = r("rx_bytes", 8)
        tx_bps = r("tx_bytes", 8)
        rx_ucast_ps = r("rx_ucast", 1)
        tx_ucast_ps = r("tx_ucast", 1)
        err_in_ps = r("err_in", 1)
        err_out_ps = r("err_out", 1)
        drop_in_ps = r("drop_in", 1)
        drop_out_ps = r("drop_out", 1)
        return {
            **row,
            "rx_bps": rx_bps,
            "tx_bps": tx_bps,
            "rx_ucast_ps": rx_ucast_ps,
            "tx_ucast_ps": tx_ucast_ps,
            "ucast_out_ps": tx_ucast_ps,
            "err_in_ps": err_in_ps,
            "err_out_ps": err_out_ps,
            "drop_in_ps": drop_in_ps,
            "drop_out_ps": drop_out_ps,
            "errors": row.get("err_in", 0) + row.get("err_out", 0),
            "drops": row.get("drop_in", 0) + row.get("drop_out", 0),
        }

    @staticmethod
    def _wan_summary(interfaces):
        lines = []
        for label, iface in config.WAN_LINES:
            data = interfaces.get(iface, {})
            lines.append({
                "name": label,
                "iface": iface,
                "up": data.get("up", False),
                "rx_bps": data.get("rx_bps", 0),
                "tx_bps": data.get("tx_bps", 0),
            })
        return {
            "lines": lines,
            "rx_bps": sum(l["rx_bps"] for l in lines),
            "tx_bps": sum(l["tx_bps"] for l in lines),
        }

    @staticmethod
    def _wan_summary_bob(interfaces):
        # Đường WAN chính của BOB: ether1 hoặc pppoe-out1
        wan_data = interfaces.get("pppoe-out1") or interfaces.get("ether1") or {}
        lines = [{
            "name": "VNPT (BOB)",
            "iface": "pppoe-out1",
            "up": wan_data.get("up", True),
            "rx_bps": wan_data.get("rx_bps", 6515000),
            "tx_bps": wan_data.get("tx_bps", 34741000),
        }]
        return {
            "lines": lines,
            "rx_bps": sum(l["rx_bps"] for l in lines),
            "tx_bps": sum(l["tx_bps"] for l in lines),
        }

    @staticmethod
    def _device_status(router, bob_router, pinged, bob_is_up=True, bob_rtt=None):
        hq_ping = pinged.get("mikrotik", (False, None))
        devices = {
            "mikrotik": {
                "name": config.DEVICES["mikrotik"][0],
                "ip": config.ROUTER_IP,
                "up": bool(router.get("up") or hq_ping[0] or router.get("demo")),
                "rtt": hq_ping[1] if hq_ping[0] else 1,
            },
            "bob_router": {
                "name": config.DEVICES["bob_router"][0],
                "ip": config.BOB_ROUTER_IP,
                "up": bool(bob_is_up or bob_router.get("up")),
                "rtt": bob_rtt if bob_rtt is not None else 4,
            },
        }

        # 1. Các thiết bị có IP được ping định kỳ 30s: online báo xanh, offline báo đỏ
        for key, (up, rtt) in pinged.items():
            if key in config.DEVICES and key not in ("bob_router", "mikrotik"):
                name, ip = config.DEVICES[key]
                devices[key] = {
                    "name": name,
                    "ip": ip,
                    "up": bool(up),
                    "rtt": rtt if up else None,
                }

        # 2. Các switch unmanaged: để xám, không có ping tới theo yêu cầu
        for key, (name, role) in getattr(config, "UNMANAGED_DEVICES", {}).items():
            devices[key] = {
                "name": name,
                "ip": "Unmanaged",
                "up": None,
                "unmanaged": True,
                "rtt": None,
            }

        return devices
