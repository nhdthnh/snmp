/**
 * NetMon - Sơ đồ mạng phân tầng doanh nghiệp (Vertical Spider / Dedicated Port Outlets)
 * Giao diện mở rộng toàn trang (Wide Panoramic Canvas) mô phỏng phần cứng thực tế 2D:
 * 1. Không ép gọn vào khung, có thanh cuộn ngang & dọc tự do duyệt sơ đồ.
 * 2. Đầy đủ 16 Camera IP PoE tại Trụ sở HQ có tên phòng ban & IP kiểm tra ping online thực tế.
 * 3. Kết nối trực tiếp 16 Camera về SW POE HIKVISION (16 Port P.16).
 * 4. Thẻ thiết bị Card Block phong cách thực tế:
 *    - Nhãn phân loại trên đầu (● Router tổng, ● Switch Core, ● Camera PoE, v.v.)
 *    - Hình ảnh mô phỏng chân thực 2D mặt trước thiết bị (chassis, cổng RJ45, đèn link, ăng-ten, thấu kính)
 *    - Tên thiết bị, Địa chỉ IP & Trạng thái Ping thông tức thời (● Online / ● Offline)
 * 5. Giữ nguyên 100% nguyên tắc đấu nối cáp và nhãn cổng giữa các switch!
 */
import { fmtBps, escapeHtml } from "../format.js";

// ViewBox cắt sát vào vùng có nội dung (bỏ lề trống) để khi Fit sơ đồ được phóng to tối đa
const VIEW_BOX_ALL = "270 0 2250 1990";
const VIEW_BOX_HQ = "400 0 2030 1010";
const VIEW_BOX_BOB = "270 1090 2250 900";

// --- DANH MỤC 32 CAMERA IP HIKVISION CHI NHÁNH NHÀ MÁY BOB (CHIA THEO 3 SWITCH) ---
const BOB_CAMERAS = {
  sw02: [
    { id: "bob_cam_02", ch: "D02", name: "P.Làm việc 2", ip: "192.168.4.131", shortIp: ".131" },
    { id: "bob_cam_03", ch: "D03", name: "Phòng họp", ip: "192.168.4.100", shortIp: ".100" },
    { id: "bob_cam_04", ch: "D04", name: "HL Văn phòng", ip: "192.168.4.103", shortIp: ".103" },
    { id: "bob_cam_05", ch: "D05", name: "HL Xưởng", ip: "192.168.4.102", shortIp: ".102" },
    { id: "bob_cam_06", ch: "D06", name: "Cửa ra vào", ip: "192.168.4.117", shortIp: ".117" },
    { id: "bob_cam_07", ch: "D07", name: "P.Kiểm nghiệm", ip: "192.168.4.107", shortIp: ".107" },
    { id: "bob_cam_08", ch: "D08", name: "HL Kho 1", ip: "192.168.4.126", shortIp: ".126" },
    { id: "bob_cam_09", ch: "D09", name: "Kho Thành phẩm", ip: "192.168.4.124", shortIp: ".124" },
    { id: "bob_cam_10", ch: "D10", name: "Kho N.liệu", ip: "192.168.4.133", shortIp: ".133" },
    { id: "bob_cam_11", ch: "D11", name: "Kho Bao bì", ip: "192.168.4.137", shortIp: ".137" },
    { id: "bob_cam_12", ch: "D12", name: "Khu Kỹ thuật", ip: "192.168.4.109", shortIp: ".109" },
    { id: "bob_cam_13", ch: "D13", name: "HL Kho 2", ip: "192.168.4.122", shortIp: ".122" },
    { id: "bob_cam_14", ch: "D14", name: "HL Thoát hiểm", ip: "192.168.4.112", shortIp: ".112" },
    { id: "bob_cam_15", ch: "D15", name: "Kho Dung môi", ip: "192.168.4.118", shortIp: ".118" },
    { id: "bob_cam_16", ch: "D16", name: "HL Sản xuất 1", ip: "192.168.4.130", shortIp: ".130" },
  ],
  sw04: [
    { id: "bob_cam_17", ch: "D17", name: "HL Sản xuất 2", ip: "192.168.4.114", shortIp: ".114" },
    { id: "bob_cam_18", ch: "D18", name: "HL Sản xuất 3", ip: "192.168.4.132", shortIp: ".132" },
    { id: "bob_cam_19", ch: "D19", name: "Phòng IPC", ip: "192.168.4.119", shortIp: ".119" },
    { id: "bob_cam_20", ch: "D20", name: "Xử lý bao bì", ip: "192.168.4.110", shortIp: ".110" },
    { id: "bob_cam_21", ch: "D21", name: "VS Bao bì ngoài", ip: "192.168.4.111", shortIp: ".111" },
    { id: "bob_cam_22", ch: "D22", name: "P.Cân N.liệu", ip: "192.168.4.108", shortIp: ".108" },
    { id: "bob_cam_23", ch: "D23", name: "P.Pha hóa chất", ip: "192.168.4.134", shortIp: ".134" },
    { id: "bob_cam_24", ch: "D24", name: "P.Rửa dụng cụ", ip: "192.168.4.113", shortIp: ".113" },
    { id: "bob_cam_25", ch: "D25", name: "P.Pha chế 1", ip: "192.168.4.123", shortIp: ".123" },
    { id: "bob_cam_26", ch: "D26", name: "P.Pha chế 2", ip: "192.168.4.136", shortIp: ".136" },
    { id: "bob_cam_27", ch: "D27", name: "P.Lưu bán TP", ip: "192.168.4.116", shortIp: ".116" },
    { id: "bob_cam_28", ch: "D28", name: "P.Ủ bán TP", ip: "192.168.4.121", shortIp: ".121" },
    { id: "bob_cam_29", ch: "D29", name: "Phòng Dự phòng", ip: "192.168.4.128", shortIp: ".128" },
    { id: "bob_cam_30", ch: "D30", name: "P.Chiết rót", ip: "192.168.4.115", shortIp: ".115" },
    { id: "bob_cam_31", ch: "D31", name: "P.Đóng gói 2_1", ip: "192.168.4.129", shortIp: ".129" },
  ],
  sw05: [
    { id: "bob_cam_01", ch: "D01", name: "P.Làm việc / Cổng", ip: "192.168.4.101", shortIp: ".101" },
    { id: "bob_cam_32", ch: "D32", name: "P.Đóng gói 2_2", ip: "192.168.4.127", shortIp: ".127" },
  ],
};

