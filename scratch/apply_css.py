with open("web/style.css", "r", encoding="utf-8") as f:
    css = f.read()

responsive_addon = """

/* ==========================================================================
   NETMON RESPONSIVE SYSTEM (TABLET & MOBILE)
   ========================================================================== */

/* 1. Touch Optimization & Base Adjustments */
html {
  -webkit-text-size-adjust: 100%;
}

button, select, input, .nav-tab, .pill-btn, .zoom-btn, .chip-btn, .collapsible-header {
  touch-action: manipulation;
}

/* Tooltip hiển thị đẹp mắt và không bị tràn viền */
.chart-tooltip {
  position: absolute;
  background: rgba(15, 20, 30, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11.5px;
  color: var(--text-bright);
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  max-width: 90vw;
}

.tip-time {
  color: var(--text-muted);
  font-size: 10.5px;
  margin-bottom: 4px;
}

.tip-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.tip-line i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* 2. Tablet Screen Adjustments (max-width: 1024px) */
@media (max-width: 1024px) {
  main {
    padding: 14px 16px 36px;
    gap: 16px;
  }

  .total-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px;
  }

  .system-card {
    grid-column: 1 / -1;
  }

  .stats-bar-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }

  .wan-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .traffic-panels-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 12px;
  }

  .snmp-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .snmp-grid > .card:last-child {
    grid-column: 1 / -1;
  }

  .two-cols-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .topo-wrap {
    min-height: 520px;
    max-height: 72vh;
    padding: 16px;
  }

  .topo-toolbar {
    gap: 10px;
  }
}

/* 3. Small Tablet & Phablet (max-width: 768px) */
@media (max-width: 768px) {
  /* Header */
  .top-header {
    padding: 10px 12px;
    gap: 10px;
    flex-direction: column;
    align-items: stretch;
  }

  .brand-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 8px;
    flex-wrap: wrap;
  }

  .breadcrumb {
    font-size: 14px;
  }

  .status-pill {
    font-size: 11px;
    padding: 2.5px 8px;
  }

  .header-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .router-select {
    flex: 1 1 100%;
    font-size: 12.5px;
    padding: 7px 10px;
  }

  #last-updated-time {
    display: none;
  }

  #time-range-select {
    flex: 1 1 auto;
    font-size: 12px;
    padding: 6px 8px;
    min-width: 90px;
  }

  #refresh-interval-select {
    flex: 0 0 auto;
    font-size: 12px;
    padding: 6px 8px;
  }

  #manual-refresh-btn {
    width: 36px;
    height: 33px;
    padding: 0;
  }

  /* Nav Tabs */
  .nav-tabs-bar {
    padding: 0 12px;
    gap: 12px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .nav-tabs-bar::-webkit-scrollbar {
    display: none;
  }

  .nav-tab {
    font-size: 12px;
    padding: 10px 4px;
    flex-shrink: 0;
  }

  /* Main Container */
  main {
    padding: 12px 10px 30px;
    gap: 14px;
  }

  /* Gauges in 2x2 Grid + System Card */
  .total-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px;
  }

  .gauge-card {
    padding: 8px 6px;
  }

  .gauge-title {
    font-size: 11.5px;
  }

  .gauge-svg-wrap {
    max-width: 140px;
  }

  .system-card {
    grid-column: 1 / -1;
    padding: 10px 12px;
  }

  .system-legend {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 10.5px;
  }

  /* Stats Rows */
  .stats-bar-grid {
    grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
    gap: 6px;
  }

  .stat-card {
    padding: 6px 8px;
  }

  .stat-label {
    font-size: 10px;
    margin-bottom: 2px;
  }

  .stat-value {
    font-size: 12.5px;
  }

  /* WAN Cards */
  .wan-cards-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .wan-metric-card {
    padding: 12px 14px;
  }

  .wan-card-header {
    margin-bottom: 10px;
  }

  .wan-card-title {
    font-size: 14.5px;
  }

  .wan-rates-grid {
    padding: 8px 10px;
    gap: 8px;
    margin-bottom: 10px;
  }

  .rate-label {
    font-size: 11px;
  }

  .rate-value {
    font-size: 18px;
  }

  /* Traffic Grid & Chips */
  .traffic-panels-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .traffic-chips-wrap {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 6px;
    gap: 6px;
  }

  .traffic-chips-wrap::-webkit-scrollbar {
    display: none;
  }

  .chip-btn {
    flex-shrink: 0;
    font-size: 11px;
    padding: 5px 10px;
  }

  .traffic-canvas {
    height: 150px;
  }

  /* Sticky Column for Tables */
  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .card-head {
    flex-direction: column;
    align-items: stretch !important;
    gap: 8px;
  }

  .card-head > div {
    flex-direction: column;
    align-items: stretch !important;
    width: 100%;
    gap: 6px;
  }

  #if-search-input,
  #if-type-select {
    width: 100% !important;
    min-width: 0 !important;
  }

  table {
    font-size: 11.5px;
  }

  th, td {
    padding: 6px 8px;
  }

  table th:nth-child(2),
  table td:nth-child(2) {
    position: sticky;
    left: 0;
    background: #181b1f;
    z-index: 2;
    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.45);
  }

  table th:nth-child(2) {
    background: #1f2329;
  }

  /* SNMP Boxes */
  .snmp-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .snmp-stat-box {
    padding: 10px 8px;
  }

  .snmp-huge-number {
    font-size: 24px;
  }

  .stat-label {
    font-size: 10.5px;
  }

  /* Topology Toolbar & Canvas */
  .topo-controls-wrap {
    padding: 8px 10px 0;
  }

  .topo-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding-bottom: 8px;
  }

  .site-pills {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;
    width: 100%;
    gap: 6px;
  }

  .site-pills::-webkit-scrollbar {
    display: none;
  }

  .pill-btn {
    flex-shrink: 0;
    font-size: 11px;
    padding: 6px 11px;
  }

  .zoom-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    width: 100%;
  }

  .zoom-btn {
    flex: 1 1 auto;
    min-width: 44px;
    padding: 6px 6px;
    font-size: 11px;
    text-align: center;
  }

  .topo-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    font-size: 10.5px;
  }

  .topo-wrap {
    min-height: 400px;
    max-height: 60vh;
    padding: 10px 8px;
  }

  body.tab-topology-active .topo-wrap {
    height: calc(100vh - 120px) !important;
    max-height: calc(100vh - 120px) !important;
  }
}

/* 4. Compact Mobile (max-width: 400px) */
@media (max-width: 400px) {
  .breadcrumb {
    font-size: 13px;
  }

  .stats-bar-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .gauge-svg-wrap {
    max-width: 125px;
  }

  .topo-wrap {
    min-height: 350px;
  }
}
"""

with open("web/style.css", "a", encoding="utf-8") as f:
    f.write(responsive_addon)

print("Appended responsive system to web/style.css successfully!")
