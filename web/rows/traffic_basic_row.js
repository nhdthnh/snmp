/**
 * Hàng 3 [Image 1]: "Network Traffic Basic"
 * Biểu đồ diện tích lưu lượng đa interface kèm bảng chú giải thống kê Mean / Last / Max ở bên phải.
 */
import { fmtBps } from "../format.js";
import { PALETTE, renderLineChart, calcSeriesStats } from "../chart.js";
import { fetchTraffic, pickColumn } from "../api.js";

export const TrafficBasicRow = {
  // Danh sách interface mặc định theo dõi trên biểu đồ tổng quan
  keyInterfaces: [
    "ether1",
    "ether9",
    "ether10",
    "pppoe-out2",
    "BridgeVLAN",
    "VLAN10-LAN",
    "VLAN20-CAM",
    "VLAN30",
    "ether2",
    "pppoe-out1",
  ],

  async load(range, status, activeRouter = "hq") {
    const canvas = document.getElementById("traffic-basic-canvas");
    const legendWrap = document.getElementById("traffic-basic-legend");
    if (!canvas || !legendWrap) return;

    const isBob = activeRouter === "bob";
    const rtrStatus = isBob ? (status.routers?.bob || status) : (status.routers?.hq || status);
    const available = Object.keys(rtrStatus.interfaces || {});

    // Danh sách interface theo router
    const defaultList = isBob
      ? ["ether1", "ether2", "bridge", "ether3", "ether4", "ether5", "wlan1", "wlan2", "pppoe-out1"]
      : this.keyInterfaces;

    let ifaces = defaultList.filter(n => available.includes(n));
    if (!ifaces.length) {
      ifaces = available.slice(0, 10);
    }

    const prefix = isBob ? "bob_" : "";
    const queryIfaces = ifaces.map(n => `${prefix}${n}`);
    const { series: trafficMap, stats: serverStats } = await fetchTraffic(range, queryIfaces);

    // Xây dựng danh sách series cho đồ thị (chiều In RX là trọng tâm của Network Traffic Basic)
    const seriesList = [];
    const legendItems = [];

    ifaces.forEach((name, idx) => {
      const dbKey = `${prefix}${name}`;
      const color = PALETTE[idx % PALETTE.length];
      const pts = pickColumn(trafficMap, 1, dbKey).length ? pickColumn(trafficMap, 1, dbKey) : pickColumn(trafficMap, 1, name);
      const stats = serverStats[dbKey]?.rx || serverStats[name]?.rx || calcSeriesStats(pts);

      seriesList.push({
        name: `In - ${name}`,
        color,
        points: pts,
      });

      legendItems.push(`
        <div class="legend-row">
          <span class="legend-badge" style="color:${color}">— In - ${name}</span>
          <span class="legend-stats">
            Mean: <b>${fmtBps(stats.mean)}</b> &nbsp;|&nbsp; 
            Last *: <b>${fmtBps(stats.last)}</b> &nbsp;|&nbsp; 
            Max: <b>${fmtBps(stats.max)}</b>
          </span>
        </div>
      `);
    });

    legendWrap.innerHTML = legendItems.join("");

    renderLineChart(canvas, seriesList, {
      range,
      formatY: fmtBps,
      fill: true,
    });
  },
};
