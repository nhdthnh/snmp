/**
 * Hàng / Trang [Image 3]: "Traffic Panels" (Lưu lượng chi tiết từng cổng)
 * Mặc định chọn TẤT CẢ các cổng của cả 2 Router (HQ & BOB) để hiển thị đầy đủ lên Dashboard.
 * Cho phép lọc nhanh: Tất cả 2 Router, Tất cả HQ, Tất cả BOB, hoặc từng cổng riêng lẻ.
 */
import { fmtBps, escapeHtml } from "../format.js";
import { renderLineChart, calcSeriesStats } from "../chart.js";
import { fetchTraffic, pickColumn } from "../api.js";

const STORAGE_KEY = "netmon.traffic.grid.selected.v2";

const COLOR_IN = "#73bf69";  // Xanh lá (In)
const COLOR_OUT = "#fade2a"; // Vàng (Out)

export const TrafficGridRow = {
  selectedKeys: null, // null nghĩa là mặc định chọn TẤT CẢ

  /** Lấy danh sách tất cả interface của các router theo chế độ lọc */
  getItems(status, activeRouter = "all") {
    const isBob = activeRouter === "bob";
    const isHq = activeRouter === "hq";
    const isAll = !isBob && !isHq;

    const items = [];

    // Cổng của Router HQ (RB3011UiAS)
    if (isHq || isAll) {
      const hqIfs = status?.routers?.hq?.interfaces || status?.interfaces || {};
      for (const name of Object.keys(hqIfs)) {
        items.push({
          key: name,
          name,
          router: "hq",
          dbKey: name,
          label: isAll ? `HQ · ${name}` : name,
          routerLabel: "HQ (RB3011)",
        });
      }
    }

    // Cổng của Router Chi nhánh BOB (hAP ac²)
    if (isBob || isAll) {
      const bobIfs = status?.routers?.bob?.interfaces || {};
      for (const name of Object.keys(bobIfs)) {
        items.push({
          key: `bob_${name}`,
          name,
          router: "bob",
          dbKey: `bob_${name}`,
          label: isAll ? `BOB · ${name}` : name,
          routerLabel: "BOB (hAP ac²)",
        });
      }
    }

    return items;
  },

  /** Luôn mặc định chọn TẤT CẢ nếu chưa có lựa chọn thủ công */
  getSelected(allItems = []) {
    const allKeys = allItems.map(i => i.key);
    if (!allKeys.length) return [];

    // Nếu người dùng đã chọn trong phiên làm việc
    if (this.selectedKeys && Array.isArray(this.selectedKeys)) {
      const valid = this.selectedKeys.filter(k => allKeys.includes(k));
      if (valid.length) return valid;
    }

    // Đọc từ localStorage nếu có
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) {
        const valid = saved.filter(k => allKeys.includes(k));
        if (valid.length) return valid;
      }
    } catch (e) {}

    // MẶC ĐỊNH TUYỆT ĐỐI: CHỌN TẤT CẢ CÁC CỔNG CỦA CẢ 2 ROUTER
    this.selectedKeys = [...allKeys];
    return allKeys;
  },

  setSelected(keys) {
    this.selectedKeys = keys;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch (e) {}
  },

  focus(ifaceName) {
    this.setSelected([ifaceName]);
  },

  renderChips(status, activeRouter = "all") {
    const wrap = document.getElementById("traffic-chips-container");
    if (!wrap) return;

    const allItems = this.getItems(status, activeRouter);
    const selected = this.getSelected(allItems);
    const allKeys = allItems.map(i => i.key);

    const isAll = activeRouter === "all";
    const hqItems = allItems.filter(i => i.router === "hq");
    const bobItems = allItems.filter(i => i.router === "bob");

    const isAllSelected = selected.length === allKeys.length;
    const isAllHqSelected = hqItems.length > 0 && hqItems.every(i => selected.includes(i.key));
    const isAllBobSelected = bobItems.length > 0 && bobItems.every(i => selected.includes(i.key));

    if (isAll) {
      wrap.innerHTML = `
        <div class="chips-bar" style="margin-bottom: 6px;">
          <span class="chips-label">Lọc nhanh:</span>
          <button class="chip-btn ${isAllSelected ? "active" : ""}" data-action="all">🌐 Tất cả 2 Router (${allKeys.length})</button>
          <button class="chip-btn ${isAllHqSelected ? "active" : ""}" data-action="hq-all">🏢 Tất cả HQ (${hqItems.length})</button>
          <button class="chip-btn ${isAllBobSelected ? "active" : ""}" data-action="bob-all">🏭 Tất cả BOB (${bobItems.length})</button>
        </div>
        <div class="chips-bar" style="margin-bottom: 6px;">
          <span class="chips-label" style="color:#60a5fa; font-weight:700;">Cổng HQ (RB3011):</span>
          ${hqItems.map(item => `
            <button class="chip-btn ${selected.includes(item.key) ? "active" : ""}" data-key="${escapeHtml(item.key)}">
              ${escapeHtml(item.name)}
            </button>
          `).join("")}
        </div>
        <div class="chips-bar">
          <span class="chips-label" style="color:#c084fc; font-weight:700;">Cổng BOB (hAP ac²):</span>
          ${bobItems.map(item => `
            <button class="chip-btn ${selected.includes(item.key) ? "active" : ""}" data-key="${escapeHtml(item.key)}">
              ${escapeHtml(item.name)}
            </button>
          `).join("")}
        </div>
      `;
    } else {
      const rtrLabel = activeRouter === "bob" ? "BOB (hAP ac²)" : "HQ (RB3011)";
      wrap.innerHTML = `
        <div class="chips-bar">
          <span class="chips-label">Chọn cổng ${rtrLabel}:</span>
          <button class="chip-btn ${isAllSelected ? "active" : ""}" data-action="all">Tất cả (${allKeys.length})</button>
          ${allItems.map(item => `
            <button class="chip-btn ${selected.includes(item.key) ? "active" : ""}" data-key="${escapeHtml(item.key)}">
              ${escapeHtml(item.name)}
            </button>
          `).join("")}
        </div>
      `;
    }

    wrap.onclick = ev => {
      const btn = ev.target.closest("button");
      if (!btn) return;

      const action = btn.dataset.action;
      const key = btn.dataset.key;

      if (action === "all") {
        this.setSelected([...allKeys]);
      } else if (action === "hq-all") {
        const hqKeys = hqItems.map(i => i.key);
        this.setSelected([...hqKeys]);
      } else if (action === "bob-all") {
        const bobKeys = bobItems.map(i => i.key);
        this.setSelected([...bobKeys]);
      } else if (key) {
        const cur = this.getSelected(allItems);
        if (cur.includes(key)) {
          if (cur.length > 1) {
            this.setSelected(cur.filter(k => k !== key));
          }
        } else {
          this.setSelected([...cur, key]);
        }
      }

      window.dispatchEvent(new CustomEvent("netmon:reload-traffic"));
    };
  },

  async load(range, status, activeRouter = "all") {
    const allItems = this.getItems(status, activeRouter);
    this.renderChips(status, activeRouter);

    const selectedKeys = this.getSelected(allItems);
    const container = document.getElementById("traffic-grid-container");
    if (!container) return;

    const selectedItems = allItems.filter(i => selectedKeys.includes(i.key));

    if (!selectedItems.length) {
      container.innerHTML = '<div class="card p-4 text-center muted">Chưa chọn interface nào để hiển thị</div>';
      return;
    }

    const queryIfaces = selectedItems.map(i => i.dbKey);
    const { series: trafficMap, stats: serverStats } = await fetchTraffic(range, queryIfaces);

    // Dựng khung các card đồ thị
    container.innerHTML = selectedItems.map((item, i) => `
      <div class="card traffic-panel-card">
        <div class="card-head">
          <div class="panel-title">
            ${item.router === "bob" 
              ? '<span class="badge badge-bob" style="font-size:10.5px; padding:2px 6px; margin-right:6px;">BOB</span>' 
              : '<span class="badge badge-hq" style="font-size:10.5px; padding:2px 6px; margin-right:6px;">HQ</span>'}
            ${escapeHtml(item.name)}
          </div>
        </div>
        <div class="canvas-wrap">
          <canvas id="traffic-chart-${i}" class="traffic-canvas"></canvas>
        </div>
        <div class="traffic-panel-stats" id="traffic-stats-${i}"></div>
      </div>
    `).join("");

    // Vẽ biểu đồ cho từng card
    selectedItems.forEach((item, i) => {
      const canvas = document.getElementById(`traffic-chart-${i}`);
      const statsWrap = document.getElementById(`traffic-stats-${i}`);
      if (!canvas) return;

      const dbKey = item.dbKey;
      const inPts = pickColumn(trafficMap, 1, dbKey).length ? pickColumn(trafficMap, 1, dbKey) : pickColumn(trafficMap, 1, item.name);
      const outPts = pickColumn(trafficMap, 2, dbKey).length ? pickColumn(trafficMap, 2, dbKey) : pickColumn(trafficMap, 2, item.name);

      const inStat = serverStats[dbKey]?.rx || serverStats[item.name]?.rx || calcSeriesStats(inPts);
      const outStat = serverStats[dbKey]?.tx || serverStats[item.name]?.tx || calcSeriesStats(outPts);

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
