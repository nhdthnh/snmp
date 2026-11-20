/**
 * Hàng 2 [Image 1 & Image 2]: "Router Stats"
 * Hiển thị các khối thông tin hệ thống (Uptime, Model, Firmware, POE, Errors, DHCP, CPU Mhz, Serial, Software ID...).
 * Hỗ trợ chế độ Tất cả 2 Router (HQ + BOB), hoặc lọc theo Router riêng.
 */
import { escapeHtml, fmtMhz, fmtUptime } from "../format.js";

const statItem = (label, value, colorClass = "c-green", infoIcon = false, title = "", sub = "") => `
  <div class="stat-card" ${title ? `title="${escapeHtml(title)}" style="cursor:help;"` : ""}>
    <div class="stat-label">
      ${infoIcon ? '<span class="info-icon" title="Thông tin">ℹ</span>' : ""}
      ${label}
    </div>
    <div class="stat-value ${colorClass}">${escapeHtml(value ?? "–")}</div>
    ${sub ? `<div class="stat-sub" style="font-size:10px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub}</div>` : ""}
  </div>
`;

export const StatsRow = {
  render(status, activeRouter = "all") {
    const isBob = activeRouter === "bob";
    const isHq = activeRouter === "hq";
    const isAll = !isBob && !isHq;

    const row1 = document.getElementById("stats-row-1");
    const row2 = document.getElementById("stats-row-2");

    if (isAll) {
      const hq = status?.routers?.hq?.system || status?.system || {};
      const bob = status?.routers?.bob?.system || {};
      const hqIfs = Object.values(status?.routers?.hq?.interfaces || status?.interfaces || {});
      const bobIfs = Object.values(status?.routers?.bob?.interfaces || {});
      const hqErr = hqIfs.reduce((acc, i) => acc + (i.errors || 0), 0);
      const bobErr = bobIfs.reduce((acc, i) => acc + (i.errors || 0), 0);

      if (row1) {
        row1.innerHTML = [
          statItem("HQ Uptime", fmtUptime(hq.uptime), "c-green"),
          statItem("HQ Model", hq.model || "RB3011UiAS", "c-green"),
          statItem("HQ Errors", hqErr, hqErr > 0 ? "c-red" : "c-green", true),
          statItem("HQ DHCP", hq.leases ?? 158, "c-green", true, "Chi tiết IP VLAN HQ:\n• VLAN10-LAN: 90 IP\n• VLAN20-WIFI: 84 IP\n• VLAN30: 0 IP\nTổng ARP: 174 IP", "V10: 90 · V20: 84"),
          statItem("HQ CPU", fmtMhz(hq.cpu_mhz ?? 1400), "c-green"),
          statItem("BOB Uptime", fmtUptime(bob.uptime), "c-green"),
          statItem("BOB Model", bob.model || "hAP ac²", "c-green"),
          statItem("BOB Errors", bobErr, bobErr > 0 ? "c-red" : "c-green", true),
          statItem("BOB DHCP", bob.leases ?? 33, "c-green", true, "Chi tiết IP BOB:\n• bridge (192.168.4.0/24): 69 IP\n  - 32 Camera Hikvision\n  - 1 NVR01 + 1 Máy chấm công\n  - 33 DHCP leases\nTổng ARP: 69 IP", "LAN: 69 (32 Cam)"),
          statItem("BOB CPU", fmtMhz(bob.cpu_mhz ?? 716), "c-green"),
        ].join("");
      }

      if (row2) {
        row2.innerHTML = [
          statItem("HQ POE Status", hq.poe_status || "Waiting", "c-yellow"),
          statItem("HQ Serial", hq.serial || "HCV08FEJ5X5", "c-yellow"),
          statItem("HQ Firmware", hq.firmware || "6.49.23", "c-green"),
          statItem("BOB Serial", bob.serial || "BEEB0A56E59A", "c-yellow"),
          statItem("BOB Firmware", bob.firmware || "6.49.23", "c-green"),
          statItem("BOB Wi-Fi Clients", bob.wifi_clients ?? 17, "c-green", true),
          statItem("IPsec Tunnel", "HQ ⟷ BOB (Active)", "c-green", true),
        ].join("");
      }
    } else {
      const s = isBob ? (status?.routers?.bob?.system || {}) : (status?.routers?.hq?.system || status?.system || {});
      const ifs = Object.values(isBob ? (status?.routers?.bob?.interfaces || {}) : (status?.routers?.hq?.interfaces || status?.interfaces || {}));
      const totalErrors = ifs.reduce((acc, i) => acc + (i.errors || 0), 0);

      if (row1) {
        row1.innerHTML = [
          statItem("Uptime", fmtUptime(s.uptime), "c-green"),
          statItem("Model", s.model || (isBob ? "hAP ac²" : "RouterOS RB3011UiAS"), "c-green"),
          statItem("RouterOS date", s.routeros_date || "10/17/2025, 08:43:23 PM", "c-green"),
          statItem("Firmware", s.firmware || "6.49.23", "c-green"),
          statItem("Board ver", s.board_ver || "6.48.6", "c-green"),
          statItem("Status", s.status || "Running", "c-green", true),
          statItem("POE Status", s.poe_status || (isBob ? "N/A" : "Waiting"), "c-yellow"),
          statItem("Errors", totalErrors, totalErrors > 0 ? "c-red" : "c-green", true),
          statItem(
            "DHCP",
            s.leases ?? (isBob ? 33 : 158),
            "c-green",
            true,
            isBob
              ? "Chi tiết IP BOB:\n• bridge (192.168.4.0/24): 69 IP (32 Camera + NVR + Chấm công + 33 DHCP)\nTổng ARP: 69 IP"
              : "Chi tiết IP VLAN HQ:\n• VLAN10-LAN: 90 IP\n• VLAN20-WIFI: 84 IP\n• VLAN30: 0 IP\nTổng ARP: 174 IP",
            isBob ? "LAN: 69 (32 Cam)" : "V10: 90 · V20: 84"
          ),
          statItem("CPU Mhz", fmtMhz(s.cpu_mhz ?? (isBob ? 716 : 1400)), "c-green"),
        ].join("");
      }

      if (row2) {
        row2.innerHTML = [
          statItem("POE Power", `${s.power ?? 0} W`, "c-green"),
          statItem("POE Voltage", `${s.voltage ?? 0} V`, "c-green"),
          statItem("POE Current", `${s.current ?? 0} mA`, "c-green"),
          statItem("CAPsMAN clients", s.capsman_clients ?? 0, "c-green", true),
          statItem("Serial Number", s.serial || "–", "c-yellow"),
          statItem("Software ID", s.software_id || "–", "c-yellow"),
          statItem("Wi-Fi clients", s.wifi_clients ?? 0, "c-green", true),
        ].join("");
      }
    }
  },

  load(range, status, activeRouter = "all") {
    this.render(status, activeRouter);
  },
};
