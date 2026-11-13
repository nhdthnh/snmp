const NODES = [
  // ==================== HQ ====================
  { id: "fpt", site: "hq", x: 530, y: 75, label: "ISP FPT", sub: "DHCP IP WAN", w: 145, h: 50 },
  { id: "vnpt", site: "hq", x: 770, y: 75, label: "ISP VNPT", sub: "113.161.75.195", w: 145, h: 50 },
  { id: "mikrotik", site: "hq", x: 650, y: 195, label: "Mikrotik RB3011UiAS", sub: "192.168.1.1 (HQ Router)", w: 185, h: 54 },
  { id: "core", site: "hq", x: 650, y: 350, label: "SW CORE Ruijie", sub: "192.168.1.254 (RG-ES224GC)", w: 195, h: 54 },

  // Left Wing:
  { id: "dvr_vt", site: "hq", x: 260, y: 195, label: "DVR VANTECH", sub: "192.168.1.101 (eth4)", w: 148, h: 52 },
  { id: "dvr_dh", site: "hq", x: 260, y: 310, label: "DVR DAHUA", sub: "192.168.1.226 (P.17)", w: 148, h: 52 },
  { id: "sql", site: "hq", x: 260, y: 425, label: "Server SQL", sub: "192.168.1.57 (P.15)", w: 148, h: 52 },
  { id: "mcc", site: "hq", x: 80, y: 425, label: "Máy chấm công", sub: "MCC01 (P.13)", w: 135, h: 50 },
  { id: "u1", site: "hq", x: 260, y: 540, label: "TL-SG1024D", sub: "Unmanage T1 (P.22)", w: 148, h: 52 },
  { id: "u2", site: "hq", x: 260, y: 655, label: "TL-SG1024D_1", sub: "Unmanage T2 (P.21)", w: 148, h: 52 },
  { id: "u3", site: "hq", x: 260, y: 770, label: "TL-SG1016D", sub: "Unmanage T3 (P.20)", w: 148, h: 52 },

  // Right Wing:
  { id: "wifi", site: "hq", x: 1040, y: 195, label: "SW WIFI 296", sub: "VLAN 20 (eth9)", w: 148, h: 52 },
  { id: "ap", site: "hq", x: 1230, y: 195, label: "AP WIFI", sub: "AP01–05 (Reyee)", w: 138, h: 50 },
  { id: "poe", site: "hq", x: 1040, y: 310, label: "SW POE HIKVISION", sub: "16 Port (P.16)", w: 148, h: 52 },
  { id: "cam", site: "hq", x: 1230, y: 310, label: "CAMERA C1 – C16", sub: "192.168.1.102 – 107", w: 140, h: 50 },
  { id: "nas", site: "hq", x: 1040, y: 425, label: "NAS DS923+", sub: "1.119 (P.23-24 BOND)", w: 148, h: 52 },
  { id: "u4", site: "hq", x: 1040, y: 540, label: "TL-SG1016D_1", sub: "Unmanage T4 (P.19)", w: 148, h: 52 },
  { id: "u5", site: "hq", x: 1040, y: 655, label: "TL-SG1005D", sub: "Studio (P.18)", w: 148, h: 52 },
  { id: "prn1", site: "hq", x: 1040, y: 770, label: "MP C4505EX", sub: "192.168.1.250 (P.12)", w: 148, h: 52 },
  { id: "prn2", site: "hq", x: 1230, y: 770, label: "MP C5503", sub: "192.168.1.252 (P.13)", w: 138, h: 50 },

  // ==================== BOB ====================
  { id: "isp_bob", site: "bob", x: 2120, y: 75, label: "ISP VNPT (BOB)", sub: "113.161.45.93", w: 155, h: 50 },
  { id: "bob_router", site: "bob", x: 2120, y: 195, label: "Mikrotik hAP ac²", sub: "192.168.4.1 (BOB Router)", w: 185, h: 54 },
  { id: "bob_sw01", site: "bob", x: 2120, y: 350, label: "Sw01 TL-SG116", sub: "16-Port Gigabit Switch", w: 185, h: 54 },

  // Left Wing:
  { id: "bob_photo", site: "bob", x: 1750, y: 250, label: "Photocopy01", sub: "Máy photo (P.12)", w: 145, h: 52 },
  { id: "bob_sw03", site: "bob", x: 1750, y: 365, label: "Sw03 Ruijie SW", sub: "192.168.4.252 (P.15)", w: 148, h: 52 },
  { id: "bob_ap", site: "bob", x: 1550, y: 365, label: "AP01 – AP05", sub: "Reyee Wi-Fi 6 (P4-P8)", w: 145, h: 50 },
  { id: "bob_pc", site: "bob", x: 1750, y: 480, label: "PC01 – PC10", sub: "Dãy 10 PC (P.2-P.11)", w: 145, h: 52 },
  { id: "bob_mcc", site: "bob", x: 1750, y: 595, label: "MCC01 Máy chấm công", sub: "Văn phòng BOB (P.13)", w: 145, h: 52 },

  // Right Wing:
  { id: "bob_nvr", site: "bob", x: 2470, y: 250, label: "NVR01 Hikvision", sub: "192.168.4.253 (P.16)", w: 148, h: 52 },
  { id: "bob_sw02", site: "bob", x: 2470, y: 365, label: "Sw02 Hikvision PoE", sub: "192.168.4.242 (1318P)", w: 150, h: 52 },
  { id: "bob_c2_16", site: "bob", x: 2680, y: 365, label: "Camera C2 – C16", sub: "15 Camera PoE (P2-16)", w: 145, h: 50 },
  { id: "bob_sw04", site: "bob", x: 2470, y: 480, label: "Sw04 Hikvision PoE", sub: "192.168.4.243 (1318P)", w: 150, h: 52 },
  { id: "bob_c17_31", site: "bob", x: 2680, y: 480, label: "Camera C17 – C31", sub: "15 Camera PoE (P1-15)", w: 145, h: 50 },
  { id: "bob_sw05", site: "bob", x: 2470, y: 595, label: "Sw05 Switch OEM 8P", sub: "8-Port (No Brand)", w: 148, h: 52 },
  { id: "bob_c1", site: "bob", x: 2680, y: 595, label: "Camera C1", sub: "Camera cổng (P8)", w: 145, h: 50 },
];

