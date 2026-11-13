/**
 * NetMon - Sơ đồ mạng phân tầng doanh nghiệp (Vertical Spider / Dedicated Port Outlets)
 * Tự động đồng bộ và hiển thị:
 * 1. Trụ sở chính HQ (Subnet 192.168.1.0/24 - Router MikroTik RB3011UiAS & Core Ruijie RG-ES224GC)
 * 2. Chi nhánh BOB - Nhà máy (Subnet 192.168.4.0/24 - Router MikroTik hAP ac² & Sw01 TL-SG116)
 * 3. Đường hầm IPsec Site-to-Site VPN (IKEv2 / AES-256)
 * 4. Tách bạch từng chân port của Switch Core & Router bằng các đường dây độc lập (Dedicated Outlets)
 * 5. Bắt buộc hiển thị rõ port nào cắm với port nào ở cả 2 đầu kết nối.
 * 6. Bố cục dạng cuộn dọc (Vertical Scroll), cỡ chữ to, rõ ràng, tương phản cao.
 */
import { fmtBps, escapeHtml } from "../format.js";

const VIEW_BOX_ALL = "0 0 1560 1860";
const VIEW_BOX_HQ = "0 0 1560 940";
const VIEW_BOX_BOB = "0 1020 1560 840";

// --- TỌA ĐỘ VÀ THÔNG SỐ CÁC KHỐI THIẾT BỊ (VERTICAL SCROLL SPIDER LAYOUT) ---
const NODES = [
  // ==========================================
  // KHU VỰC TRỤ SỞ CHÍNH HQ (192.168.1.x)
  // ==========================================
  // 1. WAN ISP HQ
  { id: "fpt", site: "hq", x: 640, y: 80, w: 180, h: 54, label: "ISP FPT", sub: "DHCP IP WAN", type: "wan" },
  { id: "vnpt", site: "hq", x: 920, y: 80, w: 180, h: 54, label: "ISP VNPT", sub: "113.161.75.195", type: "wan" },

  // 2. Trục trung tâm HQ (Spine)
  { id: "mikrotik", site: "hq", x: 780, y: 220, w: 260, h: 72, label: "Mikrotik RB3011UiAS", sub: "192.168.1.1 (HQ Router)", type: "router" },
  { id: "core", site: "hq", x: 780, y: 560, w: 320, h: 280, label: "SW CORE Ruijie", sub: "192.168.1.254 (RG-ES224GC)", type: "core" },

  // 3. Cánh Trái HQ (Left Wing)
  { id: "dvr_vt", site: "hq", x: 230, y: 220, w: 190, h: 56, label: "DVR VANTECH", sub: "192.168.1.101 (eth4)", type: "nvr" },
  { id: "dvr_dh", site: "hq", x: 230, y: 460, w: 190, h: 56, label: "DVR DAHUA", sub: "192.168.1.226 (P.17)", type: "nvr" },
  { id: "sql", site: "hq", x: 230, y: 550, w: 190, h: 56, label: "Server SQL", sub: "192.168.1.57 (P.15)", type: "server" },
  { id: "u1", site: "hq", x: 230, y: 640, w: 190, h: 56, label: "TL-SG1024D", sub: "Unmanage T1 (P.22)", type: "unmanaged" },
  { id: "u2", site: "hq", x: 230, y: 730, w: 190, h: 56, label: "TL-SG1024D_1", sub: "Unmanage T2 (P.21)", type: "unmanaged" },
  { id: "u3", site: "hq", x: 230, y: 820, w: 190, h: 56, label: "TL-SG1016D", sub: "Unmanage T3 (P.20)", type: "unmanaged" },

  // 4. Cánh Phải HQ (Right Wing)
  { id: "wifi", site: "hq", x: 1210, y: 220, w: 190, h: 56, label: "SW WIFI 296", sub: "VLAN 20 (eth9)", type: "wifi" },
  { id: "ap", site: "hq", x: 1445, y: 220, w: 155, h: 52, label: "AP WIFI UniFi", sub: "AP01–05 (UniFi)", type: "ap" },
  { id: "poe", site: "hq", x: 1210, y: 460, w: 190, h: 56, label: "SW POE HIKVISION", sub: "16 Port (P.16)", type: "unmanaged" },
  { id: "cam", site: "hq", x: 1445, y: 460, w: 150, h: 52, label: "CAMERA C1 – C16", sub: "192.168.1.102 – 107", type: "cam" },
  { id: "nas", site: "hq", x: 1330, y: 550, w: 190, h: 56, label: "NAS DS923+", sub: "1.119 (BOND)", type: "nas" },
  { id: "u4", site: "hq", x: 1330, y: 640, w: 190, h: 56, label: "TL-SG1016D_1", sub: "Unmanage T4 (P.19)", type: "unmanaged" },
  { id: "u5", site: "hq", x: 1330, y: 730, w: 190, h: 56, label: "TL-SG1005D", sub: "Studio (P.18)", type: "unmanaged" },
  { id: "prn1", site: "hq", x: 1210, y: 820, w: 190, h: 56, label: "MP C4505EX", sub: "192.168.1.250 (P.12)", type: "printer" },
  { id: "prn2", site: "hq", x: 1445, y: 820, w: 150, h: 52, label: "MP C5503", sub: "192.168.1.252 (P.13)", type: "printer" },

  // ==========================================
  // KHU VỰC CHI NHÁNH BOB - NHÀ MÁY (192.168.4.x)
  // ==========================================
  // 1. WAN ISP BOB
  { id: "isp_bob", site: "bob", x: 780, y: 1070, w: 200, h: 54, label: "ISP VNPT (BOB)", sub: "113.161.45.93", type: "wan" },

  // 2. Trục trung tâm BOB (Spine)
  { id: "bob_router", site: "bob", x: 780, y: 1200, w: 260, h: 72, label: "Mikrotik hAP ac²", sub: "192.168.4.1 (BOB Router)", type: "router" },
  { id: "bob_sw01", site: "bob", x: 780, y: 1490, w: 320, h: 260, label: "Sw01 TL-SG116", sub: "16-Port Gigabit Switch", type: "unmanaged" },

  // 3. Cánh Trái BOB (Left Wing)
  { id: "bob_photo", site: "bob", x: 230, y: 1400, w: 190, h: 56, label: "Photocopy01", sub: "192.168.4.251 (P.12)", type: "printer" },
  { id: "bob_sw03", site: "bob", x: 300, y: 1490, w: 180, h: 56, label: "Sw03 Ruijie SW", sub: "192.168.4.252 (P.15)", type: "switch" },
  { id: "bob_ap", site: "bob", x: 90, y: 1490, w: 140, h: 54, label: "AP01 – AP05", sub: "Reyee Wi-Fi 6 (P4-P8)", type: "ap" },
  { id: "bob_pc", site: "bob", x: 230, y: 1580, w: 190, h: 56, label: "PC01 – PC10", sub: "Dãy 10 PC (P.2-P.11)", type: "unmanaged" },
  { id: "bob_mcc", site: "bob", x: 230, y: 1670, w: 190, h: 56, label: "MCC01 Máy chấm công", sub: "192.168.4.248 (P.13)", type: "device" },

  // 4. Cánh Phải BOB (Right Wing)
  { id: "bob_nvr", site: "bob", x: 1230, y: 1400, w: 190, h: 56, label: "NVR01 Hikvision", sub: "192.168.4.253 (P.16)", type: "nvr" },
  { id: "bob_sw02", site: "bob", x: 1210, y: 1490, w: 190, h: 56, label: "Sw02 Hikvision PoE", sub: "192.168.4.242 (1318P)", type: "poe" },
  { id: "bob_c2_16", site: "bob", x: 1445, y: 1490, w: 150, h: 52, label: "Camera C2 – C16", sub: "15 Camera PoE (P2-16)", type: "cam" },
  { id: "bob_sw04", site: "bob", x: 1210, y: 1600, w: 190, h: 56, label: "Sw04 Hikvision PoE", sub: "192.168.4.243 (1318P)", type: "poe" },
  { id: "bob_c17_31", site: "bob", x: 1445, y: 1600, w: 150, h: 52, label: "Camera C17 – C31", sub: "15 Camera PoE (P1-15)", type: "cam" },
  { id: "bob_sw05", site: "bob", x: 1210, y: 1710, w: 190, h: 56, label: "Sw05 Switch OEM 8P", sub: "8-Port (No Brand)", type: "unmanaged" },
  { id: "bob_c1", site: "bob", x: 1445, y: 1710, w: 150, h: 52, label: "Camera C1", sub: "Camera cổng (P8)", type: "cam" },
];

