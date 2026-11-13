/**
 * Hàng 1 [Image 1]: "Total"
 * Gồm 4 Đồng hồ Gauge (CPU Load, CPU Temp, Load RAM, Load system disk)
 * và 1 Biểu đồ lịch sử "System" (Load CPU, RAM usage, System disk).
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
  containerId: "row-total",

  renderGauges(system) {
    const s = system || {};
    const wrap = document.getElementById("total-gauges-container");
    if (!wrap) return;

    wrap.innerHTML =
      gauge({
        title: "CPU Load",
        value: s.cpu,
        text: fmtPct(s.cpu),
      }) +
      gauge({
        title: "CPU Temp",
        value: s.temp,
        text: fmtTemp(s.temp),
        steps: TEMP_STEPS,
      }) +
      gauge({
        title: "Load RAM",
        value: s.ram,
        text: fmtPct(s.ram),
      }) +
      gauge({
        title: "Load system disk",
        value: s.disk,
        text: fmtPct(s.disk),
      });
  },

  async loadSystemChart(range, activeRouter = "hq") {
    const canvas = document.getElementById("system-chart-canvas");
    if (!canvas) return;

    const p = activeRouter === "bob" ? "bob_" : "";
    const data = await fetchMetrics(range, [`${p}cpu`, `${p}ram`, `${p}disk`]);
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
  },

  render(status) {
    this.renderGauges(status?.system || status);
  },

  async load(range, status, activeRouter = "hq") {
    this.render(status);
    await this.loadSystemChart(range, activeRouter);
  },
};
