// Full spider collision check for both HQ and BOB

const NODES = [
  // ==================== HQ ====================
  // Center Column:
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
  // Center Column:
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

console.log("Total spider nodes:", NODES.length);

let collisions = 0;
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    const a = NODES[i];
    const b = NODES[j];
    const ax1 = a.x - a.w / 2, ax2 = a.x + a.w / 2, ay1 = a.y - a.h / 2, ay2 = a.y + a.h / 2;
    const bx1 = b.x - b.w / 2, bx2 = b.x + b.w / 2, by1 = b.y - b.h / 2, by2 = b.y + b.h / 2;
    if (!(ax2 + 6 < bx1 || bx2 + 6 < ax1 || ay2 + 6 < by1 || by2 + 6 < ay1)) {
      console.log(`COLLISION: ${a.id} and ${b.id}`);
      collisions++;
    }
  }
}

console.log("Spider Layout Collision test result:", collisions === 0 ? "PASSED (0 collisions)" : `FAILED (${collisions} collisions)`);
