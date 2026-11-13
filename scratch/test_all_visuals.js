// Comprehensive collision test for all elements in both HQ and BOB

const HQ_NODES = [
  // Tier 1: WAN
  { id: "fpt", site: "hq", tier: 1, x: 650, y: 75, label: "ISP FPT", sub: "DHCP IP WAN", w: 150, h: 52 },
  { id: "vnpt", site: "hq", tier: 1, x: 950, y: 75, label: "ISP VNPT", sub: "113.161.75.195", w: 150, h: 52 },

  // Tier 2: Router HQ
  { id: "mikrotik", site: "hq", tier: 2, x: 800, y: 200, label: "Mikrotik RB3011UiAS", sub: "192.168.1.1 (HQ Router)", w: 185, h: 54 },

  // Tier 3: Core Switch HQ
  { id: "core", site: "hq", tier: 3, x: 800, y: 330, label: "SW CORE Ruijie", sub: "192.168.1.254 (RG-ES224GC)", w: 195, h: 54 },

  // Tier 4: Direct under Core & Mikrotik (Single Row at y = 480)
  { id: "dvr_vt", site: "hq", tier: 4, x: 75, y: 480, label: "DVR VANTECH", sub: "192.168.1.101 (eth4)", w: 140, h: 52 },
  { id: "dvr_dh", site: "hq", tier: 4, x: 225, y: 480, label: "DVR DAHUA", sub: "192.168.1.226 (P.17)", w: 140, h: 52 },
  { id: "sql", site: "hq", tier: 4, x: 375, y: 480, label: "Server SQL", sub: "192.168.1.57 (P.15)", w: 140, h: 52 },
  { id: "u1", site: "hq", tier: 4, x: 525, y: 480, label: "TL-SG1024D", sub: "Unmanage (P.22)", w: 140, h: 52 },
  { id: "u2", site: "hq", tier: 4, x: 675, y: 480, label: "TL-SG1024D_1", sub: "Unmanage (P.21)", w: 140, h: 52 },
  { id: "u3", site: "hq", tier: 4, x: 825, y: 480, label: "TL-SG1016D", sub: "Unmanage (P.20)", w: 140, h: 52 },
  { id: "u4", site: "hq", tier: 4, x: 975, y: 480, label: "TL-SG1016D_1", sub: "Unmanage (P.19)", w: 140, h: 52 },
  { id: "u5", site: "hq", tier: 4, x: 1125, y: 480, label: "TL-SG1005D", sub: "Studio (P.18)", w: 140, h: 52 },
  { id: "poe", site: "hq", tier: 4, x: 1275, y: 480, label: "SW POE HIKVISION", sub: "16 Port (P.16)", w: 140, h: 52 },
  { id: "nas", site: "hq", tier: 4, x: 1425, y: 480, label: "NAS DS923+", sub: "1.119 (P.23-24 BOND)", w: 140, h: 52 },
  { id: "prn1", site: "hq", tier: 4, x: 1575, y: 480, label: "MP C4505EX", sub: "192.168.1.250 (P.12)", w: 140, h: 52 },
  { id: "wifi", site: "hq", tier: 4, x: 1725, y: 480, label: "SW WIFI 296", sub: "VLAN 20 (eth9)", w: 140, h: 52 },

  // Tier 5: Endpoints (y = 630)
  { id: "mcc", site: "hq", tier: 5, x: 375, y: 630, label: "Máy chấm công", sub: "MCC01 (P.13)", w: 140, h: 52 },
  { id: "cam", site: "hq", tier: 5, x: 1275, y: 630, label: "CAMERA C1 – C16", sub: "192.168.1.102 – 107", w: 140, h: 52 },
  { id: "prn2", site: "hq", tier: 5, x: 1575, y: 630, label: "MP C5503", sub: "192.168.1.252", w: 140, h: 52 },
  { id: "ap", site: "hq", tier: 5, x: 1725, y: 630, label: "AP WIFI", sub: "AP01–05 (Reyee/Unifi)", w: 140, h: 52 },
];

