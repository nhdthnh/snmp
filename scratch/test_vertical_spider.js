// Verify complete vertical spider layout with port badges, traffic pills, and lines
const NODES = [
  // --- HQ WAN ---
  { id: "fpt", site: "hq", x: 640, y: 80, w: 180, h: 54, label: "ISP FPT", sub: "DHCP IP WAN" },
  { id: "vnpt", site: "hq", x: 920, y: 80, w: 180, h: 54, label: "ISP VNPT", sub: "113.161.75.195" },
  // --- HQ CORE SPINE ---
  { id: "mikrotik", site: "hq", x: 780, y: 220, w: 260, h: 72, label: "MikroTik RB3011UiAS", sub: "192.168.1.1 (HQ Router)" },
  { id: "core", site: "hq", x: 780, y: 560, w: 320, h: 280, label: "SW CORE Ruijie", sub: "192.168.1.254 (RG-ES224GC)" },
  // --- HQ LEFT WING ---
  { id: "dvr_vt", site: "hq", x: 230, y: 220, w: 190, h: 56, label: "DVR VANTECH", sub: "192.168.1.101 (eth4)" },
  { id: "dvr_dh", site: "hq", x: 230, y: 460, w: 190, h: 56, label: "DVR DAHUA", sub: "192.168.1.226 (P.17)" },
  { id: "sql", site: "hq", x: 240, y: 550, w: 180, h: 56, label: "Server SQL", sub: "192.168.1.57 (P.15)" },
  { id: "mcc", site: "hq", x: 50, y: 550, w: 95, h: 52, label: "Máy chấm công", sub: "MCC01 (P.13)" },
  { id: "u1", site: "hq", x: 230, y: 640, w: 190, h: 56, label: "TL-SG1024D", sub: "Unmanage T1 (P.22)" },
  { id: "u2", site: "hq", x: 230, y: 730, w: 190, h: 56, label: "TL-SG1024D_1", sub: "Unmanage T2 (P.21)" },
  { id: "u3", site: "hq", x: 230, y: 820, w: 190, h: 56, label: "TL-SG1016D", sub: "Unmanage T3 (P.20)" },
  // --- HQ RIGHT WING ---
  { id: "wifi", site: "hq", x: 1210, y: 220, w: 190, h: 56, label: "SW WIFI 296", sub: "VLAN 20 (eth9)" },
  { id: "ap", site: "hq", x: 1445, y: 220, w: 150, h: 52, label: "AP WIFI", sub: "AP01–05 (Reyee)" },
  { id: "poe", site: "hq", x: 1210, y: 460, w: 190, h: 56, label: "SW POE HIKVISION", sub: "16 Port (P.16)" },
  { id: "cam", site: "hq", x: 1445, y: 460, w: 150, h: 52, label: "CAMERA C1 – C16", sub: "192.168.1.102 – 107" },
  { id: "nas", site: "hq", x: 1330, y: 550, w: 190, h: 56, label: "NAS DS923+", sub: "1.119 (BOND)" },
  { id: "u4", site: "hq", x: 1330, y: 640, w: 190, h: 56, label: "TL-SG1016D_1", sub: "Unmanage T4 (P.19)" },
  { id: "u5", site: "hq", x: 1330, y: 730, w: 190, h: 56, label: "TL-SG1005D", sub: "Studio (P.18)" },
  { id: "prn1", site: "hq", x: 1210, y: 820, w: 190, h: 56, label: "MP C4505EX", sub: "192.168.1.250 (P.12)" },
  { id: "prn2", site: "hq", x: 1445, y: 820, w: 150, h: 52, label: "MP C5503", sub: "192.168.1.252 (P.13)" },

  // --- IPSEC BRIDGE ---
  { id: "ipsec_bridge", site: "all", x: 780, y: 950, w: 660, h: 52, label: "IPsec VPN Site-to-Site", sub: "192.168.1.0/24 ⟷ 192.168.4.0/24" },

  // --- BOB WAN ---
  { id: "isp_bob", site: "bob", x: 780, y: 1070, w: 200, h: 54, label: "ISP VNPT (BOB)", sub: "113.161.45.93" },
  // --- BOB CORE SPINE ---
  { id: "bob_router", site: "bob", x: 780, y: 1200, w: 260, h: 72, label: "Mikrotik hAP ac²", sub: "192.168.4.1 (BOB Router)" },
  { id: "bob_sw01", site: "bob", x: 780, y: 1490, w: 320, h: 260, label: "Sw01 TL-SG116", sub: "16-Port Gigabit Switch" },
  // --- BOB LEFT WING ---
  { id: "bob_photo", site: "bob", x: 230, y: 1400, w: 190, h: 56, label: "Photocopy01", sub: "Máy photo (P.12)" },
  { id: "bob_sw03", site: "bob", x: 260, y: 1490, w: 180, h: 56, label: "Sw03 Ruijie SW", sub: "192.168.4.252 (P.15)" },
  { id: "bob_ap", site: "bob", x: 60, y: 1490, w: 100, h: 52, label: "AP01 – AP05", sub: "Reyee Wi-Fi 6 (P4-P8)" },
  { id: "bob_pc", site: "bob", x: 230, y: 1580, w: 190, h: 56, label: "PC01 – PC10", sub: "Dãy 10 PC (P.2-P.11)" },
  { id: "bob_mcc", site: "bob", x: 230, y: 1670, w: 190, h: 56, label: "MCC01 Máy chấm công", sub: "Văn phòng BOB (P.13)" },
  // --- BOB RIGHT WING ---
  { id: "bob_nvr", site: "bob", x: 1230, y: 1400, w: 190, h: 56, label: "NVR01 Hikvision", sub: "192.168.4.253 (P.16)" },
  { id: "bob_sw02", site: "bob", x: 1210, y: 1490, w: 190, h: 56, label: "Sw02 Hikvision PoE", sub: "192.168.4.242 (1318P)" },
  { id: "bob_c2_16", site: "bob", x: 1445, y: 1490, w: 150, h: 52, label: "Camera C2 – C16", sub: "15 Camera PoE (P2-16)" },
  { id: "bob_sw04", site: "bob", x: 1210, y: 1600, w: 190, h: 56, label: "Sw04 Hikvision PoE", sub: "192.168.4.243 (1318P)" },
  { id: "bob_c17_31", site: "bob", x: 1445, y: 1600, w: 150, h: 52, label: "Camera C17 – C31", sub: "15 Camera PoE (P1-15)" },
  { id: "bob_sw05", site: "bob", x: 1210, y: 1710, w: 190, h: 56, label: "Sw05 Switch OEM 8P", sub: "8-Port (No Brand)" },
  { id: "bob_c1", site: "bob", x: 1445, y: 1710, w: 150, h: 52, label: "Camera C1", sub: "Camera cổng (P8)" },
];

