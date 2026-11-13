/**
 * Hàng / Bảng [Image 1 & Image 4]: "Interfaces"
 * Bảng thông tin chi tiết các cổng: Type, Name, Status UP/DOWN, Link down count,
 * MAC, Rate, MTU, RX Sum, TX Sum, ifIndex 1, ifIndex 2.
 * Hỗ trợ sắp xếp (sort), tìm kiếm (search), lọc loại cổng, và click để xem biểu đồ chi tiết.
 */
import { escapeHtml, fmtBytes, fmtRate } from "../format.js";

const COLUMNS = [
  { key: "type", title: "Type of interface" },
  { key: "name", title: "Name" },
  {
    key: "up",
    title: "Status link/states",
    cell: i => `<span class="badge ${i.up ? "badge-up" : "badge-down"}">${i.up ? "UP" : "DOWN"}</span>`,
  },
  { key: "link_downs", title: "Link down count", num: true, cell: i => `<span class="${i.link_downs > 0 ? "c-yellow" : ""}">${i.link_downs || 0}</span>` },
  { key: "mac", title: "MAC", cell: i => `<span class="mono">${i.mac || "–"}</span>` },
  { key: "speed", title: "Rate", cell: i => `<span class="${i.speed >= 1e9 ? "c-green" : i.speed > 0 ? "c-blue" : "muted"}">${fmtRate(i.speed)}</span>` },
  { key: "mtu", title: "MTU", num: true },
  { key: "rx_bytes", title: "RX Sum", num: true, cell: i => `<span class="c-yellow">${fmtBytes(i.rx_bytes)}</span>` },
  { key: "tx_bytes", title: "TX Sum", num: true, cell: i => `<span class="c-yellow">${fmtBytes(i.tx_bytes)}</span>` },
  { key: "if_index", title: "ifIndex 1", num: true },
  { key: "if_index", title: "ifIndex 2", num: true },
];

export const InterfacesTableRow = {
  sortKey: "if_index",
  sortDir: 1,
  filterType: "all",
  searchQuery: "",
  lastStatus: null,

  sortedRows(interfaces) {
    let rows = Object.entries(interfaces || {}).map(([name, info]) => ({
      name,
      ...info,
    }));

    // Lọc theo search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || (r.mac && r.mac.toLowerCase().includes(q)));
    }

    // Lọc theo loại interface
    if (this.filterType !== "all") {
      rows = rows.filter(r => r.type === this.filterType);
    }

    // Sắp xếp
    if (this.sortKey) {
      rows.sort((a, b) => {
        let va = a[this.sortKey];
        let vb = b[this.sortKey];
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va > vb) return 1 * this.sortDir;
        if (va < vb) return -1 * this.sortDir;
        return 0;
      });
    }

    return rows;
  },

  render(status) {
    this.lastStatus = status;
    const table = document.getElementById("interfaces-table-body");
    const thead = document.getElementById("interfaces-table-head");
    if (!table || !thead) return;

    // Header bảng
    thead.innerHTML = `
      <tr>
        ${COLUMNS.map(c => `
          <th class="${c.num ? "text-right" : "text-left"} sortable" data-key="${c.key}">
            ${c.title}
            ${this.sortKey === c.key ? (this.sortDir > 0 ? " ▲" : " ▼") : ""}
          </th>
        `).join("")}
      </tr>
    `;

    // Dữ liệu bảng
    const rows = this.sortedRows(status.interfaces);
    if (!rows.length) {
      table.innerHTML = `<tr><td colspan="${COLUMNS.length}" class="text-center muted p-3">Không có cổng nào phù hợp</td></tr>`;
      return;
    }

    table.innerHTML = rows.map(i => `
      <tr class="if-row" data-name="${escapeHtml(i.name)}">
        ${COLUMNS.map(c => `
          <td class="${c.num ? "text-right" : "text-left"}">
            ${c.cell ? c.cell(i) : escapeHtml(i[c.key])}
          </td>
        `).join("")}
      </tr>
    `).join("");

    // Bắt sự kiện click
    thead.onclick = ev => {
      const th = ev.target.closest("th[data-key]");
      if (th) {
        const key = th.dataset.key;
        this.sortDir = this.sortKey === key ? -this.sortDir : 1;
        this.sortKey = key;
        this.render(this.lastStatus);
      }
    };

    table.onclick = ev => {
      const tr = ev.target.closest("tr[data-name]");
      if (tr) {
        const ifaceName = tr.dataset.name;
        window.dispatchEvent(new CustomEvent("netmon:focus-interface", { detail: { name: ifaceName } }));
      }
    };
  },

  initControls() {
    const searchInput = document.getElementById("if-search-input");
    const typeSelect = document.getElementById("if-type-select");

    if (searchInput) {
      searchInput.oninput = ev => {
        this.searchQuery = ev.target.value.trim();
        if (this.lastStatus) this.render(this.lastStatus);
      };
    }
    if (typeSelect) {
      typeSelect.onchange = ev => {
        this.filterType = ev.target.value;
        if (this.lastStatus) this.render(this.lastStatus);
      };
    }
  },

  load(range, status) {
    this.render(status);
  },
};
