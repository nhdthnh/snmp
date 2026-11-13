/**
 * Lớp giao tiếp API với backend NetMon (api.js).
 */

export async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} lỗi HTTP: ${res.status}`);
  return res.json();
}

/** Lấy trạng thái hiện tại (router, health, interfaces, neighbors, wan, devices). */
export const fetchStatus = () => getJSON("/api/status");

/** Lấy chuỗi lịch sử lưu lượng cho danh sách interfaces. */
export async function fetchTraffic(range, ifaces = []) {
  const param = ifaces.length ? `&ifaces=${encodeURIComponent(ifaces.join(","))}` : "";
  const res = await getJSON(`/api/traffic?range=${range}${param}`);
  return { series: res.series || {}, stats: res.stats || {} };
}

/** Lấy chuỗi chỉ số hệ thống (cpu, ram, disk, temp, errors, ...). */
export async function fetchMetrics(range, keys = []) {
  const param = keys.length ? `&keys=${encodeURIComponent(keys.join(","))}` : "";
  const res = await getJSON(`/api/metrics?range=${range}${param}`);
  return res.series || {};
}

/** Lấy thống kê (mean, max, min, last) của các interfaces. */
export async function fetchSummary(range, ifaces = []) {
  const param = ifaces.length ? `&ifaces=${encodeURIComponent(ifaces.join(","))}` : "";
  const res = await getJSON(`/api/summary?range=${range}${param}`);
  return res.stats || {};
}

/**
 * Tách một cột dữ liệu (col 1 = rx, col 2 = tx) từ series traffic thành [[t, val], ...].
 */
export function pickColumn(seriesMap, column, ifaceName) {
  const pts = seriesMap[ifaceName] || [];
  return pts.map(p => [p[0], p[column]]);
}