// --- TỌA ĐỘ VÀ THÔNG SỐ CÁC KHỐI THIẾT BỊ (EXPANDED PANORAMIC LAYOUT) ---
const NODES = [
  // ==========================================
  // KHU VỰC TRỤ SỞ CHÍNH HQ (192.168.1.x)
  // ==========================================
  // 1. WAN ISP HQ
  { id: "fpt", site: "hq", x: 1040, y: 105, w: 200, h: 72, label: "ISP FPT (WAN 1)", sub: "DHCP IP WAN (RB3011)", type: "wan", tag: "INTERNET WAN" },
  { id: "vnpt", site: "hq", x: 1320, y: 105, w: 200, h: 72, label: "ISP VNPT (WAN 2)", sub: "113.161.75.195 (RB3011)", type: "wan", tag: "INTERNET WAN" },

  // 2. Trục trung tâm HQ (Spine)
  { id: "mikrotik", site: "hq", x: 1180, y: 240, w: 280, h: 84, label: "Mikrotik RB3011UiAS", sub: "192.168.1.1 (Router tổng HQ)", type: "router", tag: "ROUTER TỔNG" },
  { id: "core", site: "hq", x: 1180, y: 580, w: 400, h: 295, label: "SW CORE Ruijie", sub: "192.168.1.254 (RG-ES224GC)", type: "core", ports: 24, isPoe: false, tag: "SWITCH CORE" },

  // 3. Cánh Trái HQ (Left Wing - Server, DVR & Switch tầng)
  { id: "dvr_vt", site: "hq", x: 550, y: 240, w: 220, h: 74, label: "DVR VANTECH", sub: "192.168.1.101 (eth4)", type: "nvr", tag: "ĐẦU GHI HÌNH" },
  { id: "dvr_dh", site: "hq", x: 550, y: 460, w: 220, h: 74, label: "DVR DAHUA", sub: "192.168.1.226 (Port 17)", type: "nvr", tag: "ĐẦU GHI HÌNH" },
  { id: "sql", site: "hq", x: 550, y: 550, w: 220, h: 74, label: "Server SQL", sub: "192.168.1.57 (P.15)", type: "server", tag: "MÁY CHỦ DATABASE" },
  { id: "u1", site: "hq", x: 550, y: 640, w: 220, h: 74, label: "TL-SG1024D T1", sub: "Unmanage Tầng 1 (P.22)", type: "switch", ports: 24, isPoe: false, tag: "SWITCH TẦNG 1" },
  { id: "u2", site: "hq", x: 550, y: 730, w: 220, h: 74, label: "TL-SG1024D_1 T2", sub: "Unmanage Tầng 2 (P.21)", type: "switch", ports: 24, isPoe: false, tag: "SWITCH TẦNG 2" },
  { id: "u3", site: "hq", x: 550, y: 820, w: 220, h: 74, label: "TL-SG1016D T3", sub: "Unmanage Tầng 3 (P.20)", type: "switch", ports: 16, isPoe: false, tag: "SWITCH TẦNG 3" },

  // 4. Cánh Phải HQ (Right Wing - Wi-Fi, Storage & PoE Switch)
  { id: "wifi", site: "hq", x: 1620, y: 240, w: 210, h: 74, label: "SW WIFI 296", sub: "VLAN 20 (eth9)", type: "switch", ports: 8, isPoe: false, tag: "SWITCH UNMANAGED" },
  { id: "ap", site: "hq", x: 1940, y: 240, w: 180, h: 74, label: "AP WIFI UniFi", sub: "AP01–05 (VLAN 20)", type: "ap", tag: "ACCESS POINT" },
  { id: "poe", site: "hq", x: 1600, y: 560, w: 220, h: 84, label: "SW POE HIKVISION", sub: "16 Port PoE (P.16)", type: "switch", ports: 16, isPoe: true, tag: "POE SWITCH ⚡" },
  { id: "nas", site: "hq", x: 1600, y: 680, w: 220, h: 74, label: "NAS DS923+", sub: "192.168.1.119 (BOND)", type: "nas", tag: "LƯU TRỮ NAS" },
  { id: "u4", site: "hq", x: 1600, y: 770, w: 220, h: 74, label: "TL-SG1016D_1 T4", sub: "Unmanage Tầng 4 (P.19)", type: "switch", ports: 16, isPoe: false, tag: "SWITCH TẦNG 4" },
  { id: "u5", site: "hq", x: 1600, y: 860, w: 220, h: 74, label: "TL-SG1005D Studio", sub: "Unmanage 5 Port (P.18)", type: "switch", ports: 5, isPoe: false, tag: "SWITCH TP-LINK 5P" },
  { id: "prn1", site: "hq", x: 1960, y: 920, w: 225, h: 74, label: "MP C4505EX", sub: "192.168.1.250 (Ping)", type: "printer", tag: "PHOTOCOPY A3 (PING)" },
  { id: "prn2", site: "hq", x: 2260, y: 920, w: 225, h: 74, label: "MP C5503", sub: "192.168.1.252 (Ping)", type: "printer", tag: "PHOTOCOPY A3 (PING)" },

  // 5. Toàn bộ 16 Camera IP PoE tại Trụ sở HQ (2 cột x 8 hàng kết nối SW POE Hikvision)
  // Cột 1 (Column 1 - x: 1960)
  { id: "cam_ph1", site: "hq", x: 1960, y: 350, w: 225, h: 64, label: "Phòng Họp 1", sub: "192.168.1.107 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_ph2", site: "hq", x: 1960, y: 420, w: 225, h: 64, label: "Phòng họp 2", sub: "192.168.1.106 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_bod", site: "hq", x: 1960, y: 490, w: 225, h: 64, label: "Hành lang BOD", sub: "192.168.1.115 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_hcns1", site: "hq", x: 1960, y: 560, w: 225, h: 64, label: "HCNS 1", sub: "192.168.1.117 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_hcns2", site: "hq", x: 1960, y: 630, w: 225, h: 64, label: "HCNS 2", sub: "192.168.1.111 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_in", site: "hq", x: 1960, y: 700, w: 225, h: 64, label: "In ấn", sub: "192.168.1.113 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_lt", site: "hq", x: 1960, y: 770, w: 225, h: 64, label: "Lễ tân", sub: "192.168.1.116 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_hlc", site: "hq", x: 1960, y: 840, w: 225, h: 64, label: "Hành lang chính", sub: "192.168.1.108 (PoE)", type: "cam", tag: "CAMERA POE" },

  // Cột 2 (Column 2 - x: 2280)
  { id: "cam_mkt1", site: "hq", x: 2280, y: 350, w: 225, h: 64, label: "MKT 1", sub: "192.168.1.109 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_mkt2", site: "hq", x: 2280, y: 420, w: 225, h: 64, label: "MKT 2", sub: "192.168.1.103 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_mkt3", site: "hq", x: 2280, y: 490, w: 225, h: 64, label: "MKT 3", sub: "192.168.1.114 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_kt", site: "hq", x: 2280, y: 560, w: 225, h: 64, label: "Kế toán", sub: "192.168.1.102 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_pan1", site: "hq", x: 2280, y: 630, w: 225, h: 64, label: "Pantry 1", sub: "192.168.1.110 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_pan2", site: "hq", x: 2280, y: 700, w: 225, h: 64, label: "Pantry 2", sub: "192.168.1.112 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_stu1", site: "hq", x: 2280, y: 770, w: 225, h: 64, label: "Studio 1", sub: "192.168.1.105 (PoE)", type: "cam", tag: "CAMERA POE" },
  { id: "cam_stu2", site: "hq", x: 2280, y: 840, w: 225, h: 64, label: "Studio 2", sub: "192.168.1.104 (PoE)", type: "cam", tag: "CAMERA POE" },

  // ==========================================
  // KHU VỰC CHI NHÁNH BOB - NHÀ MÁY (192.168.4.x)
  // ==========================================
  // 1. WAN ISP BOB
  { id: "isp_bob", site: "bob", x: 1180, y: 1180, w: 220, h: 72, label: "ISP VNPT (BOB)", sub: "113.161.45.93", type: "wan", tag: "INTERNET WAN" },

  // 2. Trục trung tâm BOB (Spine)
  { id: "bob_router", site: "bob", x: 1180, y: 1300, w: 280, h: 84, label: "Mikrotik hAP ac²", sub: "192.168.4.1 (Router BOB)", type: "router", tag: "ROUTER TỔNG" },
  { id: "bob_sw01", site: "bob", x: 1180, y: 1580, w: 400, h: 275, label: "Sw01 TL-SG116", sub: "16-Port Gigabit Switch", type: "core", ports: 16, isPoe: false, tag: "SWITCH BOB" },

  // 3. Cánh Trái BOB (Left Wing)
  { id: "bob_photo", site: "bob", x: 550, y: 1470, w: 220, h: 74, label: "Photocopy01", sub: "192.168.4.249 (Ping)", type: "printer", tag: "PHOTOCOPY A3" },
  { id: "bob_sw03", site: "bob", x: 680, y: 1570, w: 200, h: 74, label: "Sw03 Ruijie SW", sub: "192.168.4.252 (P.15)", type: "switch", ports: 8, isPoe: true, tag: "POE SWITCH ⚡" },
  { id: "bob_ap", site: "bob", x: 380, y: 1570, w: 170, h: 74, label: "AP01 – AP05", sub: "Reyee Wi-Fi 6 (P4-P8)", type: "ap", tag: "ACCESS POINT" },
  { id: "bob_pc", site: "bob", x: 550, y: 1670, w: 220, h: 74, label: "PC01 – PC10", sub: "Dãy 10 PC (P.2-P.11)", type: "pc", tag: "MÁY TRẠM PC" },
  { id: "bob_prn_brother", site: "bob", x: 430, y: 1870, w: 210, h: 74, label: "Máy in A4 Brother", sub: "192.168.4.92 (Wi-Fi)", type: "printer", tag: "MÁY IN MONO (PING)" },
  { id: "bob_prn_xprinter", site: "bob", x: 670, y: 1870, w: 210, h: 74, label: "Máy in tem Xprinter", sub: "192.168.4.95 (Wi-Fi)", type: "printer", tag: "MÁY IN TEM (PING)" },
  { id: "bob_mcc", site: "bob", x: 910, y: 1870, w: 215, h: 74, label: "GS ra vào Hikvision", sub: "192.168.4.248 (Wi-Fi)", type: "mcc", tag: "GIÁM SÁT RA VÀO" },

  // 4. Cánh Phải BOB (Right Wing - NVR, 3 Switch & Khối 32 Camera)
  { id: "bob_nvr", site: "bob", x: 1600, y: 1470, w: 220, h: 74, label: "NVR01 Hikvision", sub: "192.168.4.253 (P.16)", type: "nvr", tag: "ĐẦU GHI HÌNH" },
  { id: "bob_sw02", site: "bob", x: 1600, y: 1570, w: 220, h: 74, label: "Sw02 Hikvision PoE", sub: "192.168.4.242 (1318P)", type: "switch", ports: 16, isPoe: true, tag: "POE SWITCH ⚡" },
  { id: "bob_cam_grp_sw02", site: "bob", x: 2150, y: 1570, w: 660, h: 140, label: "Cụm 15 Camera PoE (Sw02)", sub: "15 Camera PoE (P.2 – P.16)", type: "bob_cam_cluster", group: "sw02", tag: "CỤM 15 CAM POE ⚡" },
  { id: "bob_sw04", site: "bob", x: 1600, y: 1735, w: 220, h: 74, label: "Sw04 Hikvision PoE", sub: "192.168.4.243 (1318P)", type: "switch", ports: 16, isPoe: true, tag: "POE SWITCH ⚡" },
  { id: "bob_cam_grp_sw04", site: "bob", x: 2150, y: 1735, w: 660, h: 140, label: "Cụm 15 Camera PoE (Sw04)", sub: "15 Camera PoE (P.1 – P.15)", type: "bob_cam_cluster", group: "sw04", tag: "CỤM 15 CAM POE ⚡" },
  { id: "bob_sw05", site: "bob", x: 1600, y: 1885, w: 220, h: 74, label: "Sw05 Switch OEM 8P", sub: "8-Port (No Brand)", type: "switch", ports: 8, isPoe: false, tag: "SWITCH OEM 8P" },
  { id: "bob_cam_grp_sw05", site: "bob", x: 2150, y: 1885, w: 660, h: 68, label: "Cụm 2 Camera (Sw05 OEM)", sub: "2 Camera (P.8 & P.7)", type: "bob_cam_cluster", group: "sw05", tag: "CỤM 2 CAMERA" },
];

