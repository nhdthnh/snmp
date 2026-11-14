import os

chart_content = """/**
 * Thư viện vẽ biểu đồ Canvas hiệu năng cao (chart.js).
 * Đảm bảo tỷ lệ khung hình 1:1, không bị co giãn chữ, không đè nhãn X/Y.
 * Hỗ trợ Responsive hoàn hảo trên Mobile, Tablet và Desktop.
 */
import { fmtTime } from "./format.js";

export const PALETTE = [
  "#73bf69", // Xanh lá
  "#fade2a", // Vàng chanh
  "#5794f2", // Xanh dương
  "#ff9830", // Cam
  "#f2495c", // Đỏ
  "#b877d9", // Tím
  "#00bcd4", // Cyan
  "#f2c94c", // Vàng đậm
  "#e07a5f", // Nâu cam
  "#8ab4f8", // Lam nhạt
  "#81c784", // Lục nhạt
  "#ffb74d", // Cam nhạt
];

const GRID_COLOR = "rgba(255, 255, 255, 0.08)";
const TEXT_COLOR = "#8b949e";

/** Làm tròn trần trục Y cho đẹp */
function niceCeil(v) {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const frac = v / Math.pow(10, exp);
  let niceFrac;
  if (frac <= 1) niceFrac = 1;
  else if (frac <= 2) niceFrac = 2;
  else if (frac <= 2.5) niceFrac = 2.5;
  else if (frac <= 5) niceFrac = 5;
  else niceFrac = 10;
  return niceFrac * Math.pow(10, exp);
}

/**
 * Tính Mean, Max, Min, Last của một chuỗi [[t, val], ...].
 */
export function calcSeriesStats(points = []) {
  if (!points || !points.length) {
    return { mean: 0, max: 0, min: 0, last: 0 };
  }
  let sum = 0, max = -Infinity, min = Infinity;
  for (const [, v] of points) {
    const val = Number(v) || 0;
    sum += val;
    if (val > max) max = val;
    if (val < min) min = val;
  }
  const last = Number(points[points.length - 1][1]) || 0;
  return {
    mean: Math.round(sum / points.length),
    max: Math.round(max),
    min: Math.round(min),
    last: Math.round(last),
  };
}

/**
 * Vẽ biểu đồ đường / vùng.
 */
export function renderLineChart(canvas, seriesList = [], options = {}) {
  if (!canvas) return;

  const parent = canvas.parentElement;
  const width = parent && parent.clientWidth > 0 ? parent.clientWidth : (canvas.clientWidth > 0 ? canvas.clientWidth : 600);
  const height = options.height || (canvas.clientHeight > 0 ? canvas.clientHeight : 160);

  if (width <= 0 || height <= 0) return;

  const dpr = window.devicePixelRatio || 1;

  // Responsive padding: co giãn lề trục Y để tối ưu diện tích trên màn hình điện thoại & máy tính bảng
  const isMobile = width < 480;
  const isTablet = width < 768;
  const padLeft = isMobile ? 48 : (isTablet ? 60 : 78);
  const padRight = isMobile ? 12 : 22;
  const padTop = 18;
  const padBottom = isMobile ? 24 : 28;
  const pad = { left: padLeft, right: padRight, top: padTop, bottom: padBottom };

  // Đặt kích thước style tường minh để trình duyệt không tự kéo giãn (stretch) bitmap
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const range = options.range || 3600;
  const endTs = options.endTs || Math.floor(Date.now() / 1000);
  const startTs = endTs - range;
  const formatY = options.formatY || (v => String(Math.round(v)));
  const fill = !!options.fill;

  // Tìm đỉnh Y cao nhất
  let maxVal = 0;
  for (const s of seriesList) {
    for (const [, v] of s.points || []) {
      if (v > maxVal) maxVal = v;
    }
  }
  const topY = options.maxY != null ? options.maxY : niceCeil(maxVal * 1.05 || 1);

  const xMap = t => pad.left + ((t - startTs) / range) * (width - pad.left - pad.right);
  const yMap = v => pad.top + (1 - Math.max(0, v) / topY) * (height - pad.top - pad.bottom);

  // Vẽ lưới ngang và nhãn trục Y
  ctx.font = isMobile ? "10px system-ui, -apple-system, sans-serif" : "11px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = TEXT_COLOR;
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;

  const ySteps = isMobile ? 3 : 4;
  for (let i = 0; i <= ySteps; i++) {
    const val = (topY / ySteps) * i;
    const y = yMap(val);
    
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.textAlign = "right";
    
    // Nâng nhãn số 0 lên 4px để không đè vào dòng thời gian trục X
    const labelY = (i === 0) ? y - 4 : (i === ySteps) ? y + 4 : y;
    ctx.textBaseline = "middle";
    ctx.fillText(formatY(val), pad.left - 6, labelY);
  }

  // Vẽ mốc thời gian trục X (tự động điều chỉnh số mốc trên Mobile để không bị đè nhãn)
  const xPoints = isMobile ? [0, 0.5, 1.0] : isTablet ? [0, 0.33, 0.66, 1.0] : [0, 0.25, 0.5, 0.75, 1.0];
  ctx.textBaseline = "bottom";
  for (let idx = 0; idx < xPoints.length; idx++) {
    const frac = xPoints[idx];
    const t = startTs + range * frac;
    const x = xMap(t);
    if (idx === 0) {
      ctx.textAlign = "left";
      ctx.fillText(fmtTime(t), pad.left + 4, height - 6);
    } else if (idx === xPoints.length - 1) {
      ctx.textAlign = "right";
      ctx.fillText(fmtTime(t), width - pad.right - 4, height - 6);
    } else {
      ctx.textAlign = "center";
      ctx.fillText(fmtTime(t), x, height - 6);
    }
  }

  // Vẽ từng chuỗi dữ liệu
  for (const s of seriesList) {
    const pts = (s.points || []).filter(p => p[0] >= startTs - 60 && p[0] <= endTs + 60);
    if (!pts.length) continue;

    const color = s.color || PALETTE[0];

    // Vẽ fill nếu có
    if (fill) {
      ctx.beginPath();
      ctx.moveTo(xMap(pts[0][0]), yMap(0));
      for (const p of pts) {
        ctx.lineTo(xMap(p[0]), yMap(p[1]));
      }
      ctx.lineTo(xMap(pts[pts.length - 1][0]), yMap(0));
      ctx.closePath();
      
      const grad = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
      grad.addColorStop(0, hexToRgba(color, 0.35));
      grad.addColorStop(1, hexToRgba(color, 0.02));
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Vẽ đường nét
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const x = xMap(p[0]);
      const y = yMap(p[1]);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Chấm tròn nếu có
    if (options.showDots) {
      ctx.fillStyle = color;
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(xMap(p[0]), yMap(p[1]), 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // Xử lý sự kiện di chuột & cảm ứng chạm trên điện thoại/máy tính bảng (Hover & Touch Tooltip)
  const handlePointer = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    if (mouseX < pad.left || mouseX > width - pad.right) {
      hideTip(canvas);
      return;
    }
    const tHover = startTs + ((mouseX - pad.left) / (width - pad.left - pad.right)) * range;
    
    const values = [];
    for (const s of seriesList) {
      if (!s.points || !s.points.length) continue;
      let nearest = s.points[0];
      let minDiff = Math.abs(nearest[0] - tHover);
      for (const p of s.points) {
        const diff = Math.abs(p[0] - tHover);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = p;
        }
      }
      values.push({ name: s.name, color: s.color, val: nearest[1] });
    }

    showTip(canvas, mouseX, mouseY, tHover, values, formatY);
  };

  canvas.onmousemove = ev => handlePointer(ev.clientX, ev.clientY);
  canvas.onmouseleave = () => hideTip(canvas);

  canvas.ontouchstart = ev => {
    if (ev.touches.length === 1) {
      handlePointer(ev.touches[0].clientX, ev.touches[0].clientY);
    }
  };
  canvas.ontouchmove = ev => {
    if (ev.touches.length === 1) {
      handlePointer(ev.touches[0].clientX, ev.touches[0].clientY);
    }
  };
  canvas.ontouchend = () => {
    setTimeout(() => hideTip(canvas), 2500);
  };
}

function hexToRgba(hex, alpha = 1) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x + x).join("");
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

function showTip(canvas, x, y, ts, values, formatY) {
  let tip = canvas.parentElement.querySelector(".chart-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "chart-tooltip";
    canvas.parentElement.style.position = "relative";
    canvas.parentElement.appendChild(tip);
  }
  const linesHtml = values
    .map(v => `<div class="tip-line"><i style="background:${v.color}"></i><span>${v.name}:</span> <b>${formatY(v.val)}</b></div>`)
    .join("");
  tip.innerHTML = `<div class="tip-time">${fmtTime(ts, true)}</div>${linesHtml}`;
  tip.style.display = "block";
  tip.style.left = `${Math.min(canvas.clientWidth - 160, Math.max(10, x + 15))}px`;
  tip.style.top = `${Math.max(10, y - 40)}px`;
}

function hideTip(canvas) {
  const tip = canvas.parentElement.querySelector(".chart-tooltip");
  if (tip) tip.style.display = "none";
}
"""

with open("web/chart.js", "w", encoding="utf-8") as f:
    f.write(chart_content)

print("Updated web/chart.js successfully!")
