/**
 * Hàng 3 [Image 1]: "Network Traffic Basic"
 * Biểu đồ diện tích lưu lượng đa interface kèm bảng chú giải thống kê Mean / Last / Max ở bên phải.
 * Hỗ trợ vẽ đồng thời các cổng chính của cả 2 Router (HQ & BOB).
 */
import { fmtBps, escapeHtml } from "../format.js";
import { PALETTE, renderLineChart, calcSeriesStats } from "../chart.js";
import { fetchTraffic, pickColumn } from "../api.js";

export const TrafficBasicRow = {
  // Danh sách interface mặc định theo dõi trên biểu đồ tổng quan HQ
  keyInterfacesHQ: [
    "ether1",
    "ether2",
    "pppoe-out1",
    "BridgeVLAN",
    "VLAN10-LAN",
    "VLAN20-CAM",
    "VLAN30",
  ],

  // Danh sách interface mặc định theo dõi trên biểu đồ tổng quan BOB
  keyInterfacesBOB: [
    "ether1",
    "ether2",
    "bridge",
    "pppoe-out1",
    "wlan1",
    "wlan2",
  ],

  async load(range, status, activeRouter = "all") {
    const canvas = document.getElementById("traffic-basic-canvas");
    const legendWrap = document.getElementById("traffic-basic-legend");
    if (!canvas || !legendWrap) return;

    const isBob = activeRouter === "bob";
    const isHq = activeRouter === "hq";
    const isAll = !isBob && !isHq;

    let itemsToQuery = [];

    if (isAll) {
      const hqIfs = status?.routers?.hq?.interfaces || status?.interfaces || {};
      const bobIfs = status?.routers?.bob?.interfaces || {};

      this.keyInterfacesHQ.filter(n => hqIfs[n]).forEach(name => {
        itemsToQuery.push({ name: `HQ: ${name}`, dbKey: name, rtr: "hq" });
      });
      this.keyInterfacesBOB.filter(n => bobIfs[n]).forEach(name => {
        itemsToQuery.push({ name: `BOB: ${name}`, dbKey: `bob_${name}`, rtr: "bob" });
      });
    } else if (isBob) {
      const bobIfs = status?.routers?.bob?.interfaces || {};
      this.keyInterfacesBOB.filter(n => bobIfs[n]).forEach(name => {
        itemsToQuery.push({ name, dbKey: `bob_${name}`, rtr: "bob" });
      });
    } else {
      const hqIfs = status?.routers?.hq?.interfaces || status?.interfaces || {};
      this.keyInterfacesHQ.filter(n => hqIfs[n]).forEach(name => {
        itemsToQuery.push({ name, dbKey: name, rtr: "hq" });
      });
    }

    if (!itemsToQuery.length) {
      const available = Object.keys(status?.interfaces || {});
      itemsToQuery = available.slice(0, 6).map(name => ({ name, dbKey: name, rtr: "hq" }));
    }

    const queryIfaces = itemsToQuery.map(i => i.dbKey);
    const { series: trafficMap, stats: serverStats } = await fetchTraffic(range, queryIfaces);

    // Xây dựng danh sách series cho đồ thị (chiều In RX là trọng tâm của Network Traffic Basic)
    const seriesList = [];
    const legendItems = [];

    itemsToQuery.forEach((item, idx) => {
      const dbKey = item.dbKey;
      const color = PALETTE[idx % PALETTE.length];
      const pts = pickColumn(trafficMap, 1, dbKey).length ? pickColumn(trafficMap, 1, dbKey) : pickColumn(trafficMap, 1, item.name);
      const stats = serverStats[dbKey]?.rx || serverStats[item.name]?.rx || calcSeriesStats(pts);

      seriesList.push({
        name: `In - ${item.name}`,
        color,
        points: pts,
      });

      legendItems.push(`
        <div class="legend-row">
          <span class="legend-badge" style="color:${color}">— In - ${escapeHtml(item.name)}</span>
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
      height: 260,
      formatY: fmtBps,
      fill: true,
    });
  },
};
