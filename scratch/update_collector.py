with open("netmon/collector.py", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add self._active_arp_bob = set() in __init__
old_init = """        self._prev = {}
        self._identity = None
        self._identity_bob = None"""

new_init = """        self._prev = {}
        self._identity = None
        self._identity_bob = None
        self._active_arp_bob = set()"""

assert old_init in code, "old_init not found"
code = code.replace(old_init, new_init, 1)

# 2. Add ARP query in _poll_router_bob
old_poll_bob = """            interfaces = {name: self._with_rates(f"bob_{name}", row, ts) for name, row in raw.items()}"""

new_poll_bob = """            # Đọc bảng ARP từ Router BOB để phát hiện trạng thái các Camera nội bộ
            arp_data = self._safe(self.snmp_bob, lambda c: c.walk("1.3.6.1.2.1.4.22.1.4")) or {}
            active_arp = set()
            for oid, val in arp_data.items():
                if val in (3, 4):
                    parts = oid.split(".")
                    active_arp.add(".".join(parts[-4:]))
            if active_arp:
                self._active_arp_bob = active_arp

            interfaces = {name: self._with_rates(f"bob_{name}", row, ts) for name, row in raw.items()}"""

assert old_poll_bob in code, "old_poll_bob not found"
code = code.replace(old_poll_bob, new_poll_bob, 1)

# 3. Pass active_arp_ips to _device_status
old_dev_call = """        # Cập nhật trạng thái router vào bảng thiết bị
        dev_map = self._device_status(router, bob_router, pinged, bob_is_up, bob_ping[1])"""

new_dev_call = """        # Cập nhật trạng thái router vào bảng thiết bị (kết hợp Ping + ARP active của Router)
        dev_map = self._device_status(router, bob_router, pinged, bob_is_up, bob_ping[1], active_arp_ips=self._active_arp_bob)"""

assert old_dev_call in code, "old_dev_call not found"
code = code.replace(old_dev_call, new_dev_call, 1)

# 4. Update _device_status method signature and implementation
old_dev_status = """    @staticmethod
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
                }"""

new_dev_status = """    @staticmethod
    def _device_status(router, bob_router, pinged, bob_is_up=True, bob_rtt=None, active_arp_ips=None):
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

        # 1. Các thiết bị có IP: kiểm tra bằng ICMP Ping / TCP probe HOẶC đối chiếu bảng Active ARP từ Router
        arp_set = active_arp_ips or set()
        for key, (up, rtt) in pinged.items():
            if key in config.DEVICES and key not in ("bob_router", "mikrotik"):
                name, ip = config.DEVICES[key]
                is_up = bool(up) or (ip in arp_set)
                devices[key] = {
                    "name": name,
                    "ip": ip,
                    "up": is_up,
                    "rtt": rtt if up else (5 if is_up else None),
                }"""

assert old_dev_status in code, "old_dev_status not found"
code = code.replace(old_dev_status, new_dev_status, 1)

with open("netmon/collector.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated netmon/collector.py successfully!")
