/**
 * Các hàm định dạng đơn vị chuẩn (format.js).
 * Hỗ trợ lưu lượng (bps), dung lượng (Bytes), thời gian, nhiệt độ, phần trăm, số gói (p/s).
 */

export function fmtBps(bps, decimals = 1) {
  if (bps == null || isNaN(bps)) return "0 b/s";
  const abs = Math.abs(bps);
  if (abs >= 1e9) return (bps / 1e9).toFixed(decimals > 0 ? decimals : 1) + " Gb/s";
  if (abs >= 1e6) return (bps / 1e6).toFixed(decimals) + " Mb/s";
  if (abs >= 1e3) return (bps / 1e3).toFixed(0) + " Kb/s";
  return Math.round(bps) + " b/s";
}

export function fmtBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  let val = Number(bytes);
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return (i >= 3 ? val.toFixed(2) : i ? val.toFixed(1) : val.toFixed(0)) + " " + units[i];
}

export function fmtPackets(pps) {
  if (pps == null || isNaN(pps)) return "0 p/s";
  const abs = Math.abs(pps);
  if (abs >= 1e6) return (pps / 1e6).toFixed(1) + " M p/s";
  if (abs >= 1e3) return (pps / 1e3).toFixed(1) + " k p/s";
  return Math.round(pps) + " p/s";
}

export function fmtErrors(eps) {
  if (eps == null || isNaN(eps)) return "0/s";
  const abs = Math.abs(eps);
  if (abs >= 1e3) return (eps / 1e3).toFixed(1) + " k/s";
  return (eps < 1 && eps > 0 ? eps.toFixed(2) : Math.round(eps)) + "/s";
}

export function fmtRate(speed) {
  if (!speed || speed <= 0) return "0 b/s";
  if (speed >= 1e9) return (speed / 1e9).toFixed(0) + " Gb/s";
  if (speed >= 1e6) return (speed / 1e6).toFixed(0) + " Mb/s";
  if (speed >= 1e3) return (speed / 1e3).toFixed(0) + " Kb/s";
  return speed + " b/s";
}

export const fmtPct = v => (v == null ? "–" : Math.round(v) + "%");
export const fmtTemp = v => (v == null ? "–" : Math.round(v) + " °C");
export const fmtMhz = v => (v == null ? "–" : Math.round(v) + " MHz");

export function fmtTime(ts, withDate = false) {
  if (!ts) return "–";
  const d = new Date(ts * 1000);
  const time = d.toLocaleTimeString("vi-VN", { hour12: false });
  if (!withDate) return time;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${time} ${day}/${month}`;
}

export function fmtUptime(seconds) {
  if (!seconds || seconds <= 0) return "–";
  const weeks = (seconds / (86400 * 7)).toFixed(1);
  if (seconds >= 86400 * 7) {
    return `${weeks} week`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : `${h}h ${m}m`;
}

export const escapeHtml = s =>
  String(s ?? "").replace(/[&<>'"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[c]));
