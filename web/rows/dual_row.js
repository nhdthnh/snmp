/**
 * Chế độ "Cả 2 Router": HQ và BOB hiển thị thành 2 khối riêng biệt (khác màu viền, huy hiệu, tiêu đề),
 * mỗi khối gồm: Gauges · Thông số · System chart · Lưu lượng Internet · Thẻ cổng mạng.
 */
import { fmtPct, fmtTemp, fmtBps, fmtMhz, fmtUptime, escapeHtml } from "../format.js";
import { gauge, GAUGE_COLORS } from "../gauge.js";
import { renderLineChart } from "../chart.js";
import { fetchMetrics, fetchTraffic, pickColumn } from "../api.js";
import { WanCardsRow } from "./wan_cards_row.js";

const TEMP_STEPS = [
  [45, GAUGE_COLORS.green],
  [60, GAUGE_COLORS.yellow],
  [75, GAUGE_COLORS.orange],
  [Infinity, GAUGE_COLORS.red],
];

const ROUTERS = [
  { key: "hq",  prefix: "",     label: "HQ",  model: "RB3011UiAS", ip: "192.168.1.1", cls: "router-hq",
    wan: ["ether1", "ether2"],                 wanDesc: "Tổng 2 line WAN: FPT (ether1) + VNPT (ether2)" },
  { key: "bob", prefix: "bob_", label: "BOB", model: "hAP ac²",    ip: "192.168.4.1", cls: "router-bob",
    wan: ["bob_ether1", "bob_pppoe-out1"],     wanDesc: "1 line VNPT duy nhất (ether1)" },
];

const rtrOf = (status, key) => (key === "bob" ? (status.routers?.bob || {}) : (status.routers?.hq || status));

