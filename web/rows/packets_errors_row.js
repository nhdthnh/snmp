/**
 * Hàng / Khối [Image 2]: "Packets, Errors, CPU Temp & MTU"
 * Gồm:
 * 1. Biểu đồ Out Unicast, In Discard, Out Discard (p/s) kèm chú giải số liệu
 * 2. Biểu đồ Tx Eth errors và Rx Eth errors (kèm max, avg, cur)
 * 3. Biểu đồ CPU Temp theo thời gian
 * 4. Biểu đồ MTU của các cổng theo thời gian
 */
import { fmtPackets, fmtTemp, fmtErrors } from "../format.js";
import { PALETTE, renderLineChart, calcSeriesStats } from "../chart.js";
import { fetchMetrics } from "../api.js";

export const PacketsErrorsRow = {
  async load(range, status, activeRouter = "hq") {
    const isBob = activeRouter === "bob";
    const p = isBob ? "bob_" : "";
    const data = await fetchMetrics(range, [
      `${p}ucast_out`,
      `${p}drop_in`,
      `${p}drop_out`,
      `${p}err_out`,
      `${p}err_in`,
      `${p}temp`,
    ]);

    // 1. Biểu đồ Packets / Discards (Out Unicast, In Discard, Out Discard)
    const packetsCanvas = document.getElementById("packets-discards-canvas");
    const packetsLegend = document.getElementById("packets-discards-legend");
    if (packetsCanvas) {
      const ucastPts = data[`${p}ucast_out`] || data.ucast_out || [];
      const dropInPts = data[`${p}drop_in`] || data.drop_in || [];
      const dropOutPts = data[`${p}drop_out`] || data.drop_out || [];

      const ucastStat = calcSeriesStats(ucastPts);
      const dropInStat = calcSeriesStats(dropInPts);
      const dropOutStat = calcSeriesStats(dropOutPts);

      if (packetsLegend) {
        packetsLegend.innerHTML = `
          <span class="legend-tag"><i style="background:#b877d9"></i>Out Unicast: <b>${fmtPackets(ucastStat.last)}</b> (max ${fmtPackets(ucastStat.max)})</span>
          <span class="legend-tag"><i style="background:#5794f2"></i>In Discard: <b>${fmtPackets(dropInStat.last)}</b></span>
          <span class="legend-tag"><i style="background:#f2495c"></i>Out Discard: <b>${fmtPackets(dropOutStat.last)}</b></span>
        `;
      }

      renderLineChart(
        packetsCanvas,
        [
          { name: "Out Unicast", color: "#b877d9", points: ucastPts },
          { name: "In Discard", color: "#5794f2", points: dropInPts },
          { name: "Out Discard", color: "#f2495c", points: dropOutPts },
        ],
        {
          range,
          formatY: fmtPackets,
          fill: false,
        }
      );
    }

    // 2. Biểu đồ Tx Eth errors
    const txErrCanvas = document.getElementById("tx-errors-canvas");
    const txErrLegend = document.getElementById("tx-errors-legend");
    if (txErrCanvas) {
      const errOutPts = data[`${p}err_out`] || data.err_out || [];
      const stat = calcSeriesStats(errOutPts);
      if (txErrLegend) {
        txErrLegend.innerHTML = `<span>max: <b>${stat.max}</b> &nbsp; avg: <b>${stat.mean}</b> &nbsp; cur: <b>${stat.last}</b></span>`;
      }
      renderLineChart(
        txErrCanvas,
        [{ name: "Tx Errors", color: "#fade2a", points: errOutPts }],
        {
          range,
          formatY: fmtErrors,
          fill: false,
        }
      );
    }

    // 3. Biểu đồ Rx Eth errors
    const rxErrCanvas = document.getElementById("rx-errors-canvas");
    const rxErrLegend = document.getElementById("rx-errors-legend");
    if (rxErrCanvas) {
      const errInPts = data[`${p}err_in`] || data.err_in || [];
      const stat = calcSeriesStats(errInPts);
      if (rxErrLegend) {
        rxErrLegend.innerHTML = `<span>max: <b>${stat.max}</b> &nbsp; avg: <b>${stat.mean}</b> &nbsp; cur: <b>${stat.last}</b></span>`;
      }
      renderLineChart(
        rxErrCanvas,
        [{ name: "Rx Errors", color: "#e0e0e0", points: errInPts }],
        {
          range,
          formatY: fmtErrors,
          fill: false,
        }
      );
    }

    // 4. Biểu đồ CPU Temp
    const cpuTempCanvas = document.getElementById("cpu-temp-history-canvas");
    const cpuTempLegend = document.getElementById("cpu-temp-legend");
    if (cpuTempCanvas) {
      const tempPts = data[`${p}temp`] || data.temp || [];
      const stat = calcSeriesStats(tempPts);
      const rtrSys = isBob ? status.routers?.bob?.system : status.system;
      if (cpuTempLegend) {
        cpuTempLegend.innerHTML = `<span class="legend-tag"><i style="background:#f2495c"></i>CPU Temp: <b>${fmtTemp(stat.last || rtrSys?.temp)}</b></span>`;
      }
      renderLineChart(
        cpuTempCanvas,
        [{ name: "CPU Temp", color: "#f2495c", points: tempPts }],
        {
          range,
          formatY: fmtTemp,
          fill: false,
        }
      );
    }

    // 5. Biểu đồ MTU (MTU theo các interface của router đang chọn)
    const mtuCanvas = document.getElementById("mtu-chart-canvas");
    if (mtuCanvas) {
      const rtrStatus = isBob ? (status.routers?.bob || status) : (status.routers?.hq || status);
      const ifaces = rtrStatus.interfaces || {};
      const now = Math.floor(Date.now() / 1000);
      const mtuSeries = Object.entries(ifaces).map(([name, info], idx) => {
        const mtuVal = info.mtu || 1500;
        return {
          name,
          color: PALETTE[idx % PALETTE.length],
          points: [
            [now - range, mtuVal],
            [now, mtuVal],
          ],
        };
      });

      renderLineChart(mtuCanvas, mtuSeries, {
        range,
        formatY: v => `${v} MTU`,
        maxY: 1600,
        fill: false,
      });
    }
  },
};
