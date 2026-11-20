"""Cấu hình tập trung cho NetMon.

Chứa cấu hình IP, SNMP, danh sách thiết bị và đường WAN.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Tự động nạp cấu hình từ file .env ở thư mục gốc (nếu có)
def _load_env_file():
    env_file = BASE_DIR / ".env"
    if env_file.is_file():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file)
        except ImportError:
            # Fallback thuần Python không cần thư viện bên ngoài
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env_file()

WEB_DIR = BASE_DIR / "web"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "traffic.db"

HTTP_PORT = int(os.environ.get("NETMON_PORT", 8088))
POLL_INTERVAL = int(os.environ.get("NETMON_INTERVAL", 30))  # giây giữa 2 lần lấy mẫu
RETENTION_DAYS = int(os.environ.get("NETMON_RETENTION", 7))  # số ngày giữ lịch sử

# ==============================================================================
# CẤU HÌNH AI PHÂN TÍCH LƯU LƯỢNG MẠNG (GEMINI / GEMMA)
# ==============================================================================
AI_RAW_KEYS = os.environ.get("GEMINI_API_KEYS", "")
if not AI_RAW_KEYS:
    try:
        from . import config_local
        AI_RAW_KEYS = getattr(config_local, "GEMINI_API_KEYS", "")
    except ImportError:
        try:
            import config_local
            AI_RAW_KEYS = getattr(config_local, "GEMINI_API_KEYS", "")
        except ImportError:
            pass

GEMINI_API_KEYS = [k.strip() for k in AI_RAW_KEYS.split(",") if k.strip()]
AI_PRIMARY_MODEL = os.environ.get("NETMON_AI_MODEL", "gemma-4-31b-it")
AI_FALLBACK_MODELS = ["gemma-4-26b-a4b-it", "gemini-2.5-flash", "gemini-flash-latest"]
AI_ANALYSIS_INTERVAL = int(os.environ.get("NETMON_AI_INTERVAL", 1800))  # 30 phút (1800 giây)
AI_ANALYSIS_FILE = DATA_DIR / "ai_analysis.json"


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
    "dvr_dh": ("DVR Dahua (Port 17)", "192.168.1.226"),
    "sql": ("Server SQL (P.15)", "192.168.1.57"),
    "nas": ("NAS DS923+ (P.23-24 BOND)", "192.168.1.119"),
    # 16 Camera IP PoE tại Trụ sở HQ (kết nối SW POE HIKVISION P.16)
    "cam_ph1": ("Phòng Họp 1", "192.168.1.107"),
    "cam_ph2": ("Phòng họp 2", "192.168.1.106"),
    "cam_bod": ("Hành lang BOD", "192.168.1.115"),
    "cam_hcns1": ("HCNS 1", "192.168.1.117"),
    "cam_hcns2": ("HCNS 2", "192.168.1.111"),
    "cam_in": ("In ấn", "192.168.1.113"),
    "cam_lt": ("Lễ tân", "192.168.1.116"),
    "cam_hlc": ("Hành lang chính", "192.168.1.108"),
    "cam_mkt1": ("MKT 1", "192.168.1.109"),
    "cam_mkt2": ("MKT 2", "192.168.1.103"),
    "cam_mkt3": ("MKT 3", "192.168.1.114"),
    "cam_kt": ("Kế toán", "192.168.1.102"),
    "cam_pan1": ("Pantry 1", "192.168.1.110"),
    "cam_pan2": ("Pantry 2", "192.168.1.112"),
    "cam_stu1": ("Studio 1", "192.168.1.105"),
    "cam_stu2": ("Studio 2", "192.168.1.104"),
    "prn1": ("MP C4505EX (HQ)", "192.168.1.250"),
    "prn2": ("MP C5503 (HQ)", "192.168.1.252"),
    "ap": ("AP WIFI UniFi", "192.168.0.252"),

    # BOB Branch Devices (192.168.4.x - qua IPsec VPN)
    "isp_bob": ("ISP VNPT (BOB)", "113.161.45.93"),
    "bob_router": ("MikroTik hAP ac² (BOB)", BOB_ROUTER_IP),
    "bob_sw03": ("Sw03 Ruijie RG-ES210GS-P", "192.168.4.252"),
    "bob_sw02": ("Sw02 Hikvision PoE DS-3E1318P", "192.168.4.242"),
    "bob_sw04": ("Sw04 Hikvision PoE DS-3E1318P", "192.168.4.243"),
    "bob_nvr": ("NVR01 Hikvision", "192.168.4.253"),
    "bob_photo": ("Photocopy01", "192.168.4.249"),
    "bob_mcc": ("Máy giám sát ra vào Hikvision (Wi-Fi)", "192.168.4.248"),
    "bob_ap": ("AP01-AP05 (Reyee Wi-Fi 6)", "192.168.4.94"),
    "bob_prn_brother": ("Máy in A4 Brother (Wi-Fi)", "192.168.4.92"),
    "bob_prn_xprinter": ("Máy in tem nhãn Xprinter (Wi-Fi)", "192.168.4.95"),
    # 32 Camera IP PoE tại Chi nhánh Nhà máy BOB (kết nối qua 3 Switch: Sw02, Sw04, Sw05)
    "bob_cam_01": ("D01 P.Làm việc (Cổng)", "192.168.4.101"),
    "bob_cam_02": ("D02 P.Làm việc 2", "192.168.4.131"),
    "bob_cam_03": ("D03 Phòng họp", "192.168.4.100"),
    "bob_cam_04": ("D04 HL Văn phòng", "192.168.4.103"),
    "bob_cam_05": ("D05 HL Xưởng", "192.168.4.102"),
    "bob_cam_06": ("D06 Cửa ra vào", "192.168.4.117"),
    "bob_cam_07": ("D07 P.Kiểm nghiệm", "192.168.4.107"),
    "bob_cam_08": ("D08 HL Kho 1", "192.168.4.126"),
    "bob_cam_09": ("D09 Kho Thành phẩm", "192.168.4.124"),
    "bob_cam_10": ("D10 Kho Nguyên liệu", "192.168.4.133"),
    "bob_cam_11": ("D11 Kho Bao bì", "192.168.4.137"),
    "bob_cam_12": ("D12 Khu Kỹ thuật", "192.168.4.109"),
    "bob_cam_13": ("D13 HL Kho 2", "192.168.4.122"),
    "bob_cam_14": ("D14 HL Thoát hiểm", "192.168.4.112"),
    "bob_cam_15": ("D15 Kho Dung môi", "192.168.4.118"),
    "bob_cam_16": ("D16 HL Sản xuất 1", "192.168.4.130"),
    "bob_cam_17": ("D17 HL Sản xuất 2", "192.168.4.114"),
    "bob_cam_18": ("D18 HL Sản xuất 3", "192.168.4.132"),
    "bob_cam_19": ("D19 Phòng IPC", "192.168.4.119"),
    "bob_cam_20": ("D20 Xử lý bao bì", "192.168.4.110"),
    "bob_cam_21": ("D21 Vệ sinh bao bì ngoài", "192.168.4.111"),
    "bob_cam_22": ("D22 P.Cân nguyên liệu", "192.168.4.108"),
    "bob_cam_23": ("D23 P.Pha hóa chất", "192.168.4.134"),
    "bob_cam_24": ("D24 P.Rửa dụng cụ", "192.168.4.113"),
    "bob_cam_25": ("D25 P.Pha chế 1", "192.168.4.123"),
    "bob_cam_26": ("D26 P.Pha chế 2", "192.168.4.136"),
    "bob_cam_27": ("D27 P.Lưu bán TP 1_1", "192.168.4.116"),
    "bob_cam_28": ("D28 P.Ủ bán TP 1_2", "192.168.4.121"),
    "bob_cam_29": ("D29 Phòng Dự phòng", "192.168.4.128"),
    "bob_cam_30": ("D30 Phòng Chiết rót", "192.168.4.115"),
    "bob_cam_31": ("D31 P.Đóng gói 2_1", "192.168.4.129"),
    "bob_cam_32": ("D32 P.Đóng gói 2_2", "192.168.4.127"),
}

# Các switch Unmanaged (không có IP quản lý, không ping tới, hiển thị màu xám trên sơ đồ)
UNMANAGED_DEVICES = {
    # Dãy switch tầng & switch wifi HQ (không quản trị)
    "wifi": ("SW WiFi 296 (eth9)", "Unmanaged"),
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
