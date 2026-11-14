/**
 * Hàng 1 [Image 1]: "Total"
 * Gồm các Đồng hồ Gauge (CPU Load, CPU Temp, Load RAM, Load system disk)
 * Khi chọn "all": Hiển thị đồng hồ đo của cả 2 Router (HQ & BOB).
 * và Biểu đồ lịch sử "System" (Load CPU, RAM usage so sánh 2 Router).
 */
import { fmtPct, fmtTemp } from "../format.js";
import { gauge, GAUGE_COLORS } from "../gauge.js";
import { renderLineChart } from "../chart.js";
import { fetchMetrics } from "../api.js";

const TEMP_STEPS = [
  [45, GAUGE_COLORS.green],
  [60, GAUGE_COLORS.yellow],
  [75, GAUGE_COLORS.orange],
  [Infinity, GAUGE_COLORS.red],
];

export const TotalRow = {
  renderGauges(status, activeRouter = "all") {
    const wrap = document.getElementById("total-gauges-container");
    if (!wrap) return;

    const isBob = activeRouter === "bob";
    const isHq = activeRouter === "hq";
    const isAll = !isBob && !isHq;

    if (isAll) {
      const hq = status?.routers?.hq?.system || status?.system || {};
      const bob = status?.routers?.bob?.system || {};

      wrap.innerHTML =
        // 4 Gauges HQ
        gauge({
          title: "HQ · CPU Load",
          value: hq.cpu,
          text: fmtPct(hq.cpu),
        }) +
        gauge({
          title: "HQ · CPU Temp",
          value: hq.temp,
          text: fmtTemp(hq.temp),
          steps: TEMP_STEPS,
        }) +
        gauge({
          title: "HQ · Load RAM",
          value: hq.ram,
          text: fmtPct(hq.ram),
        }) +
        gauge({
          title: "HQ · Disk",
          value: hq.disk,
          text: fmtPct(hq.disk),
        }) +
        // 4 Gauges BOB
        gauge({
          title: "BOB · CPU Load",
          value: bob.cpu,
          text: fmtPct(bob.cpu),
        }) +
        gauge({
          title: "BOB · CPU Temp",
          value: bob.temp,
          text: fmtTemp(bob.temp),
          steps: TEMP_STEPS,
        }) +
        gauge({
          title: "BOB · Load RAM",
          value: bob.ram,
          text: fmtPct(bob.ram),
        }) +
        gauge({
          title: "BOB · Disk",
          value: bob.disk,
          text: fmtPct(bob.disk),
        });
    } else {
      const s = isBob ? (status?.routers?.bob?.system || {}) : (status?.routers?.hq?.system || status?.system || {});
      const p = isBob ? "BOB · " : "HQ · ";
      wrap.innerHTML =
        gauge({
          title: `${p}CPU Load`,
          value: s.cpu,
          text: fmtPct(s.cpu),
        }) +
        gauge({
          title: `${p}CPU Temp`,
          value: s.temp,
          text: fmtTemp(s.temp),
          steps: TEMP_STEPS,
        }) +
        gauge({
          title: `${p}Load RAM`,
          value: s.ram,
          text: fmtPct(s.ram),
        }) +
        gauge({
          title: `${p}Load Disk`,
          value: s.disk,
          text: fmtPct(s.disk),
        });
    }
  },

  async loadSystemChart(range, activeRouter = "all") {
    const canvas = document.getElementById("system-chart-canvas");
    if (!canvas) return;

    const isBob = activeRouter === "bob";
    const isHq = activeRouter === "hq";
    const isAll = !isBob && !isHq;

    if (isAll) {
      const data = await fetchMetrics(range, ["cpu", "ram", "bob_cpu", "bob_ram"]);
      const legendEl = document.querySelector(".system-card .system-legend");
      if (legendEl) {
        legendEl.innerHTML = `
          <span class="legend-tag"><i style="background:#73bf69"></i>HQ CPU</span>
          <span class="legend-tag"><i style="background:#fade2a"></i>HQ RAM</span>
          <span class="legend-tag"><i style="background:#38bdf8"></i>BOB CPU</span>
          <span class="legend-tag"><i style="background:#e879f9"></i>BOB RAM</span>
        `;
      }
      const series = [
        { name: "HQ CPU", color: "#73bf69", points: data.cpu || [] },
        { name: "HQ RAM", color: "#fade2a", points: data.ram || [] },
        { name: "BOB CPU", color: "#38bdf8", points: data.bob_cpu || [] },
        { name: "BOB RAM", color: "#e879f9", points: data.bob_ram || [] },
      ];
      renderLineChart(canvas, series, {
        range,
        formatY: fmtPct,
        maxY: 100,
        fill: false,
      });
    } else {
      const p = isBob ? "bob_" : "";
      const data = await fetchMetrics(range, [`${p}cpu`, `${p}ram`, `${p}disk`]);
      const legendEl = document.querySelector(".system-card .system-legend");
      if (legendEl) {
        legendEl.innerHTML = `
          <span class="legend-tag"><i style="background:#73bf69"></i>Load CPU</span>
          <span class="legend-tag"><i style="background:#fade2a"></i>RAM usage</span>
          <span class="legend-tag"><i style="background:#5794f2"></i>System disk</span>
        `;
      }
      const series = [
        { name: "Load CPU", color: "#73bf69", points: data[`${p}cpu`] || data.cpu || [] },
        { name: "RAM usage", color: "#fade2a", points: data[`${p}ram`] || data.ram || [] },
        { name: "System disk", color: "#5794f2", points: data[`${p}disk`] || data.disk || [] },
      ];
      renderLineChart(canvas, series, {
        range,
        formatY: fmtPct,
        maxY: 100,
        fill: false,
      });
    }
  },

  render(status, activeRouter = "all") {
    this.renderGauges(status, activeRouter);
  },

  async load(range, status, activeRouter = "all") {
    this.render(status, activeRouter);
    await this.loadSystemChart(range, activeRouter);
  },
};