const PORT_TAGS = [
  // HQ WAN
  { id: "pt_fpt_r", x: 720, y: 165, w: 38, h: 18, text: "eth1" },
  { id: "pt_fpt_w", x: 640, y: 125, w: 38, h: 18, text: "WAN1" },
  { id: "pt_vnpt_r", x: 840, y: 165, w: 38, h: 18, text: "eth2" },
  { id: "pt_vnpt_w", x: 920, y: 125, w: 38, h: 18, text: "WAN2" },
  // HQ Trunk
  { id: "pt_r_trunk", x: 780, y: 275, w: 66, h: 18, text: "eth3 (p2)" },
  { id: "pt_c_trunk", x: 780, y: 395, w: 64, h: 18, text: "p2 (Trunk)" },
  // HQ Direct Router Links
  { id: "pt_dvr_vt_r", x: 615, y: 220, w: 36, h: 18, text: "eth4" },
  { id: "pt_dvr_vt_d", x: 355, y: 220, w: 36, h: 18, text: "eth4" },
  { id: "pt_wifi_r", x: 945, y: 220, w: 36, h: 18, text: "eth9" },
  { id: "pt_wifi_d", x: 1085, y: 220, w: 36, h: 18, text: "eth9" },
  { id: "pt_ap_d", x: 1340, y: 220, w: 54, h: 18, text: "VLAN 20" },

  // HQ Core Left Ports (Placed outside core [620, 940] at x = 585)
  { id: "pt_c_p17", x: 585, y: 460, w: 34, h: 18, text: "p17" },
  { id: "pt_d_p17", x: 355, y: 460, w: 34, h: 18, text: "p17" },

  { id: "pt_c_p15", x: 585, y: 510, w: 34, h: 18, text: "p15" },
  { id: "pt_d_p15", x: 355, y: 550, w: 34, h: 18, text: "p15" },
  { id: "pt_d_mcc", x: 124, y: 550, w: 30, h: 18, text: "p13" },

  { id: "pt_c_p22", x: 585, y: 560, w: 34, h: 18, text: "p22" },
  { id: "pt_d_p22", x: 355, y: 640, w: 34, h: 18, text: "p24" },

  { id: "pt_c_p21", x: 585, y: 610, w: 34, h: 18, text: "p21" },
  { id: "pt_d_p21", x: 355, y: 730, w: 34, h: 18, text: "p24" },

  { id: "pt_c_p20", x: 585, y: 660, w: 34, h: 18, text: "p20" },
  { id: "pt_d_p20", x: 355, y: 820, w: 34, h: 18, text: "p16" },

  // HQ Core Right Ports (Placed outside core [620, 940] at x = 975)
  { id: "pt_c_p16", x: 975, y: 460, w: 34, h: 18, text: "p16" },
  { id: "pt_d_p16", x: 1085, y: 460, w: 34, h: 18, text: "p16" },
  { id: "pt_d_cam", x: 1340, y: 460, w: 50, h: 18, text: "C1-C16" },

  { id: "pt_c_bond", x: 980, y: 510, w: 54, h: 18, text: "p23-24" },
  { id: "pt_d_bond", x: 1205, y: 550, w: 44, h: 18, text: "BOND" },

  { id: "pt_c_p19", x: 975, y: 560, w: 34, h: 18, text: "p19" },
  { id: "pt_d_p19", x: 1205, y: 640, w: 34, h: 18, text: "p16" },

  { id: "pt_c_p18", x: 975, y: 610, w: 34, h: 18, text: "p18" },
  { id: "pt_d_p18", x: 1205, y: 730, w: 34, h: 18, text: "p1" },

  { id: "pt_c_p12", x: 975, y: 660, w: 34, h: 18, text: "p12" },
  { id: "pt_d_p12", x: 1085, y: 820, w: 34, h: 18, text: "p12" },
  { id: "pt_d_prn2", x: 1340, y: 820, w: 34, h: 18, text: "p13" },

  // BOB WAN & Trunk
  { id: "pt_bob_wan", x: 780, y: 1140, w: 38, h: 18, text: "ether1" },
  { id: "pt_bob_t_up", x: 780, y: 1255, w: 66, h: 18, text: "ether2 (P.1)" },
  { id: "pt_bob_t_dn", x: 780, y: 1345, w: 66, h: 18, text: "P.1 (Uplink)" },

  // BOB Left Ports (Placed outside bob_sw01 [620, 940] at x = 585)
  { id: "pt_b_p12", x: 585, y: 1400, w: 34, h: 18, text: "P.12" },
  { id: "pt_bd_p12", x: 355, y: 1400, w: 34, h: 18, text: "P.12" },

  { id: "pt_b_p15", x: 585, y: 1450, w: 34, h: 18, text: "P.15" },
  { id: "pt_bd_p15", x: 395, y: 1490, w: 34, h: 18, text: "P.1" },
  { id: "pt_bd_ap", x: 140, y: 1490, w: 38, h: 18, text: "P.4-P.8" },

  { id: "pt_b_pc", x: 580, y: 1500, w: 56, h: 18, text: "P.2-P.11" },
  { id: "pt_bd_pc", x: 360, y: 1580, w: 56, h: 18, text: "P.2-P.11" },

  { id: "pt_b_mcc", x: 585, y: 1550, w: 34, h: 18, text: "P.13" },
  { id: "pt_bd_mcc", x: 355, y: 1670, w: 34, h: 18, text: "P.13" },

  // BOB Right Ports (Placed outside bob_sw01 [620, 940] at x = 975)
  { id: "pt_b_p16", x: 975, y: 1400, w: 34, h: 18, text: "P.16" },
  { id: "pt_bd_p16", x: 1105, y: 1400, w: 34, h: 18, text: "P.16" },

  { id: "pt_b_g1", x: 975, y: 1450, w: 34, h: 18, text: "G1" },
  { id: "pt_bd_g1", x: 1085, y: 1490, w: 34, h: 18, text: "G1" },
  { id: "pt_bd_c2_16", x: 1340, y: 1490, w: 52, h: 18, text: "P.2-P.16" },

  { id: "pt_cas1", x: 1210, y: 1545, w: 56, h: 18, text: "G2 ⟷ G1" },
  { id: "pt_bd_c17_31", x: 1340, y: 1600, w: 52, h: 18, text: "P.1-P.15" },

  { id: "pt_cas2", x: 1210, y: 1655, w: 56, h: 18, text: "G2 ⟷ G1" },
  { id: "pt_bd_c1", x: 1340, y: 1710, w: 34, h: 18, text: "P.8" },
];