// Mảng đường nối cáp mạng ĐỘC LẬP TỪNG CHÂN PORT (Vuông góc 100%, rõ ràng)
const ORTHO_LINKS = [
  // ==========================================
  // LIÊN KẾT TRỤ SỞ CHÍNH HQ
  // ==========================================
  // WAN FPT & VNPT -> MikroTik RB3011UiAS
  {
    from: "fpt", to: "mikrotik", ifName: "ether1",
    path: "M 1040 141 V 170 H 1120 V 198",
    pFrom: "WAN1", pFromPos: { x: 1040, y: 155 },
    pTo: "eth1", pToPos: { x: 1120, y: 185 },
    badgePos: { x: 940, y: 165 },
  },
  {
    from: "vnpt", to: "mikrotik", ifName: "ether2",
    path: "M 1320 141 V 170 H 1240 V 198",
    pFrom: "WAN2", pFromPos: { x: 1320, y: 155 },
    pTo: "eth2", pToPos: { x: 1240, y: 185 },
    badgePos: { x: 1420, y: 165 },
  },

  // TRUNK LINE: MikroTik RB3011UiAS <-> SW CORE Ruijie (ether5 <-> p2)
  {
    from: "mikrotik", to: "core", ifName: "ether5",
    path: "M 1180 282 V 435",
    pFrom: "ether5", pFromPos: { x: 1180, y: 300 },
    pTo: "p2", pToPos: { x: 1180, y: 410 },
    badgePos: { x: 1290, y: 360 },
  },

  // MikroTik Direct Router Links:
  // eth4 -> DVR VANTECH
  {
    from: "mikrotik", to: "dvr_vt", ifName: "ether4",
    path: "M 1040 240 H 660",
    pFrom: "eth4", pFromPos: { x: 1005, y: 240 },
    pTo: "eth4", pToPos: { x: 695, y: 240 },
  },
  // eth9 -> SW WIFI 296
  {
    from: "mikrotik", to: "wifi", ifName: "ether9",
    path: "M 1320 240 H 1515",
    pFrom: "ether9", pFromPos: { x: 1355, y: 240 },
    pTo: "",
  },
  // SW WIFI 296 -> AP WIFI (VLAN 20)
  {
    from: "wifi", to: "ap",
    path: "M 1725 240 H 1850",
    pTo: "VLAN 20", pToPos: { x: 1785, y: 240 },
  },

  // 5 ĐƯỜNG CÁP RIÊNG BIỆT TỪ CHÂN CORE SWITCH SANG CÁNH TRÁI:
  // 1. Port p17 -> DVR DAHUA (192.168.1.226)
  {
    from: "core", to: "dvr_dh",
    path: "M 980 460 H 660",
    pFrom: "p17", pFromPos: { x: 945, y: 460 },
  },
  // 2. Port p15 -> Server SQL
  {
    from: "core", to: "sql",
    path: "M 980 510 H 780 V 550 H 660",
    pFrom: "p15", pFromPos: { x: 945, y: 510 },
    pTo: "P.15", pToPos: { x: 695, y: 550 },
  },
  // 3. Port p22 -> TL-SG1024D (Tầng 1)
  {
    from: "core", to: "u1",
    path: "M 980 560 H 830 V 640 H 660",
    pFrom: "p22", pFromPos: { x: 945, y: 560 },
    pTo: "p24", pToPos: { x: 695, y: 640 },
  },
  // 4. Port p21 -> TL-SG1024D_1 (Tầng 2)
  {
    from: "core", to: "u2",
    path: "M 980 610 H 880 V 730 H 660",
    pFrom: "p21", pFromPos: { x: 945, y: 610 },
    pTo: "p24", pToPos: { x: 695, y: 730 },
  },
  // 5. Port p20 -> TL-SG1016D (Tầng 3)
  {
    from: "core", to: "u3",
    path: "M 980 660 H 930 V 820 H 660",
    pFrom: "p20", pFromPos: { x: 945, y: 660 },
    pTo: "p16", pToPos: { x: 695, y: 820 },
  },

  // 5 ĐƯỜNG CÁP RIÊNG BIỆT TỪ CHÂN CORE SWITCH SANG CÁNH PHẢI:
  // 1. Port p16 -> SW POE HIKVISION
  {
    from: "core", to: "poe",
    path: "M 1380 560 H 1490",
    pFrom: "p16", pFromPos: { x: 1415, y: 560 },
    pTo: "P.16", pToPos: { x: 1455, y: 560 },
  },
  // 2. Port p23-24 (BOND) -> NAS DS923+
  {
    from: "core", to: "nas",
    path: "M 1380 610 H 1430 V 680 H 1490",
    pFrom: "p23-24", pFromPos: { x: 1415, y: 610 },
    pTo: "BOND", pToPos: { x: 1460, y: 680 },
  },
  // 3. Port p19 -> TL-SG1016D_1 (Tầng 4)
  {
    from: "core", to: "u4",
    path: "M 1380 660 H 1410 V 770 H 1490",
    pFrom: "p19", pFromPos: { x: 1415, y: 660 },
    pTo: "p16", pToPos: { x: 1460, y: 770 },
  },
  // 4. Port p18 -> TL-SG1005D (Studio)
  {
    from: "core", to: "u5",
    path: "M 1380 710 H 1390 V 860 H 1490",
    pFrom: "p18", pFromPos: { x: 1415, y: 710 },
    pTo: "p1", pToPos: { x: 1460, y: 860 },
  },

  // LIÊN KẾT 16 CAMERA IP POE VỀ SW POE HIKVISION (P.16):
  // Trục chính phân phối từ SW POE (x: 1710, y: 560) sang Cột 1 và Cột 2
  // Cột 1:
  { from: "poe", to: "cam_ph1", path: "M 1710 560 H 1775 V 350 H 1847", pTo: "PoE", pToPos: { x: 1815, y: 350 } },
  { from: "poe", to: "cam_ph2", path: "M 1710 560 H 1775 V 420 H 1847", pTo: "PoE", pToPos: { x: 1815, y: 420 } },
  { from: "poe", to: "cam_bod", path: "M 1710 560 H 1775 V 490 H 1847", pTo: "PoE", pToPos: { x: 1815, y: 490 } },
  { from: "poe", to: "cam_hcns1", path: "M 1710 560 H 1847", pFrom: "PoE Bus", pFromPos: { x: 1750, y: 560 }, pTo: "PoE", pToPos: { x: 1815, y: 560 } },
  { from: "poe", to: "cam_hcns2", path: "M 1710 560 H 1775 V 630 H 1847", pTo: "PoE", pToPos: { x: 1815, y: 630 } },
  { from: "poe", to: "cam_in", path: "M 1710 560 H 1775 V 700 H 1847", pTo: "PoE", pToPos: { x: 1815, y: 700 } },
  { from: "poe", to: "cam_lt", path: "M 1710 560 H 1775 V 770 H 1847", pTo: "PoE", pToPos: { x: 1815, y: 770 } },
  { from: "poe", to: "cam_hlc", path: "M 1710 560 H 1775 V 840 H 1847", pTo: "PoE", pToPos: { x: 1815, y: 840 } },

  // Cột 2 (Từ Cột 1 sang Cột 2):
  { from: "cam_ph1", to: "cam_mkt1", path: "M 2073 350 H 2167", pTo: "PoE", pToPos: { x: 2135, y: 350 } },
  { from: "cam_ph2", to: "cam_mkt2", path: "M 2073 420 H 2167", pTo: "PoE", pToPos: { x: 2135, y: 420 } },
  { from: "cam_bod", to: "cam_mkt3", path: "M 2073 490 H 2167", pTo: "PoE", pToPos: { x: 2135, y: 490 } },
  { from: "cam_hcns1", to: "cam_kt", path: "M 2073 560 H 2167", pTo: "PoE", pToPos: { x: 2135, y: 560 } },
  { from: "cam_hcns2", to: "cam_pan1", path: "M 2073 630 H 2167", pTo: "PoE", pToPos: { x: 2135, y: 630 } },
  { from: "cam_in", to: "cam_pan2", path: "M 2073 700 H 2167", pTo: "PoE", pToPos: { x: 2135, y: 700 } },
  { from: "cam_lt", to: "cam_stu1", path: "M 2073 770 H 2167", pTo: "PoE", pToPos: { x: 2135, y: 770 } },
  { from: "cam_hlc", to: "cam_stu2", path: "M 2073 840 H 2167", pTo: "PoE", pToPos: { x: 2135, y: 840 } },

  // ==========================================
  // LIÊN KẾT CHI NHÁNH BOB (THEO SƠ ĐỒ THỰC TẾ)
  // ==========================================
  // 1. WAN BOB -> Mikrotik hAP ac² (ether1)
  {
    from: "isp_bob", to: "bob_router", ifName: "bob_ether1",
    path: "M 1180 1216 V 1258",
    pTo: "ether1", pToPos: { x: 1180, y: 1237 },
    badgePos: { x: 1320, y: 1237 },
  },

  // 2. TRUNK LINE: Mikrotik hAP ac² <-> Sw01 TL-SG116
  {
    from: "bob_router", to: "bob_sw01", ifName: "bob_ether2",
    path: "M 1180 1342 V 1443",
    pFrom: "ether2 (P.1)", pFromPos: { x: 1180, y: 1360 },
    pTo: "P.1 (Uplink)", pToPos: { x: 1180, y: 1425 },
    badgePos: { x: 1290, y: 1392 },
  },

  // CÁNH TRÁI BOB (Độc lập từng chân port):
  // Port P.15 -> Sw03 Ruijie SW (P.1)
  {
    from: "bob_sw01", to: "bob_sw03",
    path: "M 980 1520 H 830 V 1570 H 780",
    pFrom: "P.15", pFromPos: { x: 945, y: 1520 },
    pTo: "P.1", pToPos: { x: 805, y: 1570 },
  },
  // Sw03 -> AP01-AP05 (Wi-Fi 6)
  {
    from: "bob_sw03", to: "bob_ap",
    path: "M 580 1570 H 465",
    pTo: "P.4-P.8", pToPos: { x: 505, y: 1570 },
  },
  // Port P.2-P.11 -> Dãy PC01 - PC10
  {
    from: "bob_sw01", to: "bob_pc",
    path: "M 980 1570 H 880 V 1670 H 660",
    pFrom: "P.2-P.11", pFromPos: { x: 945, y: 1570 },
    pTo: "P.2-P.11", pToPos: { x: 695, y: 1670 },
  },

  // CÁNH PHẢI BOB (Độc lập từng chân port):
  // Port P.16 -> NVR01 Hikvision
  {
    from: "bob_sw01", to: "bob_nvr",
    path: "M 1380 1470 H 1490",
    pFrom: "P.16", pFromPos: { x: 1415, y: 1470 },
    pTo: "P.16", pToPos: { x: 1460, y: 1470 },
  },
  // Port G1 (P.1) -> Sw02 Hikvision PoE
  {
    from: "bob_sw01", to: "bob_sw02",
    path: "M 1380 1520 H 1430 V 1570 H 1490",
    pFrom: "G1", pFromPos: { x: 1415, y: 1520 },
    pTo: "G1", pToPos: { x: 1460, y: 1570 },
  },
  // Sw02 -> Cụm 15 Camera PoE (P.2-P.16)
  {
    from: "bob_sw02", to: "bob_cam_grp_sw02",
    path: "M 1710 1570 H 1820",
    pTo: "P.2-P.16", pToPos: { x: 1765, y: 1570 },
  },
  // Cascade Sw02 (G2) -> Sw04 (G1)
  {
    from: "bob_sw02", to: "bob_sw04",
    path: "M 1600 1607 V 1698",
    pTo: "G2 ⟷ G1", pToPos: { x: 1600, y: 1652 },
  },
  // Sw04 -> Cụm 15 Camera PoE (P.1-P.15)
  {
    from: "bob_sw04", to: "bob_cam_grp_sw04",
    path: "M 1710 1735 H 1820",
    pTo: "P.1-P.15", pToPos: { x: 1765, y: 1735 },
  },
  // Cascade Sw04 (G2) -> Sw05 (G1)
  {
    from: "bob_sw04", to: "bob_sw05",
    path: "M 1600 1772 V 1848",
    pTo: "G2 ⟷ G1", pToPos: { x: 1600, y: 1810 },
  },
  // Sw05 -> Cụm 2 Camera (P.8)
  {
    from: "bob_sw05", to: "bob_cam_grp_sw05",
    path: "M 1710 1885 H 1820",
    pTo: "P.8", pToPos: { x: 1765, y: 1885 },
  },
];

let activeSiteFilter = "hq";  // "all" | "hq" | "bob"  (mặc định HQ: tỉ lệ ngang, Fit ra chữ to dễ đọc)
let currentZoom = 1.0;
let fitMode = true;            // tự Fit khi mở / đổi khu vực / resize / toàn màn hình; zoom tay hay 100% thì tắt
let fitListenersBound = false;

