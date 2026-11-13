/**
 * Hàng / Bảng [Image 4]: "Neighbors" (Thiết bị lân cận phát hiện qua MNDP/LLDP)
 * Cột: Neighbor index, identity, IP, MAC.
 */
import { escapeHtml } from "../format.js";

export const NeighborsRow = {
  render(status) {
    const list = status.neighbors || [];
    const tbody = document.getElementById("neighbors-table-body");
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center muted p-3">Chưa có thiết bị lân cận nào được phát hiện</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(n => `
      <tr>
        <td class="text-left">${escapeHtml(n.index || "–")}</td>
        <td class="text-left font-semibold">${escapeHtml(n.identity || "Unknown")}</td>
        <td class="text-left mono c-blue">${escapeHtml(n.ip || "–")}</td>
        <td class="text-left mono muted">${escapeHtml(n.mac || "–")}</td>
      </tr>
    `).join("");
  },

  load(range, status) {
    this.render(status);
  },
};
