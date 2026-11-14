with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

old_controls = """    <div class="header-controls">
      <!-- Chọn Router MikroTik xem SNMP -->
      <select id="router-select" class="control-select router-select" title="Chọn Router MikroTik xem chỉ số SNMP">
        <option value="hq" selected>🏢 HQ: RB3011UiAS (192.168.1.1)</option>
        <option value="bob">🏭 BOB: hAP ac² (192.168.4.1)</option>
      </select>

      <span id="last-updated-time" class="muted" style="font-size:12px;"></span>
      
      <!-- Chọn khoảng thời gian -->
      <select id="time-range-select" class="control-select">
        <option value="3600" selected>Last 1 hour</option>
        <option value="10800">Last 3 hours</option>
        <option value="21600">Last 6 hours</option>
        <option value="86400">Last 24 hours</option>
        <option value="604800">Last 7 days</option>
      </select>

      <!-- Chọn chu kỳ tự động cập nhật -->
      <select id="refresh-interval-select" class="control-select">
        <option value="10000">10s</option>
        <option value="30000" selected>30s</option>
        <option value="60000">1m</option>
        <option value="300000">5m</option>
        <option value="0">Tắt</option>
      </select>

      <!-- Nút làm mới thủ công -->
      <button id="manual-refresh-btn" class="icon-btn" title="Làm mới ngay">
        <span id="refresh-icon">↻</span>
      </button>
    </div>"""

new_controls = """    <div class="header-controls">
      <!-- Chọn Router MikroTik xem SNMP (Mặc định: Tất cả 2 Router HQ + BOB) -->
      <select id="router-select" class="control-select router-select" title="Chọn Router MikroTik xem chỉ số SNMP">
        <option value="all" selected>🌐 Cả 2 Router: HQ (RB3011) + BOB (hAP ac²)</option>
        <option value="hq">🏢 HQ: RB3011UiAS (192.168.1.1)</option>
        <option value="bob">🏭 BOB: hAP ac² (192.168.4.1)</option>
      </select>

      <span id="last-updated-time" class="muted" style="font-size:12px;"></span>
      
      <!-- Chọn khoảng thời gian -->
      <select id="time-range-select" class="control-select">
        <option value="3600" selected>Last 1 hour</option>
        <option value="10800">Last 3 hours</option>
        <option value="21600">Last 6 hours</option>
        <option value="86400">Last 24 hours</option>
        <option value="604800">Last 7 days</option>
      </select>

      <!-- Chọn chu kỳ tự động cập nhật -->
      <select id="refresh-interval-select" class="control-select">
        <option value="10000">10s</option>
        <option value="30000" selected>30s</option>
        <option value="60000">1m</option>
        <option value="300000">5m</option>
        <option value="0">Tắt</option>
      </select>

      <!-- Nút làm mới thủ công -->
      <button id="manual-refresh-btn" class="icon-btn" title="Làm mới ngay">
        <span id="refresh-icon">↻</span>
      </button>

      <!-- Menu tài khoản & Đăng xuất -->
      <div class="user-profile-menu">
        <span class="user-badge" title="Tài khoản đang đăng nhập">👤 system</span>
        <button id="logout-btn" class="logout-btn" title="Đăng xuất khỏi hệ thống">Đăng xuất</button>
      </div>
    </div>"""

html_norm = html.replace("\r\n", "\n")
old_controls_norm = old_controls.replace("\r\n", "\n")
new_controls_norm = new_controls.replace("\r\n", "\n")

assert old_controls_norm in html_norm, "old_controls not found in html"
html_norm = html_norm.replace(old_controls_norm, new_controls_norm, 1)

with open("web/index.html", "w", encoding="utf-8") as f:
    f.write(html_norm)

print("Updated web/index.html successfully!")