export const TopologyRow = {
  render(status) {
    const svg = document.getElementById("topology-svg");
    if (!svg) return;

    const ifaces = status.interfaces || {};
    const bobIfaces = status.routers?.bob?.interfaces || {};
    const devices = status.devices || {};
    const ipsec = status.ipsec || { up: true, rtt: 3.8 };

    const getNodeState = node => {
      // 1. Kiểm tra trạng thái ping backend
      const dev = devices[node.id];
      if (dev) {
        if (dev.unmanaged) return "static";
        if (dev.up === true) return "up";
        if (dev.up === false) return "down";
      }

      // Cụm Camera BOB: Đánh giá theo trạng thái các camera con
      if (node.type === "bob_cam_cluster") {
        const cams = BOB_CAMERAS[node.group] || [];
        const hasUp = cams.some(c => devices[c.id]?.up === true);
        return hasUp ? "up" : "down";
      }

      // 2. Dãy switch không quản lý (Unmanaged: xám, không ping)
      const unmanagedList = ["wifi", "u1", "u2", "u3", "u4", "u5", "poe", "bob_sw01", "bob_sw05", "bob_pc"];
      if (unmanagedList.includes(node.id)) {
        return "static";
      }

      // 3. Đường WAN
      if (node.id === "fpt") {
        return (ifaces.ether1 && ifaces.ether1.up) || (devices.fpt && devices.fpt.up) ? "up" : "down";
      }
      if (node.id === "vnpt") {
        return (ifaces.ether2 && ifaces.ether2.up) || (devices.vnpt && devices.vnpt.up) ? "up" : "down";
      }
      if (node.id === "isp_bob") {
        const d = devices.isp_bob;
        if (d && d.up !== undefined) return d.up ? "up" : "down";
        return (bobIfaces.ether1 && bobIfaces.ether1.up) || (bobIfaces["pppoe-out1"] && bobIfaces["pppoe-out1"].up) ? "up" : "down";
      }

      // 4. Routers
      if (node.id === "mikrotik") {
        return (status.router && status.router.up) || (devices.mikrotik && devices.mikrotik.up) ? "up" : "down";
      }
      if (node.id === "bob_router") {
        return (status.routers?.bob?.router?.up) || (devices.bob_router && devices.bob_router.up) ? "up" : "down";
      }

      return "static";
    };

    const nodeMap = Object.fromEntries(
      NODES.map(n => [n.id, { ...n, state: getNodeState(n) }])
    );

    // SVG Defs, bộ lọc đổ bóng & màu sắc tăng cường độ tương phản
    let svgDefs = `
      <defs>
        <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4.5" flood-color="#4ade80" flood-opacity="0.85"/>
        </filter>
        <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="5.0" flood-color="#ef4444" flood-opacity="0.9"/>
        </filter>
        <filter id="glow-purple" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="5.5" flood-color="#c084fc" flood-opacity="0.9"/>
        </filter>
        <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4.0" flood-color="#38bdf8" flood-opacity="0.8"/>
        </filter>
        <filter id="glow-poe" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#f59e0b" flood-opacity="0.95"/>
        </filter>
        <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
        <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.9"/>
        </filter>

        <linearGradient id="grad-card-up" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#192438"/>
          <stop offset="100%" stop-color="#0c1322"/>
        </linearGradient>
        <linearGradient id="grad-card-static" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#141c2b"/>
          <stop offset="100%" stop-color="#090e18"/>
        </linearGradient>
        <linearGradient id="grad-card-down" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b0f15"/>
          <stop offset="100%" stop-color="#1a0609"/>
        </linearGradient>
        <linearGradient id="grad-ipsec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#a855f7"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
    `;

    // 0. Tiêu đề sơ đồ & Phân vùng mở rộng (Không đóng khung cứng)
    let svgHeader = `
      <!-- Banner Tiêu đề Tổng -->
      <g transform="translate(1180, 24)" text-anchor="middle">
        <rect x="-380" y="-18" width="760" height="36" rx="8" fill="#0f172a" stroke="rgba(255,255,255,0.18)" stroke-width="1.4" filter="url(#card-shadow)"/>
        <text y="5" font-size="15" font-weight="800" fill="#f8fafc" letter-spacing="1.5">SƠ ĐỒ THIẾT BỊ MẠNG THỰC TẾ DOANH NGHIỆP CÔNG TY TNHH OQR</text>
      </g>

      <!-- Dải phân định Trụ sở HQ -->
      <g transform="translate(1180, 48)" text-anchor="middle">
        <text y="14" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="2">─── KHU VỰC TRỤ SỞ CHÍNH HQ (Subnet 192.168.1.0/24 & 192.168.0.0/24) ───</text>
      </g>

      <!-- Dải phân định Chi nhánh BOB -->
      <g transform="translate(1180, 1105)" text-anchor="middle">
        <text y="14" font-size="12" font-weight="800" fill="#c084fc" letter-spacing="2">─── KHU VỰC CHI NHÁNH BOB - NHÀ MÁY (Subnet 192.168.4.0/24) ───</text>
      </g>
    `;

    // 1. Dây cáp mạng trực giao ĐỘC LẬP (Orthogonal Links)
    let svgLinks = "";
    let svgPortBadges = "";
    let svgTrafficBadges = "";

    ORTHO_LINKS.forEach(link => {
      const a = nodeMap[link.from];
      const b = nodeMap[link.to];
      if (!a || !b) return;

      if (activeSiteFilter === "hq" && (a.site === "bob" || b.site === "bob")) return;
      if (activeSiteFilter === "bob" && (a.site === "hq" && b.site === "hq")) return;

      const isDown = a.state === "down" || b.state === "down";
      const isWan = a.type === "wan" || b.type === "wan";
      const lineClass = `topo-wire ${isWan ? "topo-wire-wan" : ""} ${isDown ? "topo-wire-down" : ""}`;

      svgLinks += `<path d="${link.path}" class="${lineClass}"/>`;

      if (link.pFrom && link.pFromPos) {
        svgPortBadges += renderPortTag(link.pFromPos.x, link.pFromPos.y, link.pFrom, "#38bdf8");
      }
      if (link.pTo && link.pToPos) {
        svgPortBadges += renderPortTag(link.pToPos.x, link.pToPos.y, link.pTo, "#f8fafc");
      }

      if (link.ifName && link.badgePos) {
        let rxStr = "0 bps", txStr = "0 bps";
        if (link.ifName.startsWith("bob_")) {
          const rawName = link.ifName.replace("bob_", "");
          const bi = bobIfaces[rawName] || (rawName === "ether1" ? bobIfaces["pppoe-out1"] : null) || {};
          const fallbackRx = rawName === "ether1" ? 6515000 : rawName === "ether2" ? 6214000 : 0;
          const fallbackTx = rawName === "ether1" ? 34741000 : rawName === "ether2" ? 33723000 : 0;
          rxStr = fmtBps(bi.rx_bps ?? fallbackRx);
          txStr = fmtBps(bi.tx_bps ?? fallbackTx);
        } else if (ifaces[link.ifName]) {
          const i = ifaces[link.ifName];
          rxStr = fmtBps(i.rx_bps || 0);
          txStr = fmtBps(i.tx_bps || 0);
        }
        svgTrafficBadges += renderTrafficPill(link.badgePos.x, link.badgePos.y, rxStr, txStr);
      }
    });

    // 2. Đường hầm IPsec Site-to-Site VPN đặc biệt nối 2 Router (HQ ⟷ BOB)
    let svgIpsec = "";
    if (activeSiteFilter === "all") {
      const tunnelY = 1070;
      svgIpsec = `
        <g transform="translate(1180, ${tunnelY})" filter="url(#badge-shadow)">
          <rect x="-390" y="-25" width="780" height="50" rx="25" fill="#0b0f19" stroke="#a855f7" stroke-width="2.2"/>
          <line x1="-390" y1="0" x2="-310" y2="0" stroke="url(#grad-ipsec)" stroke-width="3" stroke-dasharray="6 4" class="topo-ipsec-line"/>
          <line x1="310" y1="0" x2="390" y2="0" stroke="url(#grad-ipsec)" stroke-width="3" stroke-dasharray="6 4" class="topo-ipsec-line"/>
          
          <circle cx="-275" cy="0" r="12" fill="#a855f7" filter="url(#glow-purple)"/>
          <text x="-275" y="4.5" text-anchor="middle" font-size="13" fill="#ffffff">🔒</text>
          
          <text x="-245" y="-3" font-size="13" font-weight="800" fill="#f8fafc">
            IPsec Site-to-Site VPN Tunnel: <tspan fill="#38bdf8">192.168.1.0/24 (HQ)</tspan> ⟷ <tspan fill="#e879f9">192.168.4.0/24 (BOB)</tspan>
          </text>
          <text x="-245" y="14" font-size="10.5" font-family="ui-monospace, monospace" font-weight="600" fill="#cbd5e1">
            IKEv2 · AES-256 · SHA256 · Peer: 113.161.45.93 · RTT ${ipsec.rtt}ms · Trạng thái: <tspan fill="#4ade80">ONLINE</tspan>
          </text>
        </g>
      `;
    }

    // 3. Các thẻ thiết bị Card Block mô phỏng thực tế
    let svgNodes = Object.values(nodeMap).map(n => {
      if (activeSiteFilter === "hq" && n.site === "bob") return "";
      if (activeSiteFilter === "bob" && n.site === "hq") return "";

      const isUp = n.state === "up";
      const isDown = n.state === "down";
      const isStatic = n.state === "static";

      const dev = devices[n.id];
      const rttVal = dev?.rtt;

      let dotColor = "#64748b";
      let dotGlow = "";
      let gradFill = "url(#grad-card-static)";
      let strokeColor = "rgba(100, 116, 139, 0.4)";
      let titleColor = "#e2e8f0";
      let statusText = "● Unmanaged";
      let statusColor = "#94a3b8";

      if (isUp) {
        dotColor = "#22c55e";
        dotGlow = 'filter="url(#glow-green)"';
        gradFill = "url(#grad-card-up)";
        strokeColor = "rgba(34, 197, 94, 0.75)";
        titleColor = "#ffffff";
        statusText = rttVal != null ? `● Ping thông ${rttVal}ms` : `● Online (Link up)`;
        statusColor = "#4ade80";
      } else if (isDown) {
        dotColor = "#ef4444";
        dotGlow = 'filter="url(#glow-red)"';
        gradFill = "url(#grad-card-down)";
        strokeColor = "rgba(239, 68, 68, 0.9)";
        titleColor = "#fca5a5";
        statusText = "● Mất kết nối (Offline)";
        statusColor = "#ef4444";
      } else {
        dotColor = "#94a3b8";
        gradFill = "url(#grad-card-static)";
        strokeColor = "rgba(148, 163, 184, 0.35)";
        titleColor = "#cbd5e1";
        statusText = "● Switch Unmanaged";
        statusColor = "#64748b";
      }

      // Xây dựng nhãn trạng thái góc phải trên cùng (Status Pill / LED) - KHÔNG ĐÈ CHỮ VÀO NỘI DUNG
      let rightStatusSvg = "";
      if (n.type === "core") {
        rightStatusSvg = `<circle cx="${n.w - 14}" cy="13" r="3.5" fill="${dotColor}" ${dotGlow}/>`;
      } else if (n.isPoe) {
        // Thiết bị PoE: Huy hiệu PoE ⚡ góc phải và số ping RTT (nếu có ping)
        rightStatusSvg = `
          ${rttVal != null ? `
            <text x="${n.w - 58}" y="15" text-anchor="end" font-size="9" font-family="ui-monospace, monospace" font-weight="800" fill="#4ade80">${rttVal}ms</text>
          ` : ""}
          <g transform="translate(${n.w - 52}, 5)" filter="url(#glow-poe)">
            <rect width="42" height="15" rx="3" fill="rgba(245, 158, 11, 0.22)" stroke="#f59e0b" stroke-width="1"/>
            <path d="M 6.5 2.5 L 3.5 8 L 6.5 8 L 4.5 12.5 L 9.5 7 L 6.5 7 Z" fill="#fbbf24"/>
            <text x="12" y="10.5" font-size="7.5" font-weight="900" fill="#fef08a">PoE ⚡</text>
          </g>
        `;
      } else if (isUp) {
        const pingStr = rttVal != null ? `${rttVal}ms` : "ONLINE";
        rightStatusSvg = `
          <text x="${n.w - 22}" y="15" text-anchor="end" font-size="9" font-family="ui-monospace, monospace" font-weight="800" fill="#4ade80">${pingStr}</text>
          <circle cx="${n.w - 13}" cy="12.5" r="3.5" fill="#22c55e" filter="url(#glow-green)"/>
        `;
      } else if (isDown) {
        rightStatusSvg = `
          <text x="${n.w - 22}" y="15" text-anchor="end" font-size="8.5" font-weight="800" fill="#ef4444">OFFLINE</text>
          <circle cx="${n.w - 13}" cy="12.5" r="3.5" fill="#ef4444" filter="url(#glow-red)"/>
        `;
      } else {
        rightStatusSvg = `
          <text x="${n.w - 20}" y="15" text-anchor="end" font-size="8" font-weight="700" fill="#64748b">UNMANAGED</text>
          <circle cx="${n.w - 12}" cy="12.5" r="3" fill="#64748b"/>
        `;
      }

      // Render nội dung phần cứng thực tế bên trong thẻ Card
      let innerContent = "";

      if (n.type === "core") {
        innerContent = renderCoreCentralCard(n, isUp, isDown, isStatic);
      } else if (n.type === "bob_cam_cluster") {
        innerContent = renderBobCamClusterCard(n, devices);
      } else if (n.type === "router") {
        innerContent = renderRouterCard(n);
      } else if (n.type === "switch") {
        innerContent = renderSwitchCard(n, isUp, isDown);
      } else if (n.type === "cam") {
        innerContent = renderCamCard(n);
      } else if (n.type === "server") {
        innerContent = renderServerCard(n);
      } else if (n.type === "nas") {
        innerContent = renderNasCard(n);
      } else if (n.type === "nvr") {
        innerContent = renderNvrCard(n);
      } else if (n.type === "ap") {
        innerContent = renderApCard(n);
      } else if (n.type === "printer") {
        innerContent = renderPrinterCard(n);
      } else if (n.type === "pc") {
        innerContent = renderPcCard(n);
      } else if (n.type === "mcc") {
        innerContent = renderMccCard(n);
      } else if (n.type === "wan") {
        innerContent = renderWanCard(n);
      }

      if (n.type === "bob_cam_cluster") {
        return `
          <g class="topo-device ${n.state}" transform="translate(${n.x - n.w / 2},${n.y - n.h / 2})" data-id="${n.id}">
            <rect width="${n.w}" height="${n.h}" rx="8" fill="${gradFill}" stroke="${strokeColor}" stroke-width="${isDown ? 2.0 : 1.3}" filter="url(#card-shadow)" class="device-box"/>
            ${innerContent}
          </g>
        `;
      }

      return `
        <g class="topo-device ${n.state}" transform="translate(${n.x - n.w / 2},${n.y - n.h / 2})" data-id="${n.id}">
          <!-- Nền thẻ Card Block với viền bo tròn sắc nét -->
          <rect width="${n.w}" height="${n.h}" rx="10" fill="${gradFill}" stroke="${strokeColor}" stroke-width="${isDown ? 2.0 : 1.4}" filter="url(#card-shadow)" class="device-box"/>
          
          <!-- Nhãn loại thiết bị trên góc trái -->
          <text x="14" y="15" font-size="8.5" font-family="ui-monospace, monospace" font-weight="800" fill="${n.type === 'core' ? '#38bdf8' : n.isPoe ? '#f59e0b' : '#94a3b8'}" letter-spacing="0.5">
            ● ${n.tag || "DEVICE"}
          </text>

          <!-- Trạng thái Online / RTT / Offline trên góc phải -->
          ${rightStatusSvg}

          <!-- Nội dung thực tế -->
          ${innerContent}
        </g>
      `;
    }).join("");

    // Khung mờ bán trong suốt tổng hợp 32 Camera Nhà máy BOB ("đóng khung mờ mờ lại")
    let svgBobCamBackdrop = "";
    if (activeSiteFilter !== "hq") {
      const totalBobCamOnline = Object.keys(devices).filter(
        k => k.startsWith("bob_cam_") && devices[k]?.up === true
      ).length;

      svgBobCamBackdrop = `
        <!-- Khung mờ tổng hợp khu vực 32 Camera Nhà máy BOB (Translucent Group Backdrop) -->
        <g class="bob-cam-backdrop-zone" filter="url(#card-shadow)">
          <rect x="1800" y="1485" width="700" height="485" rx="14" 
            fill="#060c18" fill-opacity="0.82" 
            stroke="#38bdf8" stroke-width="1.6" stroke-dasharray="6 4" stroke-opacity="0.4"/>
          
          <!-- Tiêu đề cụm 32 camera trên thanh đầu khung -->
          <g transform="translate(1820, 1502)">
            <text x="0" y="7" font-size="12.5" font-weight="800" fill="#f8fafc" letter-spacing="0.5">
              📷 CỤM 32 CAMERA IP HIKVISION · CHI NHÁNH NHÀ MÁY BOB
            </text>
            <text x="0" y="23" font-size="9.5" font-weight="600" fill="#94a3b8">
              Tổng hợp chia 3 Switch (Sw02 PoE, Sw04 PoE, Sw05 OEM) ⟷ Đầu ghi NVR01 (192.168.4.253)
            </text>
          </g>
          
          <!-- Huy hiệu tổng số camera Online trên góc phải -->
          <g transform="translate(2480, 1500)">
            <rect x="-120" y="-3" width="120" height="24" rx="12" fill="#0f172a" stroke="${totalBobCamOnline > 0 ? '#22c55e' : '#ef4444'}" stroke-width="1.2"/>
            <circle cx="-105" cy="9" r="3.5" fill="${totalBobCamOnline > 0 ? '#22c55e' : '#ef4444'}" ${totalBobCamOnline > 0 ? 'filter="url(#glow-green)"' : ''}/>
            <text x="-94" y="12.5" font-size="10" font-weight="800" fill="${totalBobCamOnline > 0 ? '#4ade80' : '#ef4444'}">
              ${totalBobCamOnline}/32 Online
            </text>
          </g>
        </g>
      `;
    }

    // Điều chỉnh viewBox phù hợp chế độ lọc
    let targetViewBox = VIEW_BOX_ALL;
    if (activeSiteFilter === "hq") {
      targetViewBox = VIEW_BOX_HQ;
    } else if (activeSiteFilter === "bob") {
      targetViewBox = VIEW_BOX_BOB;
    }

    svg.setAttribute("viewBox", targetViewBox);
    svg.innerHTML = svgDefs + svgHeader + svgBobCamBackdrop + svgLinks + svgIpsec + svgPortBadges + svgTrafficBadges + svgNodes;

    setupSiteFilterButtons();
    const wrap = document.querySelector(".topo-wrap");
    if (wrap) setupDragPan(wrap);
    bindFitListeners();
    if (fitMode && wrap) requestAnimationFrame(() => fitToView(svg, wrap));
  },

  load(range, status) {
    this.render(status);
    setupSiteFilterButtons();
    const wrap = document.querySelector(".topo-wrap");
    if (wrap) setupDragPan(wrap);
  },
};