const BOB_NODES = [
  // Tier 1: WAN BOB (y = 75)
  { id: "isp_bob", site: "bob", tier: 1, x: 2600, y: 75, label: "ISP VNPT (BOB)", sub: "113.161.45.93", w: 155, h: 52 },

  // Tier 2: Router BOB hAP ac² (y = 200)
  { id: "bob_router", site: "bob", tier: 2, x: 2600, y: 200, label: "Mikrotik hAP ac²", sub: "192.168.4.1 (BOB Router)", w: 185, h: 54 },

  // Tier 3: Core Switch Sw01 TL-SG116 (y = 330)
  { id: "bob_sw01", site: "bob", tier: 3, x: 2600, y: 330, label: "Sw01 TL-SG116", sub: "16-Port Gigabit Switch", w: 185, h: 54 },

  // Tier 4: Direct under Sw01 TL-SG116 (y = 480)
  // Left branches:
  { id: "bob_sw03", site: "bob", tier: 4, x: 1950, y: 480, label: "Sw03 Ruijie SW", sub: "192.168.4.252 (P.15)", w: 148, h: 52 },
  { id: "bob_photo", site: "bob", tier: 4, x: 2110, y: 480, label: "Photocopy01", sub: "Máy photo (P.12)", w: 140, h: 52 },
  { id: "bob_pc", site: "bob", tier: 4, x: 2270, y: 480, label: "PC01 – PC10", sub: "Dãy 10 PC (P.2-P.11)", w: 140, h: 52 },
  // Center: Sw02 PoE
  { id: "bob_sw02", site: "bob", tier: 4, x: 2430, y: 480, label: "Sw02 Hikvision PoE", sub: "192.168.4.242 (1318P)", w: 150, h: 52 },
  // Cascade to Sw04 PoE
  { id: "bob_sw04", site: "bob", tier: 4, x: 2630, y: 480, label: "Sw04 Hikvision PoE", sub: "192.168.4.243 (1318P)", w: 150, h: 52 },
  // Cascade to Sw05 OEM 8P
  { id: "bob_sw05", site: "bob", tier: 4, x: 2830, y: 480, label: "Sw05 Switch OEM 8P", sub: "8-Port (No Brand)", w: 148, h: 52 },
  // Right branches of Sw01:
  { id: "bob_nvr", site: "bob", tier: 4, x: 3010, y: 480, label: "NVR01 Hikvision", sub: "192.168.4.253 (P.16)", w: 145, h: 52 },
  { id: "bob_mcc", site: "bob", tier: 4, x: 3180, y: 480, label: "MCC01 Máy chấm công", sub: "Văn phòng BOB (P.13)", w: 145, h: 52 },

  // Tier 5: BOB Endpoints (y = 630)
  { id: "bob_ap", site: "bob", tier: 5, x: 1950, y: 630, label: "AP01 – AP05", sub: "Reyee Wi-Fi 6 (P4-P8)", w: 148, h: 52 },
  { id: "bob_c2_16", site: "bob", tier: 5, x: 2430, y: 630, label: "Camera C2 – C16", sub: "15 Camera PoE (P2-16)", w: 150, h: 52 },
  { id: "bob_c17_31", site: "bob", tier: 5, x: 2630, y: 630, label: "Camera C17 – C31", sub: "15 Camera PoE (P1-15)", w: 150, h: 52 },
  { id: "bob_c1", site: "bob", tier: 5, x: 2830, y: 630, label: "Camera C1", sub: "Camera cổng (P8)", w: 148, h: 52 },
];

const ALL_NODES = [...HQ_NODES, ...BOB_NODES];