const PORT_BADGES = [
  // HQ WAN
  { id: "p_fpt", x: 530, y: 150, w: 36, h: 18 },
  { id: "p_vnpt", x: 770, y: 150, w: 36, h: 18 },
  // Core Trunk
  { id: "p_core_up", x: 650, y: 240, w: 60, h: 18 },    // eth3 (p2)
  { id: "p_core_down", x: 650, y: 305, w: 64, h: 18 },  // p2 (Trunk)
  // Left Wing ports:
  { id: "p_dvr_vt", x: 350, y: 195, w: 36, h: 18 },
  { id: "p_dvr_dh", x: 350, y: 310, w: 32, h: 18 },
  { id: "p_sql", x: 350, y: 425, w: 32, h: 18 },
  { id: "p_mcc", x: 165, y: 425, w: 36, h: 18 },
  { id: "p_u1", x: 350, y: 540, w: 32, h: 18 },
  { id: "p_u2", x: 350, y: 655, w: 32, h: 18 },
  { id: "p_u3", x: 350, y: 770, w: 32, h: 18 },
  // Right Wing ports:
  { id: "p_wifi", x: 950, y: 195, w: 36, h: 18 },
  { id: "p_ap", x: 1135, y: 195, w: 46, h: 18 },
  { id: "p_poe", x: 950, y: 310, w: 32, h: 18 },
  { id: "p_cam", x: 1135, y: 310, w: 44, h: 18 },
  { id: "p_nas", x: 945, y: 425, w: 54, h: 18 },
  { id: "p_u4", x: 950, y: 540, w: 32, h: 18 },
  { id: "p_u5", x: 950, y: 655, w: 32, h: 18 },
  { id: "p_prn1", x: 950, y: 770, w: 36, h: 18 },
  { id: "p_prn2", x: 1135, y: 770, w: 36, h: 18 },

  // BOB Ports:
  { id: "p_bob_wan", x: 2120, y: 150, w: 36, h: 18 },
  { id: "p_bob_trunk_up", x: 2120, y: 240, w: 66, h: 18 },   // ether2 (P.1)
  { id: "p_bob_trunk_down", x: 2120, y: 305, w: 66, h: 18 }, // P.1 (Uplink)
  // Left:
  { id: "p_bob_photo", x: 1840, y: 250, w: 36, h: 18 },
  { id: "p_bob_sw03", x: 1840, y: 365, w: 56, h: 18 },
  { id: "p_bob_ap", x: 1650, y: 365, w: 44, h: 18 },
  { id: "p_bob_pc", x: 1840, y: 480, w: 56, h: 18 },
  { id: "p_bob_mcc", x: 1840, y: 595, w: 36, h: 18 },
  // Right:
  { id: "p_bob_nvr", x: 2380, y: 250, w: 36, h: 18 },
  { id: "p_bob_sw02", x: 2380, y: 365, w: 48, h: 18 },
  { id: "p_bob_c2_16", x: 2575, y: 365, w: 48, h: 18 },
  { id: "p_bob_sw04", x: 2470, y: 422, w: 48, h: 18 },
  { id: "p_bob_c17_31", x: 2575, y: 480, w: 48, h: 18 },
  { id: "p_bob_sw05", x: 2470, y: 537, w: 48, h: 18 },
  { id: "p_bob_c1", x: 2575, y: 595, w: 32, h: 18 },
];