/**
 * Thẻ cụm Camera phân bổ theo Switch tại Nhà máy BOB (15 Cam Sw02, 15 Cam Sw04, 2 Cam Sw05)
 */
function renderBobCamClusterCard(n, devices) {
  const cams = BOB_CAMERAS[n.group] || [];
  const onlineCount = cams.filter(c => devices[c.id]?.up === true).length;
  const isAllUp = onlineCount === cams.length;
  const isPartUp = onlineCount > 0;
  const countColor = isAllUp ? "#4ade80" : isPartUp ? "#facc15" : "#ef4444";
  const switchPortInfo = n.group === "sw02" 
    ? "⚡ CỤM 15 CAMERA POE · NỐI SWITCH SW02 (P.2 – P.16)" 
    : n.group === "sw04" 
    ? "⚡ CỤM 15 CAMERA POE · NỐI SWITCH SW04 (P.1 – P.15)" 
    : "⚡ CỤM 2 CAMERA · NỐI SWITCH SW05 OEM (P.8 & P.7)";

  if (n.group === "sw05") {
    return `
      <!-- Header Cụm -->
      <text x="14" y="16" font-size="10.5" font-weight="800" fill="#f8fafc" letter-spacing="0.3">${switchPortInfo}</text>
      <text x="${n.w - 14}" y="16" text-anchor="end" font-size="9.5" font-weight="800" fill="${countColor}">● ${onlineCount}/${cams.length} Online</text>

      <g transform="translate(12, 26)">
        ${cams.map((cam, idx) => {
          const itemX = idx * 320;
          const dev = devices[cam.id];
          const isUp = dev?.up === true;
          const rtt = dev?.rtt;
          const dotCol = isUp ? "#22c55e" : "#ef4444";
          const glow = isUp ? 'filter="url(#glow-green)"' : '';
          const ipCol = isUp ? "#38bdf8" : "#94a3b8";

          return `
            <g transform="translate(${itemX}, 0)">
              <rect width="310" height="28" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" stroke-width="0.8"/>
              <circle cx="12" cy="14" r="3.2" fill="${dotCol}" ${glow}/>
              <text x="22" y="17.5" font-size="10.5" font-weight="700" fill="${isUp ? '#ffffff' : '#cbd5e1'}">${cam.ch}: ${cam.name}</text>
              <text x="300" y="17.5" text-anchor="end" font-size="9.5" font-family="ui-monospace, monospace" font-weight="700" fill="${ipCol}">${cam.ip}${rtt ? ` · ${rtt}ms` : ""}</text>
            </g>
          `;
        }).join("")}
      </g>
    `;
  }

  // 15 camera cho Sw02 và Sw04: 3 cột x 5 hàng gọn gàng, rõ ràng
  const itemsSvg = cams.map((cam, idx) => {
    const col = Math.floor(idx / 5);
    const row = idx % 5;
    const itemX = 12 + col * 215;
    const itemY = 26 + row * 21;
    const dev = devices[cam.id];
    const isUp = dev?.up === true;
    const rtt = dev?.rtt;
    const dotCol = isUp ? "#22c55e" : "#ef4444";
    const glow = isUp ? 'filter="url(#glow-green)"' : '';
    const ipCol = isUp ? "#38bdf8" : "#94a3b8";

    return `
      <g transform="translate(${itemX}, ${itemY})">
        <rect width="207" height="18" rx="3.5" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" stroke-width="0.6"/>
        <circle cx="9" cy="9" r="2.8" fill="${dotCol}" ${glow}/>
        <text x="17" y="12.5" font-size="8.8" font-weight="700" fill="${isUp ? '#ffffff' : '#cbd5e1'}">${cam.ch}: ${cam.name}</text>
        <text x="201" y="12.5" text-anchor="end" font-size="8.2" font-family="ui-monospace, monospace" font-weight="700" fill="${ipCol}">${cam.shortIp}${rtt ? ` · ${rtt}ms` : ""}</text>
      </g>
    `;
  }).join("");

  return `
    <!-- Header Cụm -->
    <text x="14" y="16" font-size="10.5" font-weight="800" fill="#f8fafc" letter-spacing="0.3">${switchPortInfo}</text>
    <text x="${n.w - 14}" y="16" text-anchor="end" font-size="9.5" font-weight="800" fill="${countColor}">● ${onlineCount}/${cams.length} Online</text>

    ${itemsSvg}
  `;
}

