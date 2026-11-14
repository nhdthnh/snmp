with open("web/app.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Import logoutUser
old_import = """import { fetchStatus } from "./api.js";"""
new_import = """import { fetchStatus, logoutUser } from "./api.js";"""

assert old_import in code, "old_import not found"
code = code.replace(old_import, new_import, 1)

# 2. activeRouter default = "all"
old_router = """    this.activeRouter = "hq";     // "hq" (RB3011UiAS) | "bob" (hAP ac²)"""
new_router = """    this.activeRouter = "all";    // Mặc định: "all" (Cả 2 Router HQ & BOB)"""

assert old_router in code, "old_router not found"
code = code.replace(old_router, new_router, 1)

# 3. Add logout button binding
old_refresh_btn = """    // Nút làm mới thủ công
    const refreshBtn = document.getElementById("manual-refresh-btn");
    if (refreshBtn) {
      refreshBtn.onclick = () => this.refresh(true);
    }"""

new_refresh_btn = """    // Nút làm mới thủ công
    const refreshBtn = document.getElementById("manual-refresh-btn");
    if (refreshBtn) {
      refreshBtn.onclick = () => this.refresh(true);
    }

    // Nút đăng xuất
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.onclick = () => logoutUser();
    }"""

assert old_refresh_btn in code, "old_refresh_btn not found"
code = code.replace(old_refresh_btn, new_refresh_btn, 1)

# 4. Update renderStatus calls
old_render_calls = """    // 2. Render các khối trạng thái tức thời theo router được chọn
    try { TotalRow.render(rtrStatus); } catch (e) { console.error("TotalRow.render error:", e); }
    try { StatsRow.render(rtrStatus); } catch (e) { console.error("StatsRow.render error:", e); }
    try { WanCardsRow.render(status, this.activeRouter); } catch (e) { console.error("WanCardsRow.render error:", e); }
    try { InterfacesTableRow.render(rtrStatus); } catch (e) { console.error("InterfacesTableRow.render error:", e); }
    try { NeighborsRow.render(rtrStatus); } catch (e) { console.error("NeighborsRow.render error:", e); }
    try { SnmpRow.render(rtrStatus); } catch (e) { console.error("SnmpRow.render error:", e); }
    try { TopologyRow.render(status); } catch (e) { console.error("TopologyRow.render error:", e); }"""

new_render_calls = """    // 2. Render các khối trạng thái tức thời theo router được chọn
    try { TotalRow.render(status, this.activeRouter); } catch (e) { console.error("TotalRow.render error:", e); }
    try { StatsRow.render(status, this.activeRouter); } catch (e) { console.error("StatsRow.render error:", e); }
    try { WanCardsRow.render(status, this.activeRouter); } catch (e) { console.error("WanCardsRow.render error:", e); }
    try { InterfacesTableRow.render(status, this.activeRouter); } catch (e) { console.error("InterfacesTableRow.render error:", e); }
    try { NeighborsRow.render(rtrStatus); } catch (e) { console.error("NeighborsRow.render error:", e); }
    try { SnmpRow.render(rtrStatus); } catch (e) { console.error("SnmpRow.render error:", e); }
    try { TopologyRow.render(status); } catch (e) { console.error("TopologyRow.render error:", e); }"""

assert old_render_calls in code, "old_render_calls not found"
code = code.replace(old_render_calls, new_render_calls, 1)

with open("web/app.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated web/app.js successfully!")
