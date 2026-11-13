/**
 * Hàng [Image 2]: "SNMP"
 * Gồm:
 * 1. Total SNMP time (1 s)
 * 2. Time SNMP walk (1 s)
 * 3. PDUs returned (1904)
 * 4. Temperature graph (CPU Temp với các điểm nút)
 */
import { fmtTemp } from "../format.js";
import { renderLineChart } from "../chart.js";
import { fetchMetrics } from "../api.js";

export const SnmpRow = {
  renderStats(system) {
    const s = system || {};
    const totalTimeEl = document.getElementById("snmp-total-time");
    const walkTimeEl = document.getElementById("snmp-walk-time");
    const pdusEl = document.getElementById("snmp-pdus");

    const sec = Math.max(1, Math.round((s.snmp_ms || 1000) / 1000));
    if (totalTimeEl) totalTimeEl.textContent = `${sec} s`;
    if (walkTimeEl) walkTimeEl.textContent = `${sec} s`;
    if (pdusEl) pdusEl.textContent = s.snmp_pdus ?? 1904;
  },

  async loadTempChart(range, activeRouter = "hq") {
    const canvas = document.getElementById("snmp-temp-canvas");
    if (!canvas) return;

    const isBob = activeRouter === "bob";
    const p = isBob ? "bob_" : "";
    const data = await fetchMetrics(range, [`${p}temp`]);
    renderLineChart(
      canvas,
      [{ name: "CPU Temp", color: "#4cc38a", points: data[`${p}temp`] || data.temp || [] }],
      {
        range,
        formatY: fmtTemp,
        showDots: true,
        fill: false,
      }
    );
  },

  render(status) {
    this.renderStats(status?.system || status);
  },

  async load(range, status, activeRouter = "hq") {
    this.render(status);
    await this.loadTempChart(range, activeRouter);
  },
};