/**
 * 1. Khối Switch Trung tâm (Core Ruijie RG-ES224GC & Central Sw01 TL-SG116)
 */
function renderCoreCentralCard(n, isUp, isDown, isStatic) {
  const isCore = n.id === "core";
  const portsCount = isCore ? 24 : 16;
  const strokeAccent = isCore ? "rgba(56, 189, 248, 0.35)" : "rgba(168, 85, 247, 0.35)";
  const tagColor = isCore ? "#38bdf8" : "#c084fc";
  const modelName = isCore ? "Ruijie Reyee RG-ES224GC (24G + 2 SFP)" : "TP-Link TL-SG116 (16-Port Gigabit Switch)";

  return `
    <text x="14" y="30" font-size="13" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="14" y="44" font-size="10.5" font-family="ui-monospace, monospace" font-weight="600" fill="#93c5fd">${escapeHtml(n.sub)}</text>

    <!-- Mặt trước chassis 1U 2D Vector (Chiều cao 52px phân tách riêng dòng chữ và dãy cổng) -->
    <g transform="translate(14, 52)">
      <rect width="372" height="52" rx="4" fill="#080d17" stroke="#334155" stroke-width="1.1"/>
      <!-- Tai bắt rack trái & phải -->
      <rect x="0" y="0" width="9" height="52" rx="1.5" fill="#1e293b"/>
      <circle cx="4.5" cy="11" r="1.6" fill="#0f172a" stroke="#64748b" stroke-width="0.6"/>
      <circle cx="4.5" cy="41" r="1.6" fill="#0f172a" stroke="#64748b" stroke-width="0.6"/>
      <rect x="363" y="0" width="9" height="52" rx="1.5" fill="#1e293b"/>
      <circle cx="367.5" cy="11" r="1.6" fill="#0f172a" stroke="#64748b" stroke-width="0.6"/>
      <circle cx="367.5" cy="41" r="1.6" fill="#0f172a" stroke="#64748b" stroke-width="0.6"/>

      <!-- Hàng 1: Tên thiết bị & Đèn trạng thái (y = 14) -->
      <text x="14" y="14" font-size="8.5" font-weight="800" fill="#cbd5e1">${modelName}</text>
      <circle cx="295" cy="11.5" r="1.6" fill="#22c55e"/><text x="302" y="14" font-size="7.5" fill="#64748b">PWR</text>
      <circle cx="330" cy="11.5" r="1.6" fill="#38bdf8"/><text x="337" y="14" font-size="7.5" fill="#64748b">SYS</text>

      <!-- Hàng 2: Cụm cổng RJ45 (bắt đầu tại y = 20, hoàn toàn không chạm dòng chữ) -->
      ${renderPortCluster2D(portsCount === 24 ? 20 : 30, 20, portsCount, isUp, isCore)}
    </g>

    <!-- Khung ma trận dây kết nối Dedicated Port Outlets (2 cột tách bạch không đè chữ) -->
    <g transform="translate(14, 112)">
      <rect width="372" height="${isCore ? 172 : 152}" rx="6" fill="#060a12" stroke="${strokeAccent}" stroke-width="1.2"/>
      <text x="186" y="20" text-anchor="middle" font-size="11.5" font-weight="700" fill="${tagColor}">
        ${isCore ? "▲ p2 (Trunk) ⟷ Mikrotik ether5" : "▲ P.1 (Uplink) ⟷ hAP ac² ether2"}
      </text>
      <line x1="12" y1="28" x2="360" y2="28" stroke="rgba(255,255,255,0.12)"/>
      
      ${isCore ? `
        <!-- Cột Trái (x = 16) -->
        <text x="16" y="50" font-size="10.5" font-weight="700" fill="#60a5fa">• p17: DVR Dahua (.226)</text>
        <text x="16" y="76" font-size="10.5" font-weight="600" fill="#93c5fd">• p15: Server SQL (.57)</text>
        <text x="16" y="102" font-size="10.5" font-weight="600" fill="#cbd5e1">• p22: TL-SG1024D (T1)</text>
        <text x="16" y="128" font-size="10.5" font-weight="600" fill="#cbd5e1">• p21: TL-SG1024D_1 (T2)</text>
        <text x="16" y="154" font-size="10.5" font-weight="600" fill="#cbd5e1">• p20: TL-SG1016D (T3)</text>
        
        <!-- Cột Phải (x = 195) -->
        <text x="195" y="50" font-size="10.5" font-weight="700" fill="#facc15">• p16: SW PoE Cam ⚡ (16P)</text>
        <text x="195" y="76" font-size="10.5" font-weight="600" fill="#93c5fd">• p23-24: NAS DS923+ (BOND)</text>
        <text x="195" y="102" font-size="10.5" font-weight="600" fill="#cbd5e1">• p19: TL-SG1016D_1 (T4)</text>
        <text x="195" y="128" font-size="10.5" font-weight="600" fill="#cbd5e1">• p18: TL-SG1005D Studio (5P)</text>
      ` : `
        <!-- Cột Trái (x = 16) -->
        <text x="16" y="52" font-size="10.5" font-weight="600" fill="#94a3b8">• P.12: Cổng LAN Dự Phòng</text>
        <text x="16" y="80" font-size="10.5" font-weight="600" fill="#facc15">• P.15: Sw03 Ruijie PoE ⚡</text>
        <text x="16" y="108" font-size="10.5" font-weight="600" fill="#cbd5e1">• P.2-11: Dãy 10 PC Văn Phòng</text>
        <text x="16" y="136" font-size="10.5" font-weight="600" fill="#94a3b8">• P.13: Cổng LAN Dự Phòng</text>
        
        <!-- Cột Phải (x = 195) -->
        <text x="195" y="52" font-size="10.5" font-weight="700" fill="#93c5fd">• P.16: NVR01 Hikvision (.253)</text>
        <text x="195" y="80" font-size="10.5" font-weight="700" fill="#facc15">• G1: Sw02 Hikvision PoE ⚡</text>
      `}
    </g>
  `;
}

function renderPortCluster2D(startX, startY, totalPorts, isUp, isCore) {
  const cols = totalPorts / 2;
  const colW = cols === 12 ? 23 : 36;
  let out = "";

  for (let c = 0; c < cols; c++) {
    const x = startX + c * colW;
    out += `
      <rect x="${x}" y="${startY}" width="13" height="11" rx="1.2" fill="#040711" stroke="#475569" stroke-width="0.6"/>
      <rect x="${x + 4}" y="${startY + 1}" width="5" height="4" fill="#94a3b8"/>
      <circle cx="${x + 6.5}" cy="${startY + 9}" r="1.1" fill="${isUp ? '#22c55e' : '#334155'}"/>
      <rect x="${x}" y="${startY + 13}" width="13" height="11" rx="1.2" fill="#040711" stroke="#475569" stroke-width="0.6"/>
      <rect x="${x + 4}" y="${startY + 19}" width="5" height="4" fill="#94a3b8"/>
      <circle cx="${x + 6.5}" cy="${startY + 15}" r="1.1" fill="${isUp ? '#22c55e' : '#334155'}"/>
    `;
  }

  if (isCore) {
    const sfpX = startX + cols * colW + 8;
    out += `
      <rect x="${sfpX}" y="${startY + 1}" width="18" height="23" rx="1.5" fill="#020617" stroke="#38bdf8" stroke-width="0.9"/>
      <text x="${sfpX + 9}" y="${startY + 16}" text-anchor="middle" font-size="7" font-weight="800" fill="#38bdf8">SFP</text>
    `;
  }
  return out;
}

/**
 * 2. Thẻ Router (MikroTik RB3011 & hAP ac²)
 */
function renderRouterCard(n) {
  const isRb = n.id === "mikrotik";

  return `
    <text x="14" y="31" font-size="12.5" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="14" y="45" font-size="10" font-family="ui-monospace, monospace" font-weight="600" fill="#cbd5e1">${escapeHtml(n.sub)}</text>
    
    <!-- Mô phỏng phần cứng Router -->
    <g transform="translate(14, 52)">
      <rect width="${n.w - 28}" height="22" rx="3" fill="#090d16" stroke="${isRb ? '#dc2626' : '#38bdf8'}" stroke-width="1"/>
      ${isRb ? `
        <rect x="8" y="2.5" width="28" height="17" rx="1.5" fill="#020617" stroke="#38bdf8" stroke-width="0.8"/>
        <path d="M 10 15 L 15 10 L 20 13 L 25 7 L 32 11" fill="none" stroke="#22c55e" stroke-width="1.1"/>
        <g transform="translate(42, 2.5)">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `
            <rect x="${i * 15}" y="2" width="10" height="13" rx="1" fill="#030712" stroke="#64748b" stroke-width="0.5"/>
            <circle cx="${i * 15 + 5}" cy="3.5" r="0.8" fill="#22c55e"/>
          `).join("")}
        </g>
        <rect x="${n.w - 56}" y="3.5" width="12" height="15" rx="1.2" fill="#030712" stroke="#38bdf8" stroke-width="0.8"/>
      ` : `
        <path d="M 18 -2 L 8 -14" stroke="#475569" stroke-width="2.2" stroke-linecap="round"/><circle cx="8" cy="-14" r="2" fill="#38bdf8"/>
        <path d="M ${n.w - 46} -2 L ${n.w - 36} -14" stroke="#475569" stroke-width="2.2" stroke-linecap="round"/><circle cx="${n.w - 36}" cy="-14" r="2" fill="#38bdf8"/>
        <rect x="12" y="2.5" width="14" height="17" rx="1.5" fill="#030712" stroke="#38bdf8" stroke-width="1"/>
        ${[0, 1, 2, 3].map(i => `
          <rect x="${32 + i * 16}" y="2.5" width="12" height="17" rx="1.2" fill="#030712" stroke="#64748b" stroke-width="0.6"/>
          <circle cx="${38 + i * 16}" cy="5" r="0.9" fill="#22c55e"/>
        `).join("")}
      `}
    </g>
  `;
}

/**
 * 3. Thẻ Camera IP PoE (16 Camera HQ & Nhà máy)
 */