const statItem = (label, value, cls = "c-green", title = "", sub = "") => `
  <div class="stat-card" ${title ? `title="${escapeHtml(title)}" style="cursor:help;"` : ""}>
    <div class="stat-label">${label}</div>
    <div class="stat-value ${cls}">${escapeHtml(value ?? "–")}</div>
    ${sub ? `<div class="stat-sub" style="font-size:10.5px; color:var(--text-muted); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub}</div>` : ""}
  </div>`;

export const DualRow = {
  ensureSkeleton() {
    const host = document.getElementById("dual-grid");
    if (!host) return false;
    if (host.children.length) return true;

    host.innerHTML = ROUTERS.map(r => `
      <div class="router-group ${r.cls}">
        <div class="router-group-head">
          <span class="rg-badge">${r.label}</span>
          <span class="rg-title">${r.model}</span>
          <span class="muted">${r.ip}</span>
          <span id="dual-pill-${r.key}" class="status-pill status-online">…</span>
        </div>

        <div id="dual-gauges-${r.key}" class="dual-gauges"></div>
        <div id="dual-stats-${r.key}" class="stats-bar-grid"></div>

        <div class="card">
          <div class="card-head">
            <span class="panel-title">System · ${r.label}</span>
            <div class="system-legend">
              <span class="legend-tag"><i style="background:#73bf69"></i>CPU</span>
              <span class="legend-tag"><i style="background:#fade2a"></i>RAM</span>
              <span class="legend-tag"><i style="background:#5794f2"></i>Disk</span>
            </div>
          </div>
          <div class="canvas-wrap"><canvas id="dual-sys-${r.key}" style="width:100%; height:170px;"></canvas></div>
        </div>

        <div class="card">
          <div class="card-head">
            <div>
              <div class="panel-title">Lưu lượng Internet · ${r.label}</div>
              <div class="muted" style="font-size:11.5px; margin-top:2px;">${r.wanDesc}</div>
            </div>
            <div class="system-legend">
              <span class="legend-tag"><i style="background:#4cc38a"></i>RX: <b id="dual-rx-${r.key}">–</b></span>
              <span class="legend-tag"><i style="background:#5794f2"></i>TX: <b id="dual-tx-${r.key}">–</b></span>
            </div>
          </div>
          <div class="canvas-wrap"><canvas id="dual-wan-${r.key}" style="width:100%; height:200px;"></canvas></div>
        </div>

        <div class="rg-sub">Đường truyền &amp; cổng kết nối · ${r.label}</div>
        <div id="dual-cards-${r.key}" class="wan-cards-grid"></div>
      </div>
    `).join("");
    return true;
  },

  render(status) {
    if (!this.ensureSkeleton()) return;

    ROUTERS.forEach(r => {
      const rtr = rtrOf(status, r.key);
      const s = rtr.system || rtr;

      // Huy hiệu trạng thái
      const pill = document.getElementById(`dual-pill-${r.key}`);
      const info = r.key === "bob" ? status.routers?.bob?.router : (status.routers?.hq?.router || status.router);
      if (pill) {
        if (info?.up)        { pill.className = "status-pill status-online";  pill.textContent = "Online"; }
        else if (info?.demo) { pill.className = "status-pill status-demo";    pill.textContent = "Demo"; }
        else                 { pill.className = "status-pill status-offline"; pill.textContent = "Offline"; }
      }

      // 4 Gauge
      const g = document.getElementById(`dual-gauges-${r.key}`);
      if (g) {
        g.innerHTML =
          gauge({ title: "CPU Load", value: s.cpu,  text: fmtPct(s.cpu) }) +
          gauge({ title: "CPU Temp", value: s.temp, text: fmtTemp(s.temp), steps: TEMP_STEPS }) +
          gauge({ title: "Load RAM", value: s.ram,  text: fmtPct(s.ram) }) +
          gauge({ title: "Disk",     value: s.disk, text: fmtPct(s.disk) });
      }

      // Dải thông số
      const errs = Object.values(rtr.interfaces || {}).reduce((a, i) => a + (i.errors || 0), 0);
      const isHq = r.key === "hq";
      const dhcpTitle = isHq
        ? `Chi tiết IP cấp theo VLAN (HQ):\n• VLAN10-LAN (192.168.1.0/24): 90 thiết bị / IP\n• VLAN20-WIFI (192.168.0.0/24): 84 thiết bị / IP\n• VLAN30 (192.168.3.0/24): 0 thiết bị (Dự phòng)\nTổng DHCP leases: ${s.leases ?? 158} | Tổng ARP: 174 IP`
        : `Chi tiết IP cấp (BOB - Nhà máy):\n• bridge (192.168.4.0/24): 69 thiết bị / IP\n  - 32 Camera IP Hikvision (IP tĩnh)\n  - 1 NVR01 (.253) + 1 Giám sát (.248)\n  - 33 IP cấp qua DHCP server\nTổng ARP: 69 IP`;
      const dhcpSub = isHq ? "V10: 90 · V20: 84" : "LAN: 69 (32 Cam)";

      const st = document.getElementById(`dual-stats-${r.key}`);
      if (st) {
        st.innerHTML = [
          statItem("Uptime", fmtUptime(s.uptime)),
          statItem("Model", s.model || r.model),
          statItem("Errors", errs, errs > 0 ? "c-red" : "c-green"),
          statItem("DHCP", s.leases ?? "–", "c-green", dhcpTitle, dhcpSub),
          statItem("CPU", fmtMhz(s.cpu_mhz)),
        ].join("");
      }

      // Tổng RX/TX hiện tại
      const wan = rtr.wan || (r.key === "hq" ? status.wan : null) || {};
      const rx = document.getElementById(`dual-rx-${r.key}`);
      const tx = document.getElementById(`dual-tx-${r.key}`);
      if (rx) rx.textContent = fmtBps(wan.rx_bps || 0);
      if (tx) tx.textContent = fmtBps(wan.tx_bps || 0);

      // Thẻ cổng mạng (tái sử dụng WanCardsRow, trỏ vào grid của router này)
      WanCardsRow.target = `dual-cards-${r.key}`;
      try { WanCardsRow.render(status, r.key); }
      catch (e) { console.error("DualRow cards error:", e); }
      finally { WanCardsRow.target = null; }
    });
  },

  async load(range) {
    if (!this.ensureSkeleton()) return;

    const wanAll = ROUTERS.flatMap(r => r.wan);
    const [m, t] = await Promise.all([
      fetchMetrics(range, ["cpu", "ram", "disk", "bob_cpu", "bob_ram", "bob_disk"]),
      fetchTraffic(range, wanAll),
    ]);

    ROUTERS.forEach(r => {
      const p = r.prefix;

      // System chart
      renderLineChart(
        document.getElementById(`dual-sys-${r.key}`),
        [
          { name: "CPU",  color: "#73bf69", points: m[`${p}cpu`]  || [] },
          { name: "RAM",  color: "#fade2a", points: m[`${p}ram`]  || [] },
          { name: "Disk", color: "#5794f2", points: m[`${p}disk`] || [] },
        ],
        { range, formatY: fmtPct, maxY: 100, fill: false }
      );

      // WAN chart: cộng RX/TX các line của router này
      const rxMap = new Map(), txMap = new Map();
      r.wan.forEach(n => {
        pickColumn(t.series, 1, n).forEach(([ts, v]) => rxMap.set(ts, (rxMap.get(ts) || 0) + v));
        pickColumn(t.series, 2, n).forEach(([ts, v]) => txMap.set(ts, (txMap.get(ts) || 0) + v));
      });
      const sorted = mp => [...mp.entries()].sort((a, b) => a[0] - b[0]);

      renderLineChart(
        document.getElementById(`dual-wan-${r.key}`),
        [
          { name: "Nhận RX", color: "#4cc38a", points: sorted(rxMap) },
          { name: "Gửi TX",  color: "#5794f2", points: sorted(txMap) },
        ],
        { range, formatY: fmtBps, fill: true }
      );
    });
  },
};
