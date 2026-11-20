/**
 * Main Application Orchestrator (app.js).
 * Nhập các module hàng (rows), điều phối chu kỳ tải dữ liệu, chuyển tab, và phản hồi tương tác người dùng.
 */
import { fetchStatus, logoutUser } from "./api.js";
import { fmtTime } from "./format.js";

// Nhập các thành phần hàng độc lập
import { TotalRow } from "./rows/total_row.js";
import { StatsRow } from "./rows/stats_row.js";
import { TrafficBasicRow } from "./rows/traffic_basic_row.js";
import { TrafficGridRow } from "./rows/traffic_grid_row.js";
import { PacketsErrorsRow } from "./rows/packets_errors_row.js";
import { InterfacesTableRow } from "./rows/interfaces_table_row.js";
import { NeighborsRow } from "./rows/neighbors_row.js";
import { SnmpRow } from "./rows/snmp_row.js";
import { TopologyRow } from "./rows/topology_row.js";
import { WanCardsRow } from "./rows/wan_cards_row.js";
import { DualRow } from "./rows/dual_row.js";
import { prefs, applyTheme, currentTheme, toggleTheme } from "./theme.js";

class NetMonApp {
  constructor() {
    this.range = 3600;            // Mặc định 1 giờ qua (khớp ảnh "Last 1 hour")
    this.refreshInterval = 30000; // Mặc định 30 giây
    this.timer = null;
    this.status = null;
    this.activeTab = "all";
    this.activeRouter = prefs.get("router", "all"); // "all" (Cả 2 Router) | "hq" | "bob"
    if (!["all", "hq", "bob"].includes(this.activeRouter)) this.activeRouter = "all";
    this.isRefreshing = false;
  }

  /** Router dùng cho các mục bên dưới: các row tự xử lý mode "all" (gộp HQ + BOB). */
  get effRouter() {
    return this.activeRouter;
  }

  applyRouterView() {
    document.body.classList.toggle("view-both", this.activeRouter === "all");
    const sel = document.getElementById("router-select");
    if (sel) sel.value = this.activeRouter;
  }

  setRouter(value) {
    this.activeRouter = value;
    prefs.set("router", value);
    this.applyRouterView();
    if (this.status) {
      this.renderStatus(this.status);
      this.loadHistory();
    }
  }

  async init() {
    applyTheme(currentTheme());
    this.bindEvents();
    this.applyRouterView();
    InterfacesTableRow.initControls();
    await this.refresh(true);
    this.resetTimer();
  }

  bindEvents() {
    // Dropdown chọn router MikroTik xem SNMP (HQ vs BOB)
    const routerSelect = document.getElementById("router-select");
    if (routerSelect) {
      routerSelect.onchange = ev => this.setRouter(ev.target.value);
    }

    // Nút đổi giao diện sáng / tối
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.onclick = () => {
        toggleTheme();
        if (this.status) {
          this.renderStatus(this.status);
          this.loadHistory();
        }
      };
    }

    // Dropdown chọn khoảng thời gian
    const rangeSelect = document.getElementById("time-range-select");
    if (rangeSelect) {
      rangeSelect.onchange = ev => {
        this.range = Number(ev.target.value);
        this.loadHistory();
      };
    }

    // Dropdown chọn chu kỳ tự động cập nhật
    const intervalSelect = document.getElementById("refresh-interval-select");
    if (intervalSelect) {
      intervalSelect.onchange = ev => {
        this.refreshInterval = Number(ev.target.value);
        this.resetTimer();
      };
    }

    // Nút làm mới thủ công
    const refreshBtn = document.getElementById("manual-refresh-btn");
    if (refreshBtn) {
      refreshBtn.onclick = () => this.refresh(true);
    }

