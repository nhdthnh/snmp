// Spider / Star layout test script

const BOX_W = 152;
const BOX_H = 54;

const HQ_NODES = [
  // Center Column:
  { id: "fpt", site: "hq", x: 530, y: 75, label: "ISP FPT", sub: "DHCP IP WAN", w: 145, h: 50 },
  { id: "vnpt", site: "hq", x: 770, y: 75, label: "ISP VNPT", sub: "113.161.75.195", w: 145, h: 50 },
  { id: "mikrotik", site: "hq", x: 650, y: 195, label: "Mikrotik RB3011UiAS", sub: "192.168.1.1 (HQ Router)", w: 185, h: 54 },
  { id: "core", site: "hq", x: 650, y: 350, label: "SW CORE Ruijie", sub: "192.168.1.254 (RG-ES224GC)", w: 195, h: 54 },

  // Left Wing (Hàng dọc bên trái):
  { id: "dvr_vt", site: "hq", x: 250, y: 195, label: "DVR VANTECH", sub: "192.168.1.101 (eth4)", w: 148, h: 52 },
  { id: "dvr_dh", site: "hq", x: 250, y: 310, label: "DVR DAHUA", sub: "192.168.1.226 (P.17)", w: 148, h: 52 },
  { id: "sql", site: "hq", x: 250, y: 425, label: "Server SQL", sub: "192.168.1.57 (P.15)", w: 148, h: 52 },
  { id: "mcc", site: "hq", x: 75, y: 425, label: "Máy chấm công", sub: "MCC01 (P.13)", w: 135, h: 50 },
  { id: "u1", site: "hq", x: 250, y: 540, label: "TL-SG1024D", sub: "Unmanage T1 (P.22)", w: 148, h: 52 },
  { id: "u2", site: "hq", x: 250, y: 655, label: "TL-SG1024D_1", sub: "Unmanage T2 (P.21)", w: 148, h: 52 },
  { id: "u3", site: "hq", x: 250, y: 770, label: "TL-SG1016D", sub: "Unmanage T3 (P.20)", w: 148, h: 52 },

  // Right Wing (Hàng dọc bên phải):
  { id: "wifi", site: "hq", x: 1050, y: 195, label: "SW WIFI 296", sub: "VLAN 20 (eth9)", w: 148, h: 52 },
  { id: "ap", site: "hq", x: 1240, y: 195, label: "AP WIFI", sub: "AP01–05 (Reyee)", w: 138, h: 50 },
  { id: "poe", site: "hq", x: 1050, y: 310, label: "SW POE HIKVISION", sub: "16 Port (P.16)", w: 148, h: 52 },
  { id: "cam", site: "hq", x: 1240, y: 310, label: "CAMERA C1 – C16", sub: "192.168.1.102 – 107", w: 140, h: 50 },
  { id: "nas", site: "hq", x: 1050, y: 425, label: "NAS DS923+", sub: "1.119 (P.23-24 BOND)", w: 148, h: 52 },
  { id: "u4", site: "hq", x: 1050, y: 540, label: "TL-SG1016D_1", sub: "Unmanage T4 (P.19)", w: 148, h: 52 },
  { id: "u5", site: "hq", x: 1050, y: 655, label: "TL-SG1005D", sub: "Studio (P.18)", w: 148, h: 52 },
  { id: "prn1", site: "hq", x: 1050, y: 770, label: "MP C4505EX", sub: "192.168.1.250 (P.12)", w: 148, h: 52 },
  { id: "prn2", site: "hq", x: 1240, y: 770, label: "MP C5503", sub: "192.168.1.252 (P.13)", w: 138, h: 50 },
];

console.log("HQ Nodes count:", HQ_NODES.length);

let hqCollisions = 0;
for (let i = 0; i < HQ_NODES.length; i++) {
  for (let j = i + 1; j < HQ_NODES.length; j++) {
    const a = HQ_NODES[i];
    const b = HQ_NODES[j];
    const ax1 = a.x - a.w / 2, ax2 = a.x + a.w / 2, ay1 = a.y - a.h / 2, ay2 = a.y + a.h / 2;
    const bx1 = b.x - b.w / 2, bx2 = b.x + b.w / 2, by1 = b.y - b.h / 2, by2 = b.y + b.h / 2;
    if (!(ax2 + 8 < bx1 || bx2 + 8 < ax1 || ay2 + 8 < by1 || by2 + 8 < ay1)) {
      console.log(`COLLISION: ${a.id} and ${b.id}`);
      hqCollisions++;
    }
  }
}

console.log("HQ Collision test result:", hqCollisions === 0 ? "PASSED (0 collisions)" : `FAILED (${hqCollisions} collisions)`);
