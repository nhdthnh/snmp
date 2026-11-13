"""Cấu hình tập trung cho NetMon.

Chứa cấu hình IP, SNMP, danh sách thiết bị và đường WAN.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "traffic.db"

HTTP_PORT = int(os.environ.get("NETMON_PORT", 8088))
POLL_INTERVAL = int(os.environ.get("NETMON_INTERVAL", 30))  # giây giữa 2 lần lấy mẫu
RETENTION_DAYS = int(os.environ.get("NETMON_RETENTION", 7))  # số ngày giữ lịch sử

# Router MikroTik HQ (Trụ sở chính)
ROUTER_IP = os.environ.get("NETMON_ROUTER_IP", "192.168.1.1")
# Router MikroTik BOB (Chi nhánh / Nhà máy - kết nối qua IPsec)
BOB_ROUTER_IP = os.environ.get("NETMON_BOB_ROUTER_IP", "192.168.4.1")
SNMP_COMMUNITY = os.environ.get("NETMON_SNMP_COMMUNITY", "monitoring")
SNMP_TIMEOUT = float(os.environ.get("NETMON_SNMP_TIMEOUT", 2.0))

# Thông tin dự phòng Router HQ (RB3011UiAS)
DEFAULT_ROUTER_INFO = {
    "model": "RouterOS RB3011UiAS",
    "version": "6.49.23",
    "firmware": "6.49.23",
    "board_ver": "6.48.6",
    "serial": "HCV08FEJ5X5",
    "software_id": "FBD5-UFHW",
    "cpu_mhz": 1400,
    "status": "Running",
    "poe_status": "Waiting",
}

# Thông tin Router Chi nhánh BOB (hAP ac²) kết nối IPsec với HQ
BOB_ROUTER_INFO = {
    "model": "RouterOS hAP ac² (RBD52G-5HacD2HnD)",
    "version": "6.49.23",
    "firmware": "6.49.23",
    "board_ver": "6.49.23",
    "serial": "BEEB0A56E59A",
    "software_id": "AYYA-TFTL",
    "cpu_mhz": 716,
    "status": "Running",
    "poe_status": "N/A",
    "ip": "192.168.4.1",
    "wan_ip": "113.161.45.93",
    "ipsec_peer": "113.161.75.195",
}

# (tên hiển thị, tên interface trên router)
WAN_LINES = [
    ("FPT", "ether1"),
    ("VNPT", "ether2"),
]

# Các interface chính cần theo dõi trên MikroTik HQ
DEFAULT_INTERFACES = [
    "ether1", "ether2", "ether3", "ether4", "ether5", "sfp1",
    "ether6", "ether7", "ether8", "ether9", "ether10",
    "pppoe-out1", "pppoe-out2", "BridgeVLAN", "VLAN10-LAN", "VLAN20-CAM", "VLAN30"
]

# Các interface chính cần theo dõi trên MikroTik BOB (hAP ac²)
BOB_INTERFACES = [
    "ether1", "ether2", "ether3", "ether4", "ether5",
    "wlan1", "wlan2", "bridge", "pppoe-out1"
]

# Thiết bị kiểm tra bằng ping định kỳ 30 giây: id -> (tên, IP).
# Bỏ qua các switch Unmanaged không có IP quản trị để tránh làm trễ vòng lặp.
DEVICES = {
    # HQ Devices (192.168.1.x)
    "mikrotik": ("Mikrotik RB3011UiAS (HQ)", ROUTER_IP),
    "core": ("SW Core Ruijie RG-ES224GC", "192.168.1.254"),
    "dvr_vt": ("DVR Vantech (eth4)", "192.168.1.101"),
    "dvr_dh": ("DVR Dahua (P.17)", "192.168.1.226"),
    "sql": ("Server SQL (P.15)", "192.168.1.57"),
    "nas": ("NAS DS923+ (P.23-24 BOND)", "192.168.1.119"),
    "cam": ("Camera C1-C16 (P.16)", "192.168.1.102"),
    "prn1": ("MP C4505EX (P.12)", "192.168.1.250"),
    "prn2": ("MP C5503 (P.13)", "192.168.1.252"),
    "wifi": ("SW WiFi 296 (eth9)", "192.168.0.1"),
    "ap": ("AP WIFI UniFi", "192.168.0.252"),

    # BOB Branch Devices (192.168.4.x - qua IPsec VPN)
    "isp_bob": ("ISP VNPT (BOB)", "113.161.45.93"),
    "bob_router": ("MikroTik hAP ac² (BOB)", BOB_ROUTER_IP),
    "bob_sw03": ("Sw03 Ruijie RG-ES210GS-P", "192.168.4.252"),
    "bob_sw02": ("Sw02 Hikvision PoE DS-3E1318P", "192.168.4.242"),
    "bob_sw04": ("Sw04 Hikvision PoE DS-3E1318P", "192.168.4.243"),
    "bob_nvr": ("NVR01 Hikvision", "192.168.4.253"),
    "bob_photo": ("Photocopy01", "192.168.4.249"),
    "bob_mcc": ("MCC01 Máy chấm công BOB", "192.168.4.248"),
    "bob_ap": ("AP01-AP05 (Reyee Wi-Fi 6)", "192.168.4.94"),
    "bob_c2_16": ("Camera C2-C16 (15 CAM)", "192.168.4.104"),
    "bob_c17_31": ("Camera C17-C31 (15 CAM)", "192.168.4.120"),
    "bob_c1": ("Camera C1", "192.168.4.143"),
}

# Các switch Unmanaged (không có IP quản lý, không ping tới, hiển thị màu xám trên sơ đồ)
UNMANAGED_DEVICES = {
    # Dãy switch tầng HQ
    "u1": ("TL-SG1024D Tầng 1 (P.22)", "Unmanaged"),
    "u2": ("TL-SG1024D_1 Tầng 2 (P.21)", "Unmanaged"),
    "u3": ("TL-SG1016D Tầng 3 (P.20)", "Unmanaged"),
    "u4": ("TL-SG1016D_1 Tầng 4 (P.19)", "Unmanaged"),
    "u5": ("TL-SG1005D Studio (P.18)", "Unmanaged"),
    "poe": ("SW POE HIKVISION (P.16)", "Unmanaged"),

    # Switch tầng & thiết bị thụ động BOB
    "bob_sw01": ("Sw01 TL-SG116", "Unmanaged"),
    "bob_sw05": ("Sw05 Switch OEM 8P", "Unmanaged"),
    "bob_pc": ("PC01-PC10", "Unmanaged"),
}
