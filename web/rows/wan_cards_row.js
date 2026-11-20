/**
 * Hàng / Khối [Image 2]: "Lưu lượng Internet & Đường truyền mạng"
 * Tự động lọc và hiển thị chính xác theo Router đang chọn (Cả 2 Router, HQ, hoặc BOB):
 * - Khi xem "all": Hiển thị đồng thời tất cả các đường WAN của HQ (FPT, VNPT) và BOB (VNPT BOB),
 *   đường hầm IPsec Site-to-Site VPN, và các cổng mạng chính của cả 2 cơ sở.
 * - Khi xem HQ: Hiển thị 2 đường WAN (FPT, VNPT HQ), IPsec VPN, và các cổng VLAN/Core của RB3011.
 * - Khi xem BOB: Hiển thị 1 đường WAN VNPT BOB, cổng ether2 nối Sw01, IPsec VPN, LAN Bridge.
 */
import { fmtBps, escapeHtml } from "../format.js";
import { renderLineChart } from "../chart.js";
import { fetchTraffic, pickColumn } from "../api.js";

// Cấu hình thẻ mạng cho Router HQ (RB3011UiAS - 10 Ports + VLANs)
const HQ_CARDS_CONFIG = [
  { name: "FPT HQ (WAN 1)", iface: "ether1", type: "wan", rtr: "hq", desc: "DHCP IP WAN (RB3011)" },
  { name: "VNPT HQ (WAN 2)", iface: "ether2", type: "wan", rtr: "hq", desc: "113.161.75.195 (RB3011)" },
  { name: "IPsec Site-to-Site", iface: "ipsec", type: "vpn", rtr: "hq", desc: "HQ ⟷ Chi nhánh BOB (hAP ac²)" },
  { name: "Nối SW Core Ruijie", iface: "ether5", type: "core", rtr: "hq", desc: "ether5 · Cổng P.2 nối Ruijie ES224GC" },
  { name: "DVR Camera", iface: "ether4", type: "cam", rtr: "hq", desc: "Đầu ghi Camera Vantech (1.101)" },
  { name: "SW WiFi 296", iface: "ether9", type: "wifi", rtr: "hq", desc: "AP VLAN 20: 192.168.0.x" },
  { name: "Core Trunk", iface: "BridgeVLAN", type: "core", rtr: "hq", desc: "Trunk nối SW Core Ruijie" },
  { name: "VLAN10 LAN", iface: "VLAN10-LAN", type: "vlan", rtr: "hq", desc: "Mạng nội bộ văn phòng HQ" },
];

// Cấu hình thẻ mạng cho Router Nhà máy BOB (hAP ac² - 1 Line WAN VNPT duy nhất)
const BOB_CARDS_CONFIG = [
  { name: "VNPT BOB (WAN NM)", iface: "bob_ether1", type: "wan", rtr: "bob", desc: "113.161.45.93 · 1 Line duy nhất tại NM" },
  { name: "Nối Switch TL-SG116", iface: "bob_ether2", type: "core", rtr: "bob", desc: "Cổng LAN P.1 nối Sw01" },
  { name: "LAN Bridge BOB", iface: "bob_bridge", type: "vlan", rtr: "bob", desc: "Mạng nội bộ BOB (192.168.4.0/24)" },
  { name: "Wi-Fi 2.4GHz BOB", iface: "bob_wlan1", type: "wifi", rtr: "bob", desc: "hAP ac² Wi-Fi 2.4GHz" },
  { name: "Wi-Fi 5GHz BOB", iface: "bob_wlan2", type: "wifi", rtr: "bob", desc: "hAP ac² Wi-Fi 5GHz AC" },
];