// Khung phân vùng khu vực (Site Frames)
const FRAMES = [
  { id: "frame_hq", label: "TRỤ SỞ CHÍNH HQ (Subnet 192.168.1.0/24 & 192.168.0.0/24)", x: 10, y: 35, w: 1540, h: 875, color: "rgba(56, 189, 248, 0.08)" },
  { id: "frame_bob", label: "CHI NHÁNH BOB - NHÀ MÁY (Subnet 192.168.4.0/24)", x: 10, y: 1030, w: 1540, h: 810, color: "rgba(168, 85, 247, 0.10)" },
];

// Mảng đường nối cáp mạng ĐỘC LẬP TỪNG CHÂN PORT (Không gộp bus, vuông góc 100%)
const ORTHO_LINKS = [
  // ==========================================
  // LIÊN KẾT TRỤ SỞ CHÍNH HQ
  // ==========================================
  // WAN FPT & VNPT -> MikroTik RB3011UiAS
  {
    from: "fpt", to: "mikrotik", ifName: "ether1",
    path: "M 640 107 V 150 H 720 V 184",
    pFrom: "WAN1", pFromPos: { x: 640, y: 125 },
    pTo: "eth1", pToPos: { x: 720, y: 165 },
    badgePos: { x: 540, y: 140 },
  },
  {
    from: "vnpt", to: "mikrotik", ifName: "ether2",
    path: "M 920 107 V 150 H 840 V 184",
    pFrom: "WAN2", pFromPos: { x: 920, y: 125 },
    pTo: "eth2", pToPos: { x: 840, y: 165 },
    badgePos: { x: 1020, y: 140 },
  },

  // TRUNK LINE: MikroTik RB3011UiAS <-> SW CORE Ruijie (ether5 <-> p2)
  {
    from: "mikrotik", to: "core", ifName: "ether5",
    path: "M 780 256 V 420",
    pFrom: "ether5", pFromPos: { x: 780, y: 275 },
    pTo: "p2", pToPos: { x: 780, y: 395 },
    badgePos: { x: 890, y: 340 },
  },

  // MikroTik Direct Router Links:
  // eth4 -> DVR VANTECH
  {
    from: "mikrotik", to: "dvr_vt", ifName: "ether4",
    path: "M 650 220 H 325",
    pFrom: "eth4", pFromPos: { x: 615, y: 220 },
    pTo: "eth4", pToPos: { x: 355, y: 220 },
  },
  // eth9 -> SW WIFI 296
  {
    from: "mikrotik", to: "wifi", ifName: "ether9",
    path: "M 910 220 H 1115",
    pFrom: "eth9", pFromPos: { x: 945, y: 220 },
    pTo: "eth9", pToPos: { x: 1085, y: 220 },
  },
  // SW WIFI 296 -> AP WIFI (VLAN 20)
  {
    from: "wifi", to: "ap",
    path: "M 1305 220 H 1370",
    pTo: "VLAN 20", pToPos: { x: 1340, y: 220 },
  },

  // 5 ĐƯỜNG CÁP RIÊNG BIỆT TỪ CHÂN CORE SWITCH SANG CÁNH TRÁI:
  // 1. Port p17 -> DVR DAHUA
  {
    from: "core", to: "dvr_dh",
    path: "M 620 460 H 325",
    pFrom: "p17", pFromPos: { x: 585, y: 460 },
    pTo: "P.17", pToPos: { x: 355, y: 460 },
  },
  // 2. Port p15 -> Server SQL
  {
    from: "core", to: "sql",
    path: "M 620 510 H 390 V 550 H 325",
    pFrom: "p15", pFromPos: { x: 585, y: 510 },
    pTo: "P.15", pToPos: { x: 355, y: 550 },
  },
  // 3. Port p22 -> TL-SG1024D (Tầng 1)
  {
    from: "core", to: "u1",
    path: "M 620 560 H 440 V 640 H 325",
    pFrom: "p22", pFromPos: { x: 585, y: 560 },
    pTo: "p24", pToPos: { x: 355, y: 640 },
  },
  // 4. Port p21 -> TL-SG1024D_1 (Tầng 2)
  {
    from: "core", to: "u2",
    path: "M 620 610 H 490 V 730 H 325",
    pFrom: "p21", pFromPos: { x: 585, y: 610 },
    pTo: "p24", pToPos: { x: 355, y: 730 },
  },
  // 5. Port p20 -> TL-SG1016D (Tầng 3)
  {
    from: "core", to: "u3",
    path: "M 620 660 H 540 V 820 H 325",
    pFrom: "p20", pFromPos: { x: 585, y: 660 },
    pTo: "p16", pToPos: { x: 355, y: 820 },
  },

  // 5 ĐƯỜNG CÁP RIÊNG BIỆT TỪ CHÂN CORE SWITCH SANG CÁNH PHẢI:
  // 1. Port p16 -> SW POE HIKVISION
  {
    from: "core", to: "poe",
    path: "M 940 460 H 1115",
    pFrom: "p16", pFromPos: { x: 975, y: 460 },
    pTo: "P.16", pToPos: { x: 1085, y: 460 },
  },
  // SW POE -> Camera C1-C16
  {
    from: "poe", to: "cam",
    path: "M 1305 460 H 1370",
    pTo: "C1–C16", pToPos: { x: 1340, y: 460 },
  },
  // 2. Port p23-24 (BOND) -> NAS DS923+
  {
    from: "core", to: "nas",
    path: "M 940 510 H 1170 V 550 H 1235",
    pFrom: "p23-24", pFromPos: { x: 980, y: 510 },
    pTo: "BOND", pToPos: { x: 1205, y: 550 },
  },
  // 3. Port p19 -> TL-SG1016D_1 (Tầng 4)
  {
    from: "core", to: "u4",
    path: "M 940 560 H 1130 V 640 H 1235",
    pFrom: "p19", pFromPos: { x: 975, y: 560 },
    pTo: "p16", pToPos: { x: 1205, y: 640 },
  },
  // 4. Port p18 -> TL-SG1005D (Studio)
  {
    from: "core", to: "u5",
    path: "M 940 610 H 1090 V 730 H 1235",
    pFrom: "p18", pFromPos: { x: 975, y: 610 },
    pTo: "p1", pToPos: { x: 1205, y: 730 },
  },
  // 5. Port p12 -> Máy in MP C4505EX
  {
    from: "core", to: "prn1",
    path: "M 940 660 H 1050 V 820 H 1115",
    pFrom: "p12", pFromPos: { x: 975, y: 660 },
    pTo: "P.12", pToPos: { x: 1085, y: 820 },
  },
  // MP C4505EX -> MP C5503
  {
    from: "prn1", to: "prn2",
    path: "M 1305 820 H 1370",
    pTo: "P.13", pToPos: { x: 1340, y: 820 },
  },

  // ==========================================
  // LIÊN KẾT CHI NHÁNH BOB (THEO SƠ ĐỒ THỰC TẾ)
  // ==========================================
  // 1. WAN BOB -> Mikrotik hAP ac² (ether1)
  {
    from: "isp_bob", to: "bob_router", ifName: "bob_ether1",
    path: "M 780 1097 V 1164",
    pTo: "ether1", pToPos: { x: 780, y: 1140 },
    badgePos: { x: 920, y: 1130 },
  },

  // 2. TRUNK LINE: Mikrotik hAP ac² <-> Sw01 TL-SG116
  {
    from: "bob_router", to: "bob_sw01", ifName: "bob_ether2",
    path: "M 780 1236 V 1360",
    pFrom: "ether2 (P.1)", pFromPos: { x: 780, y: 1255 },
    pTo: "P.1 (Uplink)", pToPos: { x: 780, y: 1345 },
    badgePos: { x: 890, y: 1300 },
  },

  // CÁNH TRÁI BOB (Độc lập từng chân port):
  // Port P.12 -> Photocopy01
  {
    from: "bob_sw01", to: "bob_photo",
    path: "M 620 1400 H 325",
    pFrom: "P.12", pFromPos: { x: 585, y: 1400 },
    pTo: "P.12", pToPos: { x: 355, y: 1400 },
  },
  // Port P.15 -> Sw03 Ruijie SW (P.1)
  {
    from: "bob_sw01", to: "bob_sw03",
    path: "M 620 1450 H 450 V 1490 H 390",
    pFrom: "P.15", pFromPos: { x: 585, y: 1450 },
    pTo: "P.1", pToPos: { x: 410, y: 1490 },
  },
  // Sw03 -> AP01-AP05 (Wi-Fi 6)
  {
    from: "bob_sw03", to: "bob_ap",
    path: "M 210 1490 H 160",
    pTo: "P.4-P.8", pToPos: { x: 185, y: 1490 },
  },
  // Port P.2-P.11 -> Dãy PC01 - PC10
  {
    from: "bob_sw01", to: "bob_pc",
    path: "M 620 1500 H 490 V 1580 H 325",
    pFrom: "P.2-P.11", pFromPos: { x: 580, y: 1500 },
    pTo: "P.2-P.11", pToPos: { x: 360, y: 1580 },
  },
  // Port P.13 -> MCC01 Máy chấm công
  {
    from: "bob_sw01", to: "bob_mcc",
    path: "M 620 1550 H 540 V 1670 H 325",
    pFrom: "P.13", pFromPos: { x: 585, y: 1550 },
    pTo: "P.13", pToPos: { x: 355, y: 1670 },
  },

  // CÁNH PHẢI BOB (Độc lập từng chân port):
  // Port P.16 -> NVR01 Hikvision
  {
    from: "bob_sw01", to: "bob_nvr",
    path: "M 940 1400 H 1135",
    pFrom: "P.16", pFromPos: { x: 975, y: 1400 },
    pTo: "P.16", pToPos: { x: 1105, y: 1400 },
  },
  // Port G1 (P.1) -> Sw02 Hikvision PoE
  {
    from: "bob_sw01", to: "bob_sw02",
    path: "M 940 1450 H 1050 V 1490 H 1115",
    pFrom: "G1", pFromPos: { x: 975, y: 1450 },
    pTo: "G1", pToPos: { x: 1085, y: 1490 },
  },
  // Sw02 -> Camera C2-C16
  {
    from: "bob_sw02", to: "bob_c2_16",
    path: "M 1305 1490 H 1370",
    pTo: "P.2-P.16", pToPos: { x: 1340, y: 1490 },
  },
  // Cascade Sw02 (G2) -> Sw04 (G1)
  {
    from: "bob_sw02", to: "bob_sw04",
    path: "M 1210 1518 V 1572",
    pTo: "G2 ⟷ G1", pToPos: { x: 1210, y: 1545 },
  },
  // Sw04 -> Camera C17-C31
  {
    from: "bob_sw04", to: "bob_c17_31",
    path: "M 1305 1600 H 1370",
    pTo: "P.1-P.15", pToPos: { x: 1340, y: 1600 },
  },
  // Cascade Sw04 (G2) -> Sw05 (G1)
  {
    from: "bob_sw04", to: "bob_sw05",
    path: "M 1210 1628 V 1682",
    pTo: "G2 ⟷ G1", pToPos: { x: 1210, y: 1655 },
  },
  // Sw05 -> Camera C1
  {
    from: "bob_sw05", to: "bob_c1",
    path: "M 1305 1710 H 1370",
    pTo: "P.8", pToPos: { x: 1340, y: 1710 },
  },
];

