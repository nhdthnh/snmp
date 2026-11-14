/**
 * Hàng / Bảng [Image 1 & Image 4]: "Interfaces"
 * Bảng thông tin chi tiết các cổng: Type, Name, Status UP/DOWN, Link down count,
 * MAC, Rate, MTU, RX Sum, TX Sum, ifIndex 1, ifIndex 2.
 * Hỗ trợ Router HQ, Router BOB và chế độ Tất cả 2 Router (HQ + BOB).
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
  activeRouter: "all",

  initControls() {
    const searchInput = document.getElementById("if-search-input");
    const typeSelect = document.getElementById("if-type-select");
    const thead = document.getElementById("interfaces-table-head");

    if (searchInput) {
      searchInput.oninput = ev => {
        this.searchQuery = ev.target.value.trim();
        if (this.lastStatus) this.render(this.lastStatus, this.activeRouter);
      };
    }

    if (typeSelect) {
      typeSelect.onchange = ev => {
        this.filterType = ev.target.value;
        if (this.lastStatus) this.render(this.lastStatus, this.activeRouter);
      };
    }

    if (thead) {
      thead.onclick = ev => {
        const th = ev.target.closest("th.sortable");
        if (!th) return;
        const key = th.dataset.key;
        if (this.sortKey === key) {
          this.sortDir *= -1;
        } else {
          this.sortKey = key;
          this.sortDir = 1;
        }
        if (this.lastStatus) this.render(this.lastStatus, this.activeRouter);
      };
    }
  },

  sortedRows(status, activeRouter = "all") {
    const isBob = activeRouter === "bob";
    const isHq = activeRouter === "hq";
    const isAll = !isBob && !isHq;

    let rows = [];

    if (isHq || isAll) {
      const hqIfs = status?.routers?.hq?.interfaces || status?.interfaces || {};
      for (const [name, info] of Object.entries(hqIfs)) {
        rows.push({
          name,
          router: "HQ",
          rtrKey: "hq",
          ...info,
        });
      }
    }

    if (isBob || isAll) {
      const bobIfs = status?.routers?.bob?.interfaces || {};
      for (const [name, info] of Object.entries(bobIfs)) {
        rows.push({
          name,
          router: "BOB",
          rtrKey: "bob",
          ...info,
        });
      }
    }

    // Lọc theo search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      rows = rows.filter(r => 
        r.name.toLowerCase().includes(q) || 
        (r.mac && r.mac.toLowerCase().includes(q)) ||
        (r.router && r.router.toLowerCase().includes(q))
      );
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

  render(status, activeRouter = "all") {
    this.lastStatus = status;
    this.activeRouter = activeRouter;
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
    const rows = this.sortedRows(status, activeRouter);
    if (!rows.length) {
      table.innerHTML = `<tr><td colspan="${COLUMNS.length}" class="text-center muted p-3">Không có cổng nào phù hợp</td></tr>`;
      return;
    }

    const isAll = activeRouter === "all";

    table.innerHTML = rows.map(i => {
      const rtrBadge = isAll 
        ? (i.router === "BOB" 
            ? '<span class="badge badge-bob" style="font-size:10px; margin-right:6px; padding:1px 5px;">BOB</span>' 
            : '<span class="badge badge-hq" style="font-size:10px; margin-right:6px; padding:1px 5px;">HQ</span>')
        : "";

      return `
        <tr class="if-row" data-name="${escapeHtml(i.name)}">
          ${COLUMNS.map(c => {
            if (c.key === "name") {
              return `<td class="text-left">${rtrBadge}<b>${escapeHtml(i.name)}</b></td>`;
            }
            return `
              <td class="${c.num ? "text-right" : "text-left"}">
                ${c.cell ? c.cell(i) : escapeHtml(i[c.key])}
              </td>
            `;
          }).join("")}
        </tr>
      `;
    }).join("");

    // Click vào hàng để chuyển sang tab traffic
    table.querySelectorAll("tr.if-row").forEach(tr => {
      tr.onclick = () => {
        const name = tr.dataset.name;
        if (name) {
          window.dispatchEvent(new CustomEvent("netmon:focus-interface", { detail: { name } }));
        }
      };
    });
  },
};