const PORT_BADGES = [
  { id: "p_fpt", x: 740, y: 162, w: 36, h: 18 },
  { id: "p_vnpt", x: 860, y: 162, w: 36, h: 18 },
  { id: "p_bob_wan", x: 2600, y: 156, w: 36, h: 18 },
  { id: "p_core_up", x: 800, y: 240, w: 30, h: 18 },
  { id: "p_core_down", x: 800, y: 290, w: 30, h: 18 },
  { id: "p_bob_rtr_down", x: 2600, y: 242, w: 42, h: 18 },
  { id: "p_bob_sw01_up", x: 2600, y: 288, w: 32, h: 18 },
  { id: "p_dvr_vt", x: 75, y: 435, w: 36, h: 18 },
  { id: "p_dvr_dh", x: 225, y: 440, w: 32, h: 18 },
  { id: "p_sql", x: 375, y: 440, w: 32, h: 18 },
  { id: "p_u1", x: 525, y: 440, w: 32, h: 18 },
  { id: "p_u2", x: 675, y: 440, w: 32, h: 18 },
  { id: "p_u3", x: 825, y: 440, w: 32, h: 18 },
  { id: "p_u4", x: 975, y: 440, w: 32, h: 18 },
  { id: "p_u5", x: 1125, y: 440, w: 32, h: 18 },
  { id: "p_poe", x: 1275, y: 440, w: 32, h: 18 },
  { id: "p_nas", x: 1425, y: 440, w: 48, h: 18 },
  { id: "p_prn1", x: 1575, y: 440, w: 36, h: 18 },
  { id: "p_wifi", x: 1725, y: 440, w: 36, h: 18 },
  // BOB ports
  { id: "p_bob_sw03", x: 1950, y: 440, w: 40, h: 18 },
  { id: "p_bob_photo", x: 2110, y: 440, w: 36, h: 18 },
  { id: "p_bob_pc", x: 2270, y: 440, w: 56, h: 18 },
  { id: "p_bob_sw02", x: 2430, y: 440, w: 32, h: 18 },
  { id: "p_bob_sw04", x: 2530, y: 480, w: 38, h: 18 },
  { id: "p_bob_sw05", x: 2730, y: 480, w: 38, h: 18 },
  { id: "p_bob_nvr", x: 3010, y: 440, w: 36, h: 18 },
  { id: "p_bob_mcc", x: 3180, y: 440, w: 36, h: 18 },
  // BOB Endpoints tags
  { id: "p_bob_ap_tag", x: 1950, y: 588, w: 44, h: 18 },
  { id: "p_bob_c2_16_tag", x: 2430, y: 588, w: 48, h: 18 },
  { id: "p_bob_c17_31_tag", x: 2630, y: 588, w: 48, h: 18 },
  { id: "p_bob_c1_tag", x: 2830, y: 588, w: 30, h: 18 },
];

const TRAFFIC_PILLS = [
  { id: "pill_fpt", x: 650, y: 138, w: 160, h: 26 },
  { id: "pill_vnpt", x: 950, y: 138, w: 160, h: 26 },
  { id: "pill_bob_wan", x: 2600, y: 130, w: 160, h: 26 },
  { id: "pill_core_trunk", x: 910, y: 265, w: 160, h: 26 },
  { id: "pill_dvr_vt", x: 400, y: 200, w: 160, h: 26 },
  { id: "pill_wifi", x: 1300, y: 270, w: 160, h: 26 },
  { id: "pill_bob_trunk", x: 2730, y: 265, w: 160, h: 26 },
];

const IPSEC_BADGE = {
  id: "ipsec_badge", x: 1842.5, y: 200, w: 420, h: 36
};

// Combine all bounding boxes
const ALL_BOXES = [
  ...ALL_NODES.map(n => ({ type: "node", id: n.id, x1: n.x - n.w / 2, x2: n.x + n.w / 2, y1: n.y - n.h / 2, y2: n.y + n.h / 2 })),
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

console.log("Overall collision test result:", totalCollisions === 0 ? ">>> ALL 74 ELEMENTS ZERO COLLISIONS! <<<" : `FAILED (${totalCollisions} collisions)`);