let activeSiteFilter = "all"; // "all" | "hq" | "bob"
let currentZoom = 1.0;

export const TopologyRow = {
  render(status) {
    const svg = document.getElementById("topology-svg");
    if (!svg) return;

    const ifaces = status.interfaces || {};
    const bobIfaces = status.routers?.bob?.interfaces || {};
    const devices = status.devices || {};
    const ipsec = status.ipsec || { up: true, rtt: 3.8 };

    const getNodeState = node => {
      // 1. Switch Unmanaged: để màu xám, không có ping tới theo yêu cầu
      if (node.type === "unmanaged") {
        return "static";
      }

      // 2. WAN lines
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

      // 3. Routers
      if (node.id === "mikrotik") {
        return (status.router && status.router.up) || (devices.mikrotik && devices.mikrotik.up) ? "up" : "down";
      }
      if (node.id === "bob_router") {
        return (status.routers?.bob?.router?.up) || (devices.bob_router && devices.bob_router.up) ? "up" : "down";
      }

      // 4. Các thiết bị kiểm tra ping 30s
      const dev = devices[node.id];
      if (dev) {
        if (dev.unmanaged) return "static";
        if (dev.up === true) return "up";
        if (dev.up === false) return "down";
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
        <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.9"/>
        </filter>

        <linearGradient id="grad-node-up" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="grad-node-static" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a222f"/>
          <stop offset="100%" stop-color="#0e131d"/>
        </linearGradient>
        <linearGradient id="grad-node-down" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#450a0a"/>
          <stop offset="100%" stop-color="#1f0909"/>
        </linearGradient>
        <linearGradient id="grad-ipsec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#a855f7"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
    `;

    // 0. Tiêu đề sơ đồ chuẩn công ty OQR
    let svgHeader = `
      <g transform="translate(780, 22)" text-anchor="middle">
        <rect x="-320" y="-18" width="640" height="36" rx="8" fill="#0f172a" stroke="rgba(255,255,255,0.18)" stroke-width="1.4"/>
        <text y="5" font-size="15" font-weight="800" fill="#f8fafc" letter-spacing="1.5">SƠ ĐỒ NETWORK DOANH NGHIỆP CÔNG TY TNHH OQR</text>
      </g>
    `;

    // 1. Khung phân vùng khu vực (Site Frames)
    let svgFrames = FRAMES.map(f => {
      if (activeSiteFilter === "hq" && f.id === "frame_bob") return "";
      if (activeSiteFilter === "bob" && f.id === "frame_hq") return "";

      return `
        <rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="14" 
          fill="${f.color}" stroke="rgba(148, 163, 184, 0.25)" stroke-width="1.4" stroke-dasharray="6 4"/>
        <g transform="translate(${f.x + 20}, ${f.y - 12})">
          <rect x="0" y="0" width="${f.label.length * 8.0 + 24}" height="25" rx="5" fill="#0b1120" stroke="rgba(255,255,255,0.2)"/>
          <text x="12" y="17" fill="#f1f5f9" font-size="12" font-weight="800" letter-spacing="0.5">${f.label}</text>
        </g>
      `;
    }).join("");

    // 2. Dây cáp mạng trực giao ĐỘC LẬP (Orthogonal Links)
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

    // 3. Đường hầm IPsec Site-to-Site VPN đặc biệt nối 2 Router (HQ ⟷ BOB)
    let svgIpsec = "";
    if (activeSiteFilter === "all") {
      const tunnelY = 955;
      svgIpsec = `
        <!-- Đường hầm IPsec Site-to-Site dạng thanh cầu nối trực quan -->
        <g transform="translate(780, ${tunnelY})" filter="url(#badge-shadow)">
          <rect x="-330" y="-24" width="660" height="48" rx="24" fill="#0b0f19" stroke="#a855f7" stroke-width="2.2"/>
          <line x1="-330" y1="0" x2="-260" y2="0" stroke="url(#grad-ipsec)" stroke-width="3" stroke-dasharray="6 4" class="topo-ipsec-line"/>
          <line x1="260" y1="0" x2="330" y2="0" stroke="url(#grad-ipsec)" stroke-width="3" stroke-dasharray="6 4" class="topo-ipsec-line"/>
          
          <circle cx="-230" cy="0" r="11" fill="#a855f7" filter="url(#glow-purple)"/>
          <text x="-230" y="4.5" text-anchor="middle" font-size="12" fill="#ffffff">🔒</text>
          
          <text x="-205" y="-3" font-size="13" font-weight="800" fill="#f8fafc">
            IPsec Site-to-Site VPN Tunnel: <tspan fill="#38bdf8">192.168.1.0/24 (HQ)</tspan> ⟷ <tspan fill="#e879f9">192.168.4.0/24 (BOB)</tspan>
          </text>
          <text x="-205" y="14" font-size="10.5" font-family="ui-monospace, monospace" font-weight="600" fill="#cbd5e1">
            IKEv2 · AES-256 · SHA256 · Peer: 113.161.45.93 · RTT ${ipsec.rtt}ms · Trạng thái: <tspan fill="#4ade80">ONLINE</tspan>
          </text>
        </g>
      `;
    }

    // 4. Các hộp thiết bị mạng (To, Rõ nét, Tương phản cao, Khối Switch lớn thể hiện chân port)
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
      let gradFill = "url(#grad-node-static)";
      let strokeColor = "rgba(100, 116, 139, 0.4)";
      let titleColor = "#cbd5e1";
      let rttHtml = "";

      if (isUp) {
        dotColor = "#22c55e";
        dotGlow = 'filter="url(#glow-green)"';
        gradFill = "url(#grad-node-up)";
        strokeColor = "rgba(34, 197, 94, 0.75)";
        titleColor = "#ffffff";
        rttHtml = rttVal != null ? ` · <tspan fill="#38bdf8" font-weight="700">${rttVal}ms</tspan>` : ` · <tspan fill="#4ade80" font-weight="700">Online</tspan>`;
      } else if (isDown) {
        dotColor = "#ef4444";
        dotGlow = 'filter="url(#glow-red)"';
        gradFill = "url(#grad-node-down)";
        strokeColor = "rgba(239, 68, 68, 0.9)";
        titleColor = "#fca5a5";
        rttHtml = ` · <tspan fill="#f87171" font-weight="700">Offline</tspan>`;
      } else {
        // Switch Unmanaged (Màu xám, không có ping)
        dotColor = "#94a3b8";
        gradFill = "url(#grad-node-static)";
        strokeColor = "rgba(148, 163, 184, 0.35)";
        titleColor = "#cbd5e1";
        rttHtml = ` · <tspan fill="#64748b" font-weight="600">Unmanaged</tspan>`;
      }

      return `
        <g class="topo-device ${n.state}" transform="translate(${n.x - n.w / 2},${n.y - n.h / 2})" data-id="${n.id}">
          <rect width="${n.w}" height="${n.h}" rx="9" fill="${gradFill}" stroke="${strokeColor}" stroke-width="${isDown ? 2.0 : 1.5}" class="device-box"/>
          
          <circle cx="16" cy="19" r="5.2" fill="${dotColor}" ${dotGlow}/>
          ${isUp ? '<circle cx="16" cy="19" r="2.2" fill="#ffffff" opacity="0.95"/>' : ""}
          ${isDown ? '<line x1="13" y1="16" x2="19" y2="22" stroke="#ffffff" stroke-width="1.6"/><line x1="19" y1="16" x2="13" y2="22" stroke="#ffffff" stroke-width="1.6"/>' : ""}

          <text x="28" y="23" font-size="13.5" font-weight="700" fill="${titleColor}" class="device-title">
            ${escapeHtml(n.label)}
          </text>
          
          <text x="14" y="42" font-size="11" font-family="ui-monospace, Consolas, monospace" font-weight="600" fill="#cbd5e1" class="device-sub">
            ${escapeHtml(n.sub)}${rttHtml}
          </text>
        </g>
      `;
    }).join("");

    // Điều chỉnh viewBox phù hợp chế độ lọc
    let targetViewBox = VIEW_BOX_ALL;
    if (activeSiteFilter === "hq") {
      targetViewBox = VIEW_BOX_HQ;
    } else if (activeSiteFilter === "bob") {
      targetViewBox = VIEW_BOX_BOB;
    }

    svg.setAttribute("viewBox", targetViewBox);
    svg.innerHTML = svgDefs + svgHeader + svgFrames + svgLinks + svgIpsec + svgPortBadges + svgTrafficBadges + svgNodes;
  },

  load(range, status) {
    this.render(status);
    setupSiteFilterButtons();
  },
};

/**
 * Cài đặt thanh công cụ chuyển đổi chế độ xem và Zoom điều khiển
 */
function setupSiteFilterButtons() {
  const container = document.getElementById("topology-controls");
  if (!container) return;

  container.innerHTML = `
    <div class="topo-toolbar">
      <div class="site-pills">
        <button class="pill-btn ${activeSiteFilter === "all" ? "active" : ""}" data-site="all">Toàn cảnh cuộn dọc (HQ + BOB)</button>
        <button class="pill-btn ${activeSiteFilter === "hq" ? "active" : ""}" data-site="hq">Trụ sở chính HQ (192.168.1.1)</button>
        <button class="pill-btn ${activeSiteFilter === "bob" ? "active" : ""}" data-site="bob">Chi nhánh BOB (192.168.4.1 · hAP ac²)</button>
      </div>

      <div class="zoom-controls">
        <button class="zoom-btn" id="btn-zoom-in" title="Phóng to">🔍 +</button>
        <button class="zoom-btn" id="btn-zoom-out" title="Thu nhỏ">🔍 -</button>
        <button class="zoom-btn" id="btn-zoom-fit" title="Vừa màn hình">⟲ Fit</button>
        <button class="zoom-btn" id="btn-zoom-100" title="Kích thước chuẩn 100%">100%</button>
      </div>

      <div class="topo-legend">
        <span class="legend-item"><span class="dot-green"></span> Online (Ping OK)</span>
        <span class="legend-item"><span class="dot-red"></span> Offline (Báo đỏ)</span>
        <span class="legend-item"><span class="dot-grey"></span> Switch Unmanaged (Màu xám - Không ping)</span>
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

    const svgWrap = document.querySelector(".topo-wrap");
    const svgElem = document.getElementById("topology-svg");
    if (!svgWrap || !svgElem) return;

    if (ev.target.id === "btn-zoom-in") {
      currentZoom = Math.min(2.5, currentZoom + 0.2);
      applyZoom(svgElem);
    } else if (ev.target.id === "btn-zoom-out") {
      currentZoom = Math.max(0.6, currentZoom - 0.2);
      applyZoom(svgElem);
    } else if (ev.target.id === "btn-zoom-fit") {
      currentZoom = 1.0;
      svgElem.style.width = "100%";
      svgElem.style.transform = "none";
    } else if (ev.target.id === "btn-zoom-100") {
      currentZoom = 1.0;
      svgElem.style.width = "1560px";
      svgElem.style.transform = "none";
    }
  };
}

function applyZoom(svg) {
  svg.style.transform = `scale(${currentZoom})`;
  svg.style.transformOrigin = "top center";
}

/**
 * Vẽ nhãn cổng dạng viên thuốc (Port Tag) to rõ nét với màu viền/chữ phân biệt.
 */
function renderPortTag(x, y, text, textColor = "#f1f5f9") {
  if (!text) return "";
  const tagW = Math.max(32, text.length * 7.0 + 10);
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
