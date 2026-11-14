with open("web/rows/topology_row.js", "r", encoding="utf-8") as f:
    content = f.read()

# Replace zoom fit and 100%
old_zoom = """    } else if (ev.target.id === "btn-zoom-fit") {
      currentZoom = 1.0;
      svgElem.style.width = "100%";
      svgElem.style.transform = "none";
    } else if (ev.target.id === "btn-zoom-100") {
      currentZoom = 1.0;
      svgElem.style.width = "2540px";
      svgElem.style.transform = "none";"""

new_zoom = """    } else if (ev.target.id === "btn-zoom-fit") {
      currentZoom = 1.0;
      svgElem.style.width = "100%";
      svgElem.style.minWidth = "0px";
      svgElem.style.transform = "none";
    } else if (ev.target.id === "btn-zoom-100") {
      currentZoom = 1.0;
      svgElem.style.width = "2540px";
      svgElem.style.minWidth = "2540px";
      svgElem.style.transform = "none";"""

# Replace touch handlers with pinch-to-zoom
old_touch = """  // Hỗ trợ cảm ứng trên màn hình chạm / máy tính bảng
  let touchStartX = 0, touchStartY = 0, touchSL = 0, touchST = 0;
  wrap.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchSL = wrap.scrollLeft;
      touchST = wrap.scrollTop;
    }
  }, { passive: true });

  wrap.addEventListener("touchmove", e => {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      wrap.scrollLeft = touchSL - dx;
      wrap.scrollTop = touchST - dy;
    }
  }, { passive: true });"""

new_touch = """  // Hỗ trợ cảm ứng vuốt đơn & phóng to 2 ngón (Pinch-to-zoom) trên điện thoại và máy tính bảng
  let touchStartX = 0, touchStartY = 0, touchSL = 0, touchST = 0;
  let initialPinchDist = 0;
  let initialPinchZoom = 1.0;

  wrap.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchSL = wrap.scrollLeft;
      touchST = wrap.scrollTop;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.hypot(dx, dy);
      initialPinchZoom = currentZoom;
    }
  }, { passive: true });

  wrap.addEventListener("touchmove", e => {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      wrap.scrollLeft = touchSL - dx;
      wrap.scrollTop = touchST - dy;
    } else if (e.touches.length === 2 && initialPinchDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / initialPinchDist;
      currentZoom = Math.max(0.4, Math.min(2.5, initialPinchZoom * factor));
      const svg = document.getElementById("topology-svg");
      if (svg) applyZoom(svg);
    }
  }, { passive: true });"""

c_norm = content.replace("\r\n", "\n")
old_zoom_norm = old_zoom.replace("\r\n", "\n")
new_zoom_norm = new_zoom.replace("\r\n", "\n")
old_touch_norm = old_touch.replace("\r\n", "\n")
new_touch_norm = new_touch.replace("\r\n", "\n")

assert old_zoom_norm in c_norm, "old_zoom not found"
c_norm = c_norm.replace(old_zoom_norm, new_zoom_norm, 1)

assert old_touch_norm in c_norm, "old_touch not found"
c_norm = c_norm.replace(old_touch_norm, new_touch_norm, 1)

with open("web/rows/topology_row.js", "w", encoding="utf-8") as f:
    f.write(c_norm)

print("Updated web/rows/topology_row.js successfully!")
