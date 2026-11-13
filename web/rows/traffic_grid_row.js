/**
 * Hàng / Trang [Image 3]: "Traffic Panels" (Lưu lượng chi tiết từng cổng)
 * Hiển thị lưới các biểu đồ riêng lẻ: Traffic "BridgeVLAN", Traffic "VLAN10-LAN", Traffic "VLAN20-CAM"...
 * Mỗi cổng có đường In & Out kèm bảng thống kê Max / Mean / Min / Last.
 */
import { fmtBps, escapeHtml } from "../format.js";
import { renderLineChart, calcSeriesStats } from "../chart.js";
import { fetchTraffic, pickColumn } from "../api.js";

const STORAGE_KEY = "netmon.traffic.grid.selected";

const COLOR_IN = "#73bf69";  // Xanh lá (In)
const COLOR_OUT = "#fade2a"; // Vàng (Out)

export const TrafficGridRow = {
  selectedIfaces: null,

  getSelected(available = []) {
    if (this.selectedIfaces && this.selectedIfaces.length) {
      return this.selectedIfaces.filter(n => available.includes(n));
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) {
        return saved.filter(n => available.includes(n));
      }
    } catch {
      // ignore
    }
    // Mặc định chọn các interface chính khớp Image 3
    const defaults = ["BridgeVLAN", "VLAN10-LAN", "VLAN20-CAM", "VLAN30", "pppoe-out1", "ether1", "ether2"];
    return defaults.filter(n => available.includes(n)).length ? defaults.filter(n => available.includes(n)) : available.slice(0, 6);
  },

  setSelected(names) {
    this.selectedIfaces = names;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
    } catch {
      // ignore
    }
  },

  focus(ifaceName) {
    this.setSelected([ifaceName]);
  },

  renderChips(status, activeRouter = "hq") {
    const wrap = document.getElementById("traffic-chips-container");
    if (!wrap) return;

    const isBob = activeRouter === "bob";
    const rtrStatus = isBob ? (status.routers?.bob || status) : (status.routers?.hq || status);
    const available = Object.keys(rtrStatus.interfaces || {});
    const selected = this.getSelected(available);

    wrap.innerHTML = `
      <div class="chips-bar">
        <span class="chips-label">Chọn cổng ${isBob ? "BOB (hAP ac²)" : "HQ (RB3011)"}:</span>
        <button class="chip-btn ${selected.length === available.length ? "active" : ""}" data-all="true">Tất cả</button>
        ${available.map(name => `
          <button class="chip-btn ${selected.includes(name) ? "active" : ""}" data-name="${escapeHtml(name)}">
            ${escapeHtml(name)}
          </button>
        `).join("")}
      </div>
    `;

    wrap.onclick = ev => {
      const btn = ev.target.closest("button");
      if (!btn) return;
      if (btn.dataset.all) {
        this.setSelected(available);
      } else if (btn.dataset.name) {
        const name = btn.dataset.name;
        const cur = this.getSelected(available);
        if (cur.includes(name)) {
          if (cur.length > 1) this.setSelected(cur.filter(n => n !== name));
        } else {
          this.setSelected([...cur, name]);
        }
      }
      window.dispatchEvent(new CustomEvent("netmon:reload-traffic"));
    };
  },

  async load(range, status, activeRouter = "hq") {
    const isBob = activeRouter === "bob";
    const rtrStatus = isBob ? (status.routers?.bob || status) : (status.routers?.hq || status);
    const available = Object.keys(rtrStatus.interfaces || {});
    this.renderChips(status, activeRouter);

    const selected = this.getSelected(available);
    const container = document.getElementById("traffic-grid-container");
    if (!container) return;

    if (!selected.length) {
      container.innerHTML = '<div class="card p-4 text-center muted">Chưa chọn interface nào để hiển thị</div>';
      return;
    }

    const prefix = isBob ? "bob_" : "";
    const queryIfaces = selected.map(n => `${prefix}${n}`);
    const { series: trafficMap, stats: serverStats } = await fetchTraffic(range, queryIfaces);

    // Dựng khung các card đồ thị
    container.innerHTML = selected.map((name, i) => `
      <div class="card traffic-panel-card">
        <div class="card-head">
          <div class="panel-title">${isBob ? "BOB · " : ""}${escapeHtml(name)}</div>
        </div>
        <div class="canvas-wrap">
          <canvas id="traffic-chart-${i}" class="traffic-canvas"></canvas>
        </div>
        <div class="traffic-panel-stats" id="traffic-stats-${i}"></div>
      </div>
    `).join("");

    // Vẽ biểu đồ cho từng card
    selected.forEach((name, i) => {
      const canvas = document.getElementById(`traffic-chart-${i}`);
      const statsWrap = document.getElementById(`traffic-stats-${i}`);
      if (!canvas) return;

      const dbKey = `${prefix}${name}`;
      const inPts = pickColumn(trafficMap, 1, dbKey).length ? pickColumn(trafficMap, 1, dbKey) : pickColumn(trafficMap, 1, name);
      const outPts = pickColumn(trafficMap, 2, dbKey).length ? pickColumn(trafficMap, 2, dbKey) : pickColumn(trafficMap, 2, name);

      const inStat = serverStats[dbKey]?.rx || serverStats[name]?.rx || calcSeriesStats(inPts);
      const outStat = serverStats[dbKey]?.tx || serverStats[name]?.tx || calcSeriesStats(outPts);

      if (statsWrap) {
        statsWrap.innerHTML = `
          <div class="stat-line">
            <span class="badge-dot" style="background:${COLOR_IN}"></span>
            <span class="stat-dir">In</span>
            <span>Max: <b>${fmtBps(inStat.max)}</b></span>
            <span>Mean: <b>${fmtBps(inStat.mean)}</b></span>
            <span>Min: <b>${fmtBps(inStat.min)}</b></span>
            <span>Last: <b>${fmtBps(inStat.last)}</b></span>
          </div>
          <div class="stat-line">
            <span class="badge-dot" style="background:${COLOR_OUT}"></span>
            <span class="stat-dir">Out</span>
            <span>Max: <b>${fmtBps(outStat.max)}</b></span>
            <span>Mean: <b>${fmtBps(outStat.mean)}</b></span>
            <span>Min: <b>${fmtBps(outStat.min)}</b></span>
            <span>Last: <b>${fmtBps(outStat.last)}</b></span>
          </div>
        `;
      }

      renderLineChart(canvas, [
        { name: "In", color: COLOR_IN, points: inPts },
        { name: "Out", color: COLOR_OUT, points: outPts },
      ], {
        range,
        formatY: fmtBps,
        fill: true,
      });
    });
  },
};