    // Nút đăng xuất
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.onclick = () => logoutUser();
    }

    // Tab điều hướng
    const navTabs = document.querySelectorAll(".nav-tab");
    navTabs.forEach(tab => {
      tab.onclick = () => {
        navTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.switchTab(tab.dataset.tab);
      };
    });

    // Thu gọn / mở rộng các hàng (Collapsible rows)
    document.querySelectorAll(".collapsible-header").forEach(header => {
      header.onclick = () => {
        const targetId = header.dataset.target;
        const body = document.getElementById(targetId);
        const arrow = header.querySelector(".arrow-icon");
        if (body) {
          const isCollapsed = body.classList.toggle("collapsed");
          if (arrow) arrow.textContent = isCollapsed ? "▶" : "▼";
          if (!isCollapsed && this.status) {
            requestAnimationFrame(() => this.loadHistory());
          }
        }
      };
    });

    // Lắng nghe sự kiện click từ bảng interface để nhảy sang biểu đồ chi tiết
    window.addEventListener("netmon:focus-interface", ev => {
      const ifName = ev.detail?.name;
      if (ifName) {
        TrafficGridRow.focus(ifName);
        this.switchTab("traffic");
        const trafficTabBtn = document.querySelector('.nav-tab[data-tab="traffic"]');
        if (trafficTabBtn) {
          document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
          trafficTabBtn.classList.add("active");
        }
        TrafficGridRow.load(this.range, this.status);
        const container = document.getElementById("section-traffic-grid");
        if (container) container.scrollIntoView({ behavior: "smooth" });
      }
    });

    window.addEventListener("netmon:reload-traffic", () => {
      if (this.status) {
        TrafficGridRow.load(this.range, this.status);
      }
    });

    window.addEventListener("netmon:refresh-topology", () => {
      if (this.status) {
        TopologyRow.render(this.status);
      }
    });

    window.addEventListener("netmon:switch-tab", ev => {
      const tab = ev.detail?.tab;
      if (tab) {
        const tabBtn = document.querySelector(`.nav-tab[data-tab="${tab}"]`);
        if (tabBtn) {
          document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
          tabBtn.classList.add("active");
        }
        this.switchTab(tab);
        const sec = document.querySelector(`.dashboard-section[data-tab="${tab}"]`);
        if (sec) sec.scrollIntoView({ behavior: "smooth" });
      }
    });

    window.addEventListener("resize", () => {
      requestAnimationFrame(() => this.loadHistory());
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const sections = document.querySelectorAll(".dashboard-section");

    const mainEl = document.querySelector("main");
    if (tabName === "topology") {
      document.body.classList.add("tab-topology-active");
      if (mainEl) mainEl.classList.add("main-full-width");
    } else {
      document.body.classList.remove("tab-topology-active");
      if (mainEl) mainEl.classList.remove("main-full-width");
    }

    sections.forEach(sec => {
      const secTab = sec.dataset.tab;
      if (
        tabName === "all" ||
        secTab === tabName ||
        (tabName === "overview" && (secTab === "total" || secTab === "traffic-basic" || secTab === "interfaces"))
      ) {
        sec.style.display = "";
      } else {
        sec.style.display = "none";
      }
    });

    // Khi chuyển tab, đợi layout DOM hoàn tất rồi vẽ lại toàn bộ đồ thị theo đúng kích thước mới
    requestAnimationFrame(() => {
      if (this.status) {
        this.loadHistory();
        if (tabName === "topology" || tabName === "all") {
          TopologyRow.render(this.status);
        }
      }
    });
  }

  resetTimer() {
    if (this.timer) clearInterval(this.timer);
    if (this.refreshInterval > 0) {
      this.timer = setInterval(() => this.refresh(false), this.refreshInterval);
    }
  }

  async refresh(isManual = false) {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    const refreshIcon = document.getElementById("refresh-icon");
    if (refreshIcon) refreshIcon.classList.add("spinning");

    try {
      this.status = await fetchStatus();
      this.renderStatus(this.status);
      await this.loadHistory();
      this.updateHeaderTime(this.status.ts);
    } catch (err) {
      console.warn("[NetMon] Không thể tải trạng thái:", err);
      const pill = document.getElementById("connection-status-pill");
      if (pill) {
        pill.className = "status-pill status-warn";
        pill.textContent = "Mất kết nối server NetMon";
      }
    } finally {
      this.isRefreshing = false;
      if (refreshIcon) {
        setTimeout(() => refreshIcon.classList.remove("spinning"), 500);
      }
    }
  }

  renderStatus(status) {
    const activeRtr = this.activeRouter === "bob" ? status.routers?.bob : status.routers?.hq;
    const rtrStatus = activeRtr || status;

    // 1. Cập nhật thanh trạng thái 2 router (HQ & BOB)
    const pill = document.getElementById("connection-status-pill");
    const bobPill = document.getElementById("bob-status-pill");

    if (pill) {
      const hq = status.routers?.hq?.router || status.router;
      const isUp = hq?.up;
      const isDemo = hq?.demo;
      if (isUp) {
        pill.className = "status-pill status-online";
        pill.textContent = `HQ Online · RB3011`;
      } else if (isDemo) {
        pill.className = "status-pill status-demo";
        pill.textContent = `HQ Demo · RB3011`;
      } else {
        pill.className = "status-pill status-offline";
        pill.textContent = `HQ Offline`;
      }
    }

    if (bobPill) {
      const bob = status.routers?.bob?.router;
      const isUp = bob?.up;
      const isDemo = bob?.demo;
      if (isUp) {
        bobPill.className = "status-pill status-online";
        bobPill.textContent = `BOB Online · hAP ac² (SNMP)`;
      } else if (isDemo) {
        bobPill.className = "status-pill status-demo";
        bobPill.textContent = `BOB Demo · hAP ac² (SNMP)`;
      } else {
        bobPill.className = "status-pill status-offline";
        bobPill.textContent = `BOB Offline`;
      }
    }

    // 2. Render các khối trạng thái tức thời theo router được chọn
    try { TotalRow.render(status, this.activeRouter); } catch (e) { console.error("TotalRow.render error:", e); }
    try { StatsRow.render(status, this.activeRouter); } catch (e) { console.error("StatsRow.render error:", e); }
    try { WanCardsRow.render(status, this.activeRouter); } catch (e) { console.error("WanCardsRow.render error:", e); }
    if (this.activeRouter === "all") {
      try { DualRow.render(status); } catch (e) { console.error("DualRow.render error:", e); }
    }
    try { InterfacesTableRow.render(status, this.activeRouter); } catch (e) { console.error("InterfacesTableRow.render error:", e); }
    try { NeighborsRow.render(rtrStatus); } catch (e) { console.error("NeighborsRow.render error:", e); }
    try { SnmpRow.render(rtrStatus); } catch (e) { console.error("SnmpRow.render error:", e); }
    try { TopologyRow.render(status); } catch (e) { console.error("TopologyRow.render error:", e); }
  }

  async loadHistory() {
    if (!this.status) return;
    const r = this.range;
    const s = this.status;
    const activeRouter = this.effRouter;

    // Chế độ "Cả 2 Router": vẽ 2 khối HQ / BOB riêng biệt
    if (this.activeRouter === "all") {
      DualRow.load(r).catch(e => console.error("DualRow.load error:", e));
    }

    // Tải song song lịch sử cho các hàng đồ thị theo router đang chọn (HQ vs BOB)
    await Promise.allSettled([
      TotalRow.loadSystemChart(r, activeRouter).catch(e => console.error("loadSystemChart error:", e)),
      WanCardsRow.load(r, s, activeRouter).catch(e => console.error("WanCardsRow.load error:", e)),
      TrafficBasicRow.load(r, s, activeRouter).catch(e => console.error("TrafficBasicRow.load error:", e)),
      TrafficGridRow.load(r, s, activeRouter).catch(e => console.error("TrafficGridRow.load error:", e)),
      PacketsErrorsRow.load(r, s, activeRouter).catch(e => console.error("PacketsErrorsRow.load error:", e)),
      SnmpRow.loadTempChart(r, activeRouter).catch(e => console.error("loadTempChart error:", e)),
    ]);
  }

  updateHeaderTime(ts) {
    const timeEl = document.getElementById("last-updated-time");
    if (timeEl) {
      timeEl.textContent = `Cập nhật: ${fmtTime(ts, true)}`;
    }
  }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  const app = new NetMonApp();
  app.init();
});