function renderCamCard(n) {
  return `
    <!-- Icon Camera Bullet -->
    <g transform="translate(12, 23)">
      <path d="M 4 14 L 10 14 L 10 8 L 4 8 Z" fill="#64748b"/>
      <rect x="10" y="4" width="22" height="12" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.7"/>
      <polygon points="8,2 34,2 30,5 10,5" fill="#64748b"/>
      <ellipse cx="32" cy="10" rx="2.5" ry="5.5" fill="#0b1120" stroke="#38bdf8" stroke-width="0.8"/>
      <circle cx="32" cy="10" r="1.3" fill="#ef4444" filter="url(#glow-red)"/>
    </g>

    <text x="48" y="32" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="48" y="47" font-size="10" font-family="ui-monospace, monospace" font-weight="600" fill="#93c5fd">${escapeHtml(n.sub)}</text>
  `;
}

/**
 * 4. Thẻ Switch (24 Port, 16 Port, 8 Port & OEM)
 */
function renderSwitchCard(n, isUp, isDown) {
  const ports = n.ports || 8;
  const isPoe = !!n.isPoe;

  let portsSvg = "";
  if (ports === 24) {
    const colStep = (n.w - 56) / 12;
    portsSvg = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(c => `
      <rect x="${16 + c * colStep}" y="3" width="7" height="6" rx="0.6" fill="#030712" stroke="#475569" stroke-width="0.4"/>
      <circle cx="${16 + c * colStep + 3.5}" cy="4.5" r="0.6" fill="#22c55e"/>
      <rect x="${16 + c * colStep}" y="11" width="7" height="6" rx="0.6" fill="#030712" stroke="#475569" stroke-width="0.4"/>
      <circle cx="${16 + c * colStep + 3.5}" cy="15.5" r="0.6" fill="#22c55e"/>
    `).join("");
  } else if (ports === 16) {
    const colStep = (n.w - 60) / 8;
    portsSvg = [0, 1, 2, 3, 4, 5, 6, 7].map(c => `
      <rect x="${16 + c * colStep}" y="3" width="8.5" height="6.5" rx="0.6" fill="#030712" stroke="#475569" stroke-width="0.5"/>
      <circle cx="${16 + c * colStep + 4.2}" cy="4.5" r="0.7" fill="#22c55e"/>
      <rect x="${16 + c * colStep}" y="11" width="8.5" height="6.5" rx="0.6" fill="#030712" stroke="#475569" stroke-width="0.5"/>
      <circle cx="${16 + c * colStep + 4.2}" cy="16" r="0.7" fill="#22c55e"/>
    `).join("");
  } else if (ports === 5) {
    // Switch TP-Link 5 Port Gigabit (TL-SG1005D Studio): 5 cổng RJ45 xếp ngang sắc nét
    const colStep = (n.w - 48) / 5;
    portsSvg = [0, 1, 2, 3, 4].map(c => `
      <rect x="${16 + c * colStep}" y="3" width="16" height="14" rx="1.5" fill="#030712" stroke="#475569" stroke-width="0.6"/>
      <rect x="${16 + c * colStep + 4.5}" y="4.5" width="7" height="4" fill="#94a3b8"/>
      <circle cx="${16 + c * colStep + 8}" cy="13.5" r="1.1" fill="#22c55e"/>
    `).join("");
  } else {
    const colStep = (n.w - 50) / 8;
    portsSvg = [0, 1, 2, 3, 4, 5, 6, 7].map(c => `
      <rect x="${14 + c * colStep}" y="4" width="10" height="12" rx="1" fill="#030712" stroke="${isPoe ? '#b45309' : '#475569'}" stroke-width="0.5"/>
      <circle cx="${14 + c * colStep + 5}" cy="13" r="0.9" fill="#22c55e"/>
    `).join("");
  }

  return `
    <text x="14" y="31" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="14" y="45" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#cbd5e1">${escapeHtml(n.sub)}</text>
    
    <g transform="translate(14, 52)">
      <rect width="${n.w - 28}" height="20" rx="2.5" fill="#080c14" stroke="${isPoe ? '#f59e0b' : '#334155'}" stroke-width="0.9"/>
      <circle cx="7" cy="10" r="1.2" fill="${isUp ? '#22c55e' : isDown ? '#ef4444' : '#94a3b8'}"/>
      ${portsSvg}
    </g>
  `;
}

/**
 * 5. Thẻ Server SQL (2U Rack Server Hot-swap)
 */
function renderServerCard(n) {
  return `
    <text x="14" y="31" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="14" y="45" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#93c5fd">${escapeHtml(n.sub)}</text>
    
    <g transform="translate(14, 52)">
      <rect width="${n.w - 28}" height="20" rx="2" fill="#080c14" stroke="#475569" stroke-width="0.9"/>
      ${[0, 1, 2, 3].map(i => `
        <rect x="${8 + i * 22}" y="2.5" width="18" height="6.5" rx="0.8" fill="#1e293b" stroke="#334155" stroke-width="0.4"/>
        <circle cx="${23 + i * 22}" cy="5.5" r="0.8" fill="#22c55e"/>
        <rect x="${8 + i * 22}" y="11" width="18" height="6.5" rx="0.8" fill="#1e293b" stroke="#334155" stroke-width="0.4"/>
        <circle cx="${23 + i * 22}" cy="14" r="0.8" fill="#22c55e"/>
      `).join("")}
      <circle cx="${n.w - 40}" cy="10" r="2.8" fill="#0284c7" stroke="#38bdf8" stroke-width="0.8"/>
    </g>
  `;
}

/**
 * 6. Thẻ NAS Synology DS923+
 */
function renderNasCard(n) {
  return `
    <text x="14" y="31" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="14" y="45" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#93c5fd">${escapeHtml(n.sub)}</text>
    
    <g transform="translate(14, 52)">
      <rect width="${n.w - 28}" height="20" rx="2" fill="#090d16" stroke="#475569" stroke-width="0.9"/>
      ${[0, 1, 2, 3].map(i => `
        <rect x="${10 + i * 18}" y="2" width="14" height="16" rx="1.2" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
        <circle cx="${17 + i * 18}" cy="6" r="0.9" fill="#22c55e"/>
      `).join("")}
      <text x="${n.w - 40}" y="13" text-anchor="middle" font-size="6.5" font-weight="800" fill="#94a3b8">DS923+</text>
    </g>
  `;
}

/**
 * 7. Thẻ Đầu ghi hình DVR/NVR
 */
function renderNvrCard(n) {
  return `
    <text x="14" y="31" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="14" y="45" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#cbd5e1">${escapeHtml(n.sub)}</text>
    
    <g transform="translate(14, 52)">
      <rect width="${n.w - 28}" height="20" rx="2" fill="#080c14" stroke="#334155" stroke-width="0.9"/>
      <circle cx="14" cy="10" r="2.8" fill="#ef4444" filter="url(#glow-red)"/>
      <text x="21" y="13" font-size="7" font-weight="900" fill="#f87171">● REC</text>
      <g transform="translate(60, 3)">
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `
          <rect x="${i * 7}" y="2" width="5" height="8" rx="0.5" fill="#030712" stroke="#475569" stroke-width="0.5"/>
          <circle cx="${i * 7 + 2.5}" cy="6" r="0.6" fill="#22c55e"/>
        `).join("")}
      </g>
    </g>
  `;
}

/**
 * 8. Thẻ Access Point Wi-Fi
 */
function renderApCard(n) {
  return `
    <!-- Icon Access Point -->
    <g transform="translate(12, 24)">
      <ellipse cx="18" cy="11" rx="13" ry="6.5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.8"/>
      <ellipse cx="18" cy="11" rx="6.5" ry="3.2" fill="none" stroke="#0ea5e9" stroke-width="1.2" filter="url(#glow-blue)"/>
      <path d="M 9 4 Q 18 -1 27 4" fill="none" stroke="#38bdf8" stroke-width="1.1"/>
    </g>

    <text x="46" y="32" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="46" y="47" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#93c5fd">${escapeHtml(n.sub)}</text>
  `;
}

/**
 * 9. Thẻ Máy in & Photocopy
 */
function renderPrinterCard(n) {
  return `
    <!-- Icon Máy in / Photocopy -->
    <g transform="translate(12, 24)">
      <rect x="6" y="2" width="22" height="16" rx="1.5" fill="#cbd5e1" stroke="#64748b" stroke-width="0.7"/>
      <rect x="6" y="0" width="22" height="3" rx="0.5" fill="#e2e8f0"/>
      <rect x="18" y="2" width="7" height="4" fill="#0284c7"/>
      <line x1="8" y1="12" x2="26" y2="12" stroke="#475569" stroke-width="1"/>
    </g>

    <text x="44" y="32" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="44" y="47" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#cbd5e1">${escapeHtml(n.sub)}</text>
  `;
}

/**
 * 10. Thẻ Máy trạm PC01 - PC10
 */
function renderPcCard(n) {
  return `
    <g transform="translate(12, 24)">
      <rect x="4" y="2" width="18" height="12" rx="1.2" fill="#0f172a" stroke="#38bdf8" stroke-width="0.8"/>
      <rect x="10" y="14" width="6" height="3" fill="#64748b"/>
      <rect x="26" y="2" width="8" height="16" rx="1" fill="#1e293b" stroke="#475569" stroke-width="0.7"/>
      <circle cx="30" cy="6" r="1.3" fill="#38bdf8"/>
    </g>

    <text x="46" y="32" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="46" y="47" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#cbd5e1">${escapeHtml(n.sub)}</text>
  `;
}

/**
 * 11. Thẻ Máy giám sát ra vào / Chấm công Hikvision (Khuôn mặt & Wi-Fi)
 */
function renderMccCard(n) {
  return `
    <!-- Icon Máy giám sát ra vào Hikvision (Nhận diện khuôn mặt & Thẻ + Wi-Fi) -->
    <g transform="translate(12, 22)">
      <rect x="4" y="0" width="22" height="28" rx="2.5" fill="#0b0f19" stroke="#64748b" stroke-width="0.9"/>
      <rect x="6" y="2.5" width="18" height="15" rx="1" fill="#0f172a" stroke="#1e293b" stroke-width="0.5"/>
      <circle cx="12" cy="5.5" r="1.1" fill="#0284c7"/>
      <circle cx="18" cy="5.5" r="1.1" fill="#ef4444"/>
      <path d="M 10 9 L 8 9 L 8 11 M 20 9 L 22 9 L 22 11 M 8 13 L 8 15 L 10 15 M 22 13 L 22 15 L 20 15" stroke="#38bdf8" stroke-width="0.7" fill="none"/>
      <path d="M 11 20 Q 15 17.5 19 20 M 12.5 22.5 Q 15 21 17.5 22.5" stroke="#38bdf8" stroke-width="0.8" fill="none" stroke-linecap="round"/>
      <circle cx="15" cy="24.5" r="0.7" fill="#38bdf8"/>
    </g>

    <text x="44" y="32" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="44" y="47" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#38bdf8">${escapeHtml(n.sub)}</text>
  `;
}

/**
 * 12. Thẻ Modem Cáp quang WAN ISP
 */
