/**
 * Hàng 2 [Image 1 & Image 2]: "Router Stats"
 * Hiển thị các khối thông tin hệ thống (Uptime, Model, Firmware, POE, Errors, DHCP, CPU Mhz, Serial, Software ID...).
 */
import { escapeHtml, fmtMhz, fmtUptime } from "../format.js";

const statItem = (label, value, colorClass = "c-green", infoIcon = false) => `
  <div class="stat-card">
    <div class="stat-label">
      ${infoIcon ? '<span class="info-icon" title="Thông tin">ℹ</span>' : ""}
      ${label}
    </div>
    <div class="stat-value ${colorClass}">${escapeHtml(value ?? "–")}</div>
  </div>
`;

export const StatsRow = {
  render(status) {
    const s = status.system || {};
    const ifs = Object.values(status.interfaces || {});
    const totalErrors = ifs.reduce((acc, i) => acc + (i.errors || 0), 0);

    // Dải 1: Thông tin hệ thống cốt lõi (Khớp Image 1)
    const row1 = document.getElementById("stats-row-1");
    if (row1) {
      row1.innerHTML = [
        statItem("Uptime", fmtUptime(s.uptime), "c-green"),
        statItem("Model", s.model || "RouterOS RB3011UiAS", "c-green"),
        statItem("RouterOS date", s.routeros_date || "10/17/2025, 08:43:23 PM", "c-green"),
        statItem("Firmware", s.firmware || "6.49.6", "c-green"),
        statItem("Board ver", s.board_ver || "6.48.6", "c-green"),
        statItem("Status", s.status || "Running", "c-green", true),
        statItem("POE Status", s.poe_status || "Waiting", "c-yellow"),
        statItem("Errors", totalErrors, totalErrors > 0 ? "c-red" : "c-green", true),
        statItem("DHCP", s.leases ?? 22, "c-green", true),
        statItem("CPU Mhz", fmtMhz(s.cpu_mhz ?? 1400), "c-green"),
      ].join("");
    }

    // Dải 2: POE, CAPsMAN & Định danh phần cứng (Khớp Image 2)
    const row2 = document.getElementById("stats-row-2");
    if (row2) {
      row2.innerHTML = [
        statItem("POE Power", `${s.power ?? 0} W`, "c-green"),
        statItem("POE Voltage", `${s.voltage ?? 0} V`, "c-green"),
        statItem("POE Current", `${s.current ?? 0} mA`, "c-green"),
        statItem("CAPsMAN client count", s.capsman_clients ?? 0, "c-green", true),
        statItem("Serial Number", s.serial || "HCV08FEJ5X5", "c-yellow"),
        statItem("Software ID", s.software_id || "FBD5-UFHW", "c-yellow"),
        statItem("Wi-Fi client count", s.wifi_clients ?? 0, "c-green", true),
      ].join("");
    }
  },

  load(range, status) {
    this.render(status);
  },
};