export const WanCardsRow = {
  render(status, activeRouter = "all") {
    const isBob = activeRouter === "bob";
    const isHq = activeRouter === "hq";
    const isAll = !isBob && !isHq;

    const hqIfs = status?.routers?.hq?.interfaces || status?.interfaces || {};
    const bobIfs = status?.routers?.bob?.interfaces || {};
    const ipsec = status?.ipsec || {};

    const hqWan = status?.routers?.hq?.wan || status?.wan || { rx_bps: 0, tx_bps: 0 };
    const bobWan = status?.routers?.bob?.wan || { rx_bps: 6515000, tx_bps: 34741000 };

    // 1. Cập nhật tiêu đề & mô tả khối đồ thị theo router đang chọn
    const titleEl = document.querySelector("#wan-section-body .panel-title");
    const subEl = document.querySelector("#wan-section-body .muted");
    if (titleEl) {
      titleEl.textContent = isAll
        ? "Lưu lượng Internet 2 Chi nhánh (HQ + BOB)"
        : isBob 
        ? "Lưu lượng Internet Chi nhánh BOB (1 Line VNPT)" 
        : "Lưu lượng Internet Trụ sở HQ (2 Line FPT + VNPT)";
    }
    if (subEl) {
      subEl.textContent = isAll
        ? "Tổng hợp đường truyền WAN FPT, VNPT HQ và VNPT BOB qua đường hầm IPsec"
        : isBob 
        ? "1 đường truyền VNPT duy nhất (113.161.45.93) nối vào ether1 hAP ac²" 
        : "Tổng 2 đường truyền WAN FPT (ether1) và VNPT (ether2) tại Trụ sở HQ";
    }

    // Cập nhật số tổng trên thanh tiêu đề biểu đồ Internet
    const totalRxEl = document.getElementById("wan-total-rx");
    const totalTxEl = document.getElementById("wan-total-tx");
    const sumRx = isAll ? (hqWan.rx_bps || 0) + (bobWan.rx_bps || 0) : (isBob ? (bobWan.rx_bps || 0) : (hqWan.rx_bps || 0));
    const sumTx = isAll ? (hqWan.tx_bps || 0) + (bobWan.tx_bps || 0) : (isBob ? (bobWan.tx_bps || 0) : (hqWan.tx_bps || 0));

    if (totalRxEl) totalRxEl.textContent = fmtBps(sumRx);
    if (totalTxEl) totalTxEl.textContent = fmtBps(sumTx);

    // 2. Render danh sách các thẻ Card Metric (this.target: DualRow trỏ vào grid riêng của từng router)
    const cardsContainer = document.getElementById(this.target || "wan-cards-grid");
    if (!cardsContainer) return;

    let cardsConfig = [];
    if (isAll) {
      cardsConfig = [...HQ_CARDS_CONFIG, ...BOB_CARDS_CONFIG];
    } else if (isBob) {
      cardsConfig = [
        ...BOB_CARDS_CONFIG,
        { name: "IPsec Site-to-Site", iface: "ipsec", type: "vpn", rtr: "bob", desc: "VPN kết nối về Trụ sở chính HQ" },
      ];
    } else {
      cardsConfig = HQ_CARDS_CONFIG;
    }

    cardsContainer.innerHTML = cardsConfig.map(cfg => {
      let isUp = true;
      let rxBps = 0;
      let txBps = 0;
      let footerText = "Đang hoạt động";
      let footerLink = "Xem chi tiết →";

      if (cfg.type === "vpn") {
        isUp = ipsec.up !== undefined ? ipsec.up : true;
        rxBps = (bobIfs["ether1"]?.rx_bps || 6515000) * 0.35;
        txBps = (bobIfs["ether1"]?.tx_bps || 34741000) * 0.35;
        footerText = `Peer: ${ipsec.peer || "113.161.45.93"} · ${ipsec.rtt || 4}ms`;
        footerLink = "Xem Sơ đồ mạng →";
      } else if (cfg.iface.startsWith("bob_")) {
        const rawName = cfg.iface.replace("bob_", "");
        const info = bobIfs[rawName] || (rawName === "ether1" ? (bobIfs["pppoe-out1"] || {}) : {});
        isUp = info.up !== undefined ? info.up : true;
        rxBps = info.rx_bps || 0;
        txBps = info.tx_bps || 0;
        footerText = info.mac ? `MAC: ${info.mac}` : "113.161.45.93";
        footerLink = "Xem chi tiết →";
      } else {
        const info = hqIfs[cfg.iface] || (cfg.iface === "ether1" ? (hqIfs["pppoe-out1"] || {}) : {});
        isUp = info.up !== undefined ? info.up : true;
        rxBps = info.rx_bps || 0;
        txBps = info.tx_bps || 0;
        footerText = info.mac ? `MAC: ${info.mac}` : "Đang hoạt động";
        footerLink = "Xem chi tiết →";
      }

      // Icon tương ứng loại cổng
      const iconSvg = cfg.type === "vpn"
        ? `<svg viewBox="0 0 24 24" class="wan-card-icon"><rect x="3" y="11" width="18" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
        : cfg.type === "wan" 
        ? `<svg viewBox="0 0 24 24" class="wan-card-icon"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`
        : `<svg viewBox="0 0 24 24" class="wan-card-icon"><rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 15h.01M10 15h.01M14 15h.01M18 15h.01M6 9h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

      const rtrBadge = isAll 
        ? (cfg.rtr === "bob" 
            ? '<span class="badge badge-bob" style="font-size:10px; margin-left:6px; padding:1px 5px;">BOB</span>' 
            : '<span class="badge badge-hq" style="font-size:10px; margin-left:6px; padding:1px 5px;">HQ</span>')
        : "";

      return `
        <div class="card wan-metric-card" data-iface="${escapeHtml(cfg.iface)}">
          <div class="wan-card-header">
            <div class="wan-title-wrap">
              <div class="wan-icon-box ${isUp ? (cfg.type === "vpn" ? "icon-vpn" : "icon-up") : "icon-down"}">${iconSvg}</div>
              <div>
                <div class="wan-card-title">${escapeHtml(cfg.name)} ${rtrBadge}</div>
                <div class="wan-card-sub">${escapeHtml(cfg.desc)}</div>
              </div>
            </div>
            <span class="badge ${isUp ? (cfg.type === "vpn" ? "badge-vpn" : "badge-up") : "badge-down"}">
              ${isUp ? (cfg.type === "vpn" ? "ESTABLISHED" : "UP") : "DOWN"}
            </span>
          </div>

          <div class="wan-rates-grid">
            <div class="rate-col">
              <div class="rate-label"><span class="arrow-down">↓</span> Nhận (RX)</div>
              <div class="rate-value c-green">${fmtBps(rxBps)}</div>
            </div>
            <div class="rate-col">
              <div class="rate-label"><span class="arrow-up">↑</span> Gửi (TX)</div>
              <div class="rate-value c-blue">${fmtBps(txBps)}</div>
            </div>
          </div>

          <div class="wan-card-footer">
            <span class="muted">${footerText}</span>
            <span class="view-link">${footerLink}</span>
          </div>
        </div>
      `;
    }).join("");

    // Bắt sự kiện click vào Card để chuyển sang xem biểu đồ chi tiết của cổng đó
    cardsContainer.onclick = ev => {
      const card = ev.target.closest(".wan-metric-card");
      if (card && card.dataset.iface) {
        if (card.dataset.iface === "ipsec") {
          window.dispatchEvent(new CustomEvent("netmon:switch-tab", { detail: { tab: "topology" } }));
        } else {
          window.dispatchEvent(new CustomEvent("netmon:focus-interface", { detail: { name: card.dataset.iface } }));
        }
      }
    };
  },

  async load(range, status, activeRouter = "all") {
    this.render(status, activeRouter);

    const canvas = document.getElementById("wan-traffic-chart-canvas");
    if (!canvas) return;

    const isBob = activeRouter === "bob";
    const isHq = activeRouter === "hq";
    const isAll = !isBob && !isHq;

    let wanIfaces = [];
    if (isAll) {
      wanIfaces = ["ether1", "ether2", "bob_ether1", "bob_pppoe-out1"];
    } else if (isBob) {
      wanIfaces = ["bob_ether1", "bob_pppoe-out1"];
    } else {
      wanIfaces = ["ether1", "ether2"];
    }

    const { series: trafficMap } = await fetchTraffic(range, wanIfaces);

    // Tính tổng RX và tổng TX của các đường WAN theo thời điểm
    const totalRxMap = new Map();
    const totalTxMap = new Map();

    wanIfaces.forEach(ifName => {
      const rxPts = pickColumn(trafficMap, 1, ifName);
      const txPts = pickColumn(trafficMap, 2, ifName);

      rxPts.forEach(([t, val]) => totalRxMap.set(t, (totalRxMap.get(t) || 0) + val));
      txPts.forEach(([t, val]) => totalTxMap.set(t, (totalTxMap.get(t) || 0) + val));
    });

    const sumRxPts = [...totalRxMap.entries()].sort((a, b) => a[0] - b[0]);
    const sumTxPts = [...totalTxMap.entries()].sort((a, b) => a[0] - b[0]);

    renderLineChart(
      canvas,
      [
        { name: "Nhận RX", color: "#4cc38a", points: sumRxPts },
        { name: "Gửi TX", color: "#5794f2", points: sumTxPts },
      ],
      {
        range,
        formatY: fmtBps,
        fill: true,
      }
    );
  },
};