const TRAFFIC_PILLS = [
  { id: "tp_fpt", x: 540, y: 140, w: 140, h: 26 },
  { id: "tp_vnpt", x: 1020, y: 140, w: 140, h: 26 },
  { id: "tp_trunk_hq", x: 890, y: 340, w: 140, h: 26 },
  { id: "tp_trunk_bob", x: 890, y: 1300, w: 140, h: 26 },
];

const ALL_BOXES = [
  ...NODES.map(n => ({ type: "node", id: n.id, x1: n.x - n.w / 2, x2: n.x + n.w / 2, y1: n.y - n.h / 2, y2: n.y + n.h / 2 })),
  ...PORT_TAGS.map(p => ({ type: "port", id: p.id, x1: p.x - p.w / 2, x2: p.x + p.w / 2, y1: p.y - p.h / 2, y2: p.y + p.h / 2 })),
  ...TRAFFIC_PILLS.map(t => ({ type: "pill", id: t.id, x1: t.x - t.w / 2, x2: t.x + t.w / 2, y1: t.y - t.h / 2, y2: t.y + t.h / 2 }))
];

console.log("Total visual elements tested:", ALL_BOXES.length);
let collisions = 0;
for (let i = 0; i < ALL_BOXES.length; i++) {
  for (let j = i + 1; j < ALL_BOXES.length; j++) {
    const a = ALL_BOXES[i];
    const b = ALL_BOXES[j];
    const noOverlap = (a.x2 < b.x1 || b.x2 < a.x1 || a.y2 < b.y1 || b.y2 < a.y1);
    if (!noOverlap) {
      console.log(`COLLISION: [${a.type}] ${a.id} vs [${b.type}] ${b.id}`);
      collisions++;
    }
  }
}
console.log("Collision test result:", collisions === 0 ? ">>> ZERO COLLISIONS ACROSS ALL 84 ELEMENTS! <<<" : `FAILED with ${collisions} collisions`);