const TRAFFIC_PILLS = [
  { id: "pill_fpt", x: 440, y: 130, w: 140, h: 26 },
  { id: "pill_vnpt", x: 860, y: 130, w: 140, h: 26 },
  { id: "pill_core_trunk", x: 745, y: 272, w: 140, h: 26 },
  { id: "pill_bob_wan", x: 2210, y: 130, w: 140, h: 26 },
  { id: "pill_bob_trunk", x: 2215, y: 272, w: 140, h: 26 },
];

const IPSEC_BADGE = {
  id: "ipsec_badge", x: 1410, y: 195, w: 380, h: 36
};

// Combine all bounding boxes
const ALL_BOXES = [
  ...NODES.map(n => ({ type: "node", id: n.id, x1: n.x - n.w / 2, x2: n.x + n.w / 2, y1: n.y - n.h / 2, y2: n.y + n.h / 2 })),
  ...PORT_BADGES.map(p => ({ type: "port", id: p.id, x1: p.x - p.w / 2, x2: p.x + p.w / 2, y1: p.y - p.h / 2, y2: p.y + p.h / 2 })),
  ...TRAFFIC_PILLS.map(t => ({ type: "pill", id: t.id, x1: t.x - t.w / 2, x2: t.x + t.w / 2, y1: t.y - t.h / 2, y2: t.y + t.h / 2 })),
  { type: "ipsec", id: IPSEC_BADGE.id, x1: IPSEC_BADGE.x - IPSEC_BADGE.w / 2, x2: IPSEC_BADGE.x + IPSEC_BADGE.w / 2, y1: IPSEC_BADGE.y - IPSEC_BADGE.h / 2, y2: IPSEC_BADGE.y + IPSEC_BADGE.h / 2 }
];

console.log("Total visual elements tested:", ALL_BOXES.length);

let totalCollisions = 0;
for (let i = 0; i < ALL_BOXES.length; i++) {
  for (let j = i + 1; j < ALL_BOXES.length; j++) {
    const a = ALL_BOXES[i];
    const b = ALL_BOXES[j];
    const noOverlap = (a.x2 < b.x1 || b.x2 < a.x1 || a.y2 < b.y1 || b.y2 < a.y1);
    if (!noOverlap) {
      console.log(`COLLISION between [${a.type}] ${a.id} and [${b.type}] ${b.id}`);
      totalCollisions++;
    }
  }
}

console.log("Overall collision test result:", totalCollisions === 0 ? ">>> ALL 75 ELEMENTS ZERO COLLISIONS! <<<" : `FAILED (${totalCollisions} collisions)`);
