"""Kiểm tra thiết bị còn sống bằng ICMP ping kết hợp TCP socket probe (Windows/Linux)."""
import platform
import re
import socket
import subprocess
import time

_IS_WINDOWS = platform.system() == "Windows"


def tcp_probe(ip, port=8291, timeout_s=1.2):
    """Thử kết nối TCP (Winbox 8291, HTTP 80, SSH 22) nếu ICMP bị chặn bởi tường lửa."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout_s)
    t0 = time.time()
    try:
        s.connect((ip, port))
        rtt = int((time.time() - t0) * 1000)
        s.close()
        return True, max(1, rtt)
    except Exception:
        try:
            s.close()
        except Exception:
            pass
        return False, None


def ping(ip, timeout_ms=1000):
    """Trả về (còn_sống, rtt_ms)."""
    # 1. Thử ICMP Ping trước
    if _IS_WINDOWS:
        cmd = ["ping", "-n", "1", "-w", str(timeout_ms), ip]
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    else:
        cmd = ["ping", "-c", "1", "-W", str(max(1, timeout_ms // 1000)), ip]
        flags = 0
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=3, creationflags=flags).stdout
        if "ttl=" in out.lower():
            match = re.search(r"(?:time|thời gian)\s*[=<]\s*(\d+)", out, re.I)
            return True, int(match.group(1)) if match else 1
    except Exception:
        pass

    # 2. Dự phòng TCP probe (hữu ích qua đường hầm IPsec khi RouterOS chặn ICMP từ xa)
    for port in (8291, 80, 443, 22):
        ok, rtt = tcp_probe(ip, port, timeout_s=timeout_ms / 1000.0)
        if ok:
            return True, rtt

    return False, None