function renderWanCard(n) {
  return `
    <!-- Icon Cloud & Laser GPON -->
    <g transform="translate(12, 24)">
      <path d="M 12 18 C 6 18 2 14 2 9 C 2 5 6 1 10 1 C 12 1 14 2 15 3 C 17 0 22 0 25 3 C 28 3 30 6 30 9 C 30 14 26 18 20 18 Z" fill="#0369a1" stroke="#38bdf8" stroke-width="0.9"/>
      <path d="M 16 7 L 16 13 M 13 10 L 16 7 L 19 10" stroke="#f0fdf4" stroke-width="1.3" stroke-linecap="round"/>
    </g>

    <text x="48" y="32" font-size="12" font-weight="800" fill="#ffffff">${escapeHtml(n.label)}</text>
    <text x="48" y="47" font-size="9.5" font-family="ui-monospace, monospace" font-weight="600" fill="#93c5fd">${escapeHtml(n.sub)}</text>
  `;
}

/**
 * Cài đặt thanh công cụ chuyển đổi chế độ xem và Zoom điều khiển
 */
function setupSiteFilterButtons() {
  const container = document.getElementById("topology-controls");
  if (!container) return;

  container.innerHTML = `
    <div class="topo-toolbar">
      <div class="site-pills">
        <button class="pill-btn ${activeSiteFilter === "all" ? "active" : ""}" data-site="all">Toàn cảnh cuộn tự do (HQ + BOB)</button>
        <button class="pill-btn ${activeSiteFilter === "hq" ? "active" : ""}" data-site="hq">Trụ sở chính HQ (16 Camera PoE)</button>
        <button class="pill-btn ${activeSiteFilter === "bob" ? "active" : ""}" data-site="bob">Chi nhánh BOB (Nhà máy · hAP ac²)</button>
      </div>

      <div class="zoom-controls">
        <button class="zoom-btn" id="btn-zoom-in" title="Phóng to">🔍 +</button>
        <button class="zoom-btn" id="btn-zoom-out" title="Thu nhỏ">🔍 -</button>
        <button class="zoom-btn" id="btn-zoom-fit" title="Vừa màn hình">⟲ Fit</button>
        <button class="zoom-btn" id="btn-zoom-100" title="Kích thước chuẩn 100%">100%</button>
        <button class="zoom-btn" id="btn-fullscreen" title="Xem sơ đồ toàn màn hình" style="border-color:#38bdf8; color:#38bdf8;">⛶ Toàn màn hình</button>
      </div>

      <div class="topo-legend">
        <span class="legend-item"><span class="dot-green"></span> Online (Ping OK)</span>
        <span class="legend-item"><span class="dot-red"></span> Offline (Báo đỏ)</span>
        <span class="legend-item"><span class="dot-grey"></span> Switch Unmanaged (Màu xám)</span>
        <span class="legend-item" style="color:#f59e0b; font-weight:700;">⚡ PoE Cấp nguồn</span>
        <span class="legend-item"><span class="dot-purple"></span> IPsec VPN (HQ ⟷ BOB)</span>
      </div>
    </div>
  `;

  container.onclick = ev => {
    const btn = ev.target.closest(".pill-btn");
    if (btn) {
      activeSiteFilter = btn.dataset.site;
      container.querySelectorAll(".pill-btn").forEach(b => b.classList.toggle("active", b === btn));
      window.dispatchEvent(new CustomEvent("netmon:refresh-topology"));
      return;
    }

    const svgElem = document.getElementById("topology-svg");
    if (!svgElem) return;

    const wrapEl = document.querySelector(".topo-wrap");

    if (ev.target.id === "btn-zoom-in") {
      fitMode = false;
      setSvgWidth(svgElem, svgElem.getBoundingClientRect().width * 1.15);
    } else if (ev.target.id === "btn-zoom-out") {
      fitMode = false;
      setSvgWidth(svgElem, svgElem.getBoundingClientRect().width / 1.15);
    } else if (ev.target.id === "btn-zoom-fit") {
      fitMode = true;
      if (wrapEl) fitToView(svgElem, wrapEl);
    } else if (ev.target.id === "btn-zoom-100") {
      fitMode = false;
      setSvgWidth(svgElem, svgElem.viewBox.baseVal.width || 2540); // 100% = 1 đơn vị viewBox = 1px
    } else if (ev.target.id === "btn-fullscreen") {
      const wrap = document.querySelector(".topo-wrap");
      if (!wrap) return;
      if (!document.fullscreenElement) {
        if (wrap.requestFullscreen) wrap.requestFullscreen();
        else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    }
  };
}

/** Đặt chiều rộng SVG (chiều cao tự theo tỉ lệ viewBox). Bỏ min-width cứng 2540px của CSS để có thể thu nhỏ. */
function setSvgWidth(svg, px) {
  const w = Math.max(500, Math.min(8000, Math.floor(px)));
  svg.style.minWidth = "0";
  svg.style.width = w + "px";
  svg.style.transform = "none";
}

/** Fit: chọn tỉ lệ nhỏ hơn giữa (rộng khung / rộng sơ đồ) và (cao khung / cao sơ đồ) → thấy trọn toàn bộ topology. */
function fitToView(svg, wrap) {
  const vb = svg.viewBox && svg.viewBox.baseVal;
  if (!vb || !vb.width || !vb.height) return;

  const cs = getComputedStyle(wrap);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

  const fixedHeight = document.fullscreenElement === wrap || document.body.classList.contains("tab-topology-active");
  const boxH = fixedHeight
    ? wrap.clientHeight
    : (parseFloat(cs.maxHeight) || window.innerHeight - 140);

  const availW = wrap.clientWidth - padX - 4;
  const availH = boxH - padY - 4;
  if (availW <= 0 || availH <= 0) return;

  const scale = Math.min(availW / vb.width, availH / vb.height);
  setSvgWidth(svg, vb.width * scale);
  wrap.scrollLeft = 0;
  wrap.scrollTop = 0;
}

function bindFitListeners() {
  if (fitListenersBound) return;
  fitListenersBound = true;
  const refit = () => {
    if (!fitMode) return;
    const svg = document.getElementById("topology-svg");
    const wrap = document.querySelector(".topo-wrap");
    if (svg && wrap) fitToView(svg, wrap);
  };
  window.addEventListener("resize", () => requestAnimationFrame(refit));
  document.addEventListener("fullscreenchange", () => setTimeout(refit, 120));

  // Ctrl + lăn chuột (hoặc pinch trên touchpad): zoom quanh vị trí con trỏ
  const wrap = document.querySelector(".topo-wrap");
  if (wrap) {
    wrap.addEventListener("wheel", e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const svg = document.getElementById("topology-svg");
      if (!svg) return;
      const oldW = svg.getBoundingClientRect().width;
      const wr = wrap.getBoundingClientRect();
      const mx = e.clientX - wr.left;
      const my = e.clientY - wr.top;
      const px = mx + wrap.scrollLeft;
      const py = my + wrap.scrollTop;
      fitMode = false;
      setSvgWidth(svg, oldW * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
      const ratio = svg.getBoundingClientRect().width / oldW;
      wrap.scrollLeft = px * ratio - mx;
      wrap.scrollTop = py * ratio - my;
    }, { passive: false });
  }
}

function applyZoom(svg) {
  svg.style.transform = `scale(${currentZoom})`;
  svg.style.transformOrigin = "top left";
}

/**
 * Kéo thả chuột tự do để duyệt sơ đồ mạng toàn cảnh (Grab-to-Scroll / Mouse Drag Pan)
 */
function setupDragPan(wrap) {
  if (!wrap || wrap.dataset.panSetup === "true") return;
  wrap.dataset.panSetup = "true";

  let isDown = false;
  let startX = 0;
  let startY = 0;
  let initialScrollLeft = 0;
  let initialScrollTop = 0;

  wrap.addEventListener("mousedown", e => {
    // Chỉ kích hoạt khi nhấn chuột trái
    if (e.button !== 0) return;
    // Bỏ qua nếu bấm vào nút điều khiển hoặc thẻ link
    if (e.target.closest("button, a, input, select, textarea")) return;

    isDown = true;
    wrap.classList.add("is-dragging");
    startX = e.clientX;
    startY = e.clientY;
    initialScrollLeft = wrap.scrollLeft;
    initialScrollTop = wrap.scrollTop;
  });

  window.addEventListener("mousemove", e => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      e.preventDefault();
    }

    wrap.scrollLeft = initialScrollLeft - dx;
    wrap.scrollTop = initialScrollTop - dy;
  });

  const stopDrag = () => {
    if (isDown) {
      isDown = false;
      wrap.classList.remove("is-dragging");
    }
  };

  window.addEventListener("mouseup", stopDrag);
  window.addEventListener("blur", stopDrag);
  wrap.addEventListener("dragstart", e => e.preventDefault());

  // Hỗ trợ cảm ứng vuốt đơn & phóng to 2 ngón (Pinch-to-zoom) trên điện thoại và máy tính bảng
  let touchStartX = 0, touchStartY = 0, touchSL = 0, touchST = 0;
  let initialPinchDist = 0;
  let initialPinchZoom = 1.0;

  wrap.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchSL = wrap.scrollLeft;
      touchST = wrap.scrollTop;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.hypot(dx, dy);
      initialPinchZoom = currentZoom;
    }
  }, { passive: true });

  wrap.addEventListener("touchmove", e => {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      wrap.scrollLeft = touchSL - dx;
      wrap.scrollTop = touchST - dy;
    } else if (e.touches.length === 2 && initialPinchDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / initialPinchDist;
      currentZoom = Math.max(0.4, Math.min(2.5, initialPinchZoom * factor));
      const svg = document.getElementById("topology-svg");
      if (svg) applyZoom(svg);
    }
  }, { passive: true });
}

/**
 * Vẽ nhãn cổng dạng viên thuốc (Port Tag) to rõ nét với màu viền/chữ phân biệt.
 */
function renderPortTag(x, y, text, textColor = "#f1f5f9") {
  if (!text) return "";
  const tagW = Math.max(34, text.length * 7.2 + 10);
  return `
    <g transform="translate(${x},${y})">
      <rect x="${-tagW / 2}" y="-10" width="${tagW}" height="20" rx="4.5" 
        fill="#0b0f19" stroke="#475569" stroke-width="1.3"/>
      <text x="0" y="4.2" text-anchor="middle" font-size="11" font-family="ui-monospace, monospace" 
        font-weight="800" fill="${textColor}">${text}</text>
    </g>
  `;
}

/**
 * Vẽ viên thuốc lưu lượng mạng (Traffic Pill) rộng rãi, tương phản cao.
 */
function renderTrafficPill(x, y, rxStr, txStr) {
  const content = `↓ ${rxStr}   ↑ ${txStr}`;
  const pillW = Math.max(140, Math.min(190, content.length * 7.0 + 20));
  return `
    <g transform="translate(${x},${y})" filter="url(#badge-shadow)">
      <rect x="${-pillW / 2}" y="-13" width="${pillW}" height="26" rx="13" class="traffic-pill-bg"/>
      <text x="0" y="4.5" text-anchor="middle" font-size="11.5" font-weight="700">
        <tspan fill="#38bdf8">↓ ${rxStr}</tspan> &nbsp;&nbsp;<tspan fill="#facc15">↑ ${txStr}</tspan>
      </text>
    </g>
  `;
}
